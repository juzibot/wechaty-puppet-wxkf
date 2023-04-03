import { PuppetWxkfOptions, WxkfAuth } from '../schema/base'
import { getAuthData, getPort } from '../util/env'
import { CallbackServer } from './callback-server'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { MINUTE, SECOND, timestampToMilliseconds } from '../util/time'
import { ExecQueueService } from './exec-queue'
import { baseUrl, RequestTypeMapping, RequestTypes, ResponseTypeMapping, urlMapping } from '../schema/mapping'
import WxkfError from '../error/error'
import { WXKF_ERROR, WXKF_ERROR_CODE } from '../error/error-code'
import { FileMessageTypes, FileTypes, GetAccessTokenRequest, GetAccessTokenResponse, GetKfAccountListRequest, ImageMessage, MessageTypes, MsgType, SendMessageRequest, TextMessage, TrueOrFalse, UploadMediaRequest, UploadMediaResponse, VoiceFormat, WxkfMessage } from '../schema/request'
import { Logger } from '../wechaty-dep'
import { CacheService } from './cache'
import { HISTORY_MESSAGE_TIME_THRESHOLD } from '../util/constant'
import { ManagerEvents } from '../schema/event'
import TypedEmitter from 'typed-emitter'
import EventEmitter from 'node:events'
import { convertMessageToPayload } from '../util/message-helper'
import { convertContactToPayload } from '../util/contact-helper'
import { FileBox } from '../filebox-dep'
import path from 'path'
import { FILE_SIZE_THRESHOLD, FileTempDir, getContentType, getDefaultFilename, getFileType } from '../util/file-helper'
import fs from 'fs-extra'
import { v4 as uuidV4 } from 'uuid'
import { VoiceMessage } from '../schema/request'
import { VideoMessage } from '../schema/request'
import { FileMessage } from '../schema/request'
import FormData from 'form-data'

export class Manager extends (EventEmitter as new () => TypedEmitter<ManagerEvents>) {
  private readonly logger = new Logger(Manager.name)

  private readonly callbackServer: CallbackServer
  private readonly authData: WxkfAuth

  private readonly postRequestInstance: AxiosInstance
  private readonly cacheService: CacheService

  private accessToken?: string
  private accessTokenExpireTime?: number
  private accessTokenTimestamp?: number
  private accessTokenRenewTimer: NodeJS.Timeout

  constructor(options: PuppetWxkfOptions) {
    super()
    const authData = getAuthData(options['authData'])
    this.authData = authData
    const port = getPort(options.callbackPort)

    this.callbackServer = new CallbackServer(authData, port)
    this.callbackServer.on('message', this.messageHandler.bind(this) as typeof this.messageHandler)

    this.cacheService = new CacheService(this.authData.kfOpenId)

    this.postRequestInstance = axios.create({
      baseURL: baseUrl,
      timeout: 10 * SECOND,
    })
    this.postRequestInstance.interceptors.request.use(async (config) => {
      let accessToken = this.accessToken
      if (!this.accessToken) {
        await this.getAccessToken()
      }
      accessToken = this.accessToken
      if (!accessToken) {
        throw new WxkfError(WXKF_ERROR.AUTH_ERROR, `cannot get access token`)
      }
      config.params = {
        ...config.params,
        access_token: accessToken
      }

      return config
    })
  }

  async onStart() {
    this.logger.info('onStart()')
    await this.getSelfInfo()

    fs.mkdirpSync(FileTempDir)
    this.emit('login', {
      contactId: this.authData.kfOpenId
    })
    await this.syncMessage()
    this.emit('ready', {
      data: 'data ready'
    })
  }

  async onStop() {
    await this.cacheService.onStop()
    this.callbackServer.onStop()
  }

  private async getAccessToken() {
    return ExecQueueService.exec(async () => {
      if (Date.now() - this.accessTokenTimestamp < 10 * MINUTE && this.accessToken) {
        return
      }
  
      const response = await axios.get<GetAccessTokenRequest, AxiosResponse<GetAccessTokenResponse>>(`${baseUrl}${urlMapping[RequestTypes.GET_ACCESS_TOKEN]}`, {
        params: {
          corpid: this.authData.corpId,
          corpsecret: this.authData.corpSecret
        }
      })
  
      this.accessToken = response.data.access_token
      this.accessTokenExpireTime = Date.now() + response.data.expires_in * 1000
      this.accessTokenTimestamp = Date.now()

      if (this.accessTokenRenewTimer) {
        clearTimeout(this.accessTokenRenewTimer)
      }
      this.accessTokenRenewTimer = setTimeout(() => {
        void this.getAccessToken()
      })
    }, {
      queueId: 'get-access-token',
      delayAfter: 100,
    })

  }

  private async request<T extends RequestTypes>(type: T, data: RequestTypeMapping[T]):Promise<ResponseTypeMapping[T]> {
    this.logger.info(`request(${RequestTypes[type]}, ${JSON.stringify(data)})`)
    const response = await this.postRequestInstance.post<RequestTypeMapping[T], AxiosResponse<ResponseTypeMapping[T]>>(urlMapping[type], data)

    const responseData = response.data
    if (responseData.errcode) {
      throw new WxkfError(WXKF_ERROR_CODE.SERVER_ERROR, `request error with code: ${responseData.errcode}, message: ${responseData.errmsg}`)
    }

    this.logger.info(`response(${RequestTypes[type]}): ${JSON.stringify(response.data)}`)
    return response.data
  }

  private messageHandler(token: string) {
    this.logger.info(`onMessage(${token})`)

    void this.syncMessage(token)
  }

  private async syncMessage(token?: string) {
    this.logger.info(`syncMessage(${token})`)
    await ExecQueueService.exec(async () => {
      const firstSync = !token

      let cursor = await this.cacheService.getProperty('messageSeq')
      let hasNext = true
      while (hasNext) {
        const requestData: RequestTypeMapping[RequestTypes.SYNC_MESSAGE] = {
          cursor,
          voice_format: VoiceFormat.VOICE_FORMAT_SILK,
          open_kfid: this.authData.kfOpenId,
          token
        }
        const responseData = await this.request(RequestTypes.SYNC_MESSAGE, requestData)
        hasNext = responseData.has_more === TrueOrFalse.TRUE
        cursor = responseData.next_cursor
        void this.handleMessages(responseData.msg_list, firstSync)
      }
      await this.cacheService.setProperty('messageSeq', cursor)
    }, {
      queueId: 'sync-message',
      delayAfter: 100,
    })
  }

  private async getSelfInfo() {
    const limit = 100
    let offset = 0
    while (true) {
      const data: GetKfAccountListRequest = {
        offset,
        limit: 100
      }
      const response = await this.request(RequestTypes.GET_KF_ACCOUNT_LIST, data)

      const accounts = response.account_list
      const currentAccount = accounts.filter(account => account.open_kfid === this.authData.kfOpenId)
      if (currentAccount.length > 0) {
        if (currentAccount[0].manage_privilege) {
          const contactSelf = currentAccount[0]
          await this.cacheService.setContact(contactSelf.open_kfid, {
            id: contactSelf.open_kfid,
            name: contactSelf.name,
            avatar: contactSelf.avatar,
          })
          return
        }
        throw new WxkfError(WXKF_ERROR.AUTH_ERROR, `cannot manage wxkf id: ${this.authData.kfOpenId}, you don't have required privilege`)
      }
      if (accounts.length < limit) {
        throw new WxkfError(WXKF_ERROR.AUTH_ERROR, `cannot find wxkf with id: ${this.authData.kfOpenId}`)
      }
      offset += 100
    }
  }

  async handleMessages(messages: WxkfMessage<MessageTypes>[], firstSync = false) {
    for (const message of messages) {
      if (Date.now() - timestampToMilliseconds(message.send_time) > HISTORY_MESSAGE_TIME_THRESHOLD || await this.cacheService.hasMessage(message.msgid)) {
        continue
      }

      const messagePayload = convertMessageToPayload(message)
      if (!messagePayload) {
        this.logger.warn(`unsupported message type ${ message.msgtype }, message dismissed`)
      }
      await this.cacheService.setMessage(messagePayload.id, messagePayload)

      if (!firstSync) {
        this.emit('message', {
          messageId: message.msgid
        })
      }
    }
  }

  async messagePayload(messageId: string) {
    const messageInCache = await this.cacheService.getMessage(messageId)
    if (!messageInCache) {
      throw new WxkfError(WXKF_ERROR.MESSAGE_PARSE_ERROR, `failed to find message for id ${messageId}`)
    }

    return messageInCache
  }

  async messageSendText(toId: string, text: string) {
    const data: SendMessageRequest<TextMessage> = {
      touser: toId,
      open_kfid: this.authData.kfOpenId,
      msgtype: MsgType.MSG_TYPE_TEXT,
      text: {
        content: text,
      }
    }
    
    const response = await this.request(RequestTypes.SEND_MESSAGE, data)

    return response.msgid
  }

  private async uploadMedia(file: FileBox) {
    await file.ready()
    const type =
      file.mediaType && file.mediaType !== 'application/octet-stream' && file.mediaType !== 'application/unknown'
        ? file.mediaType.replace(/;.*$/, '')
        : path.extname(file.name)

    const size = file.size
    const filename = file.name
    const fileType = getFileType(type)

    if (size > FILE_SIZE_THRESHOLD[fileType]) {
      throw new WxkfError(WXKF_ERROR.MESSAGE_SEND_ERROR_PARAM, `cannot send file, size over limit`)
    }

    const localPath = path.join(
      FileTempDir,
      uuidV4(),
    )

    await file.toFile(localPath, true)
    const localFile = FileBox.fromFile(localPath, filename)

    const formData = new FormData()
    formData.append('media', await localFile.toStream(), {
      filename: filename || getDefaultFilename(fileType),
      knownLength: localFile.size,
      contentType: getContentType(type)
    })

    const headers = formData.getHeaders()

    const response = await axios.post<UploadMediaRequest, AxiosResponse<UploadMediaResponse>>(`${baseUrl}/media/upload`, formData, {
      params: {
        access_token: this.accessToken,
        type: fileType,
      },
      headers,
    })

    fs.rmSync(localPath)
    
    return {
      mediaId: response.data.media_id,
      type: fileType
    }
  }

  async messageSendFile(toId: string, file: FileBox) {
    const { mediaId, type } = await this.uploadMedia(file)
    this.logger.info(`sending ${type} id: ${mediaId} to ${toId}`)

    const data = {
      touser: toId,
      open_kfid: this.authData.kfOpenId,
    } as SendMessageRequest<FileMessageTypes>
    
    switch (type) {
      case FileTypes.IMAGE:
        data.msgtype = MsgType.MSG_TYPE_IMAGE
        ;(data as SendMessageRequest<ImageMessage>).image = {
          media_id: mediaId
        }
        break
      case FileTypes.VIDEO:
        data.msgtype = MsgType.MSG_TYPE_VIDEO
        ;(data as SendMessageRequest<VideoMessage>).video = {
          media_id: mediaId
        }
        break
      case FileTypes.VOICE:
        data.msgtype = MsgType.MSG_TYPE_VOICE
        ;(data as SendMessageRequest<VoiceMessage>).voice = {
          media_id: mediaId
        }
        break
      case FileTypes.FILE:
      default:
        data.msgtype = MsgType.MSG_TYPE_FILE
        ;(data as SendMessageRequest<FileMessage>).file = {
          media_id: mediaId
        }
        break
    }
    
    const response = await this.request(RequestTypes.SEND_MESSAGE, data)

    return response.msgid
  }

  async contactPayload(contactId: string) {
    const contactInCache = await this.cacheService.getContact(contactId)
    if (contactInCache) {
      return contactInCache
    }
    const customerInfo = (await this.request(RequestTypes.BATCH_GET_CUSTOMER_INFO, {
      external_userid_list: [contactId]
    })).customer_list[0]
    if (customerInfo) {
      const contactPayloadCache = convertContactToPayload(customerInfo)
      await this.cacheService.setContact(contactId, contactPayloadCache)
      return contactPayloadCache
    }

    throw new WxkfError(WXKF_ERROR.CONTACT_PARSE_ERROR, `cannot find contact for id: ${contactId}`)
  }
}