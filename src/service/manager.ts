import { MessageTypesWithFile, PuppetWxkfOptions, WxkfAuth } from '../schema/base'
import { getAuthData, getOss, getPort } from '../util/env'
import { CallbackServer } from './callback-server'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { MINUTE, SECOND, timestampToMilliseconds } from '../util/time'
import { ExecQueueService } from './exec-queue'
import { baseUrl, RequestTypeMapping, RequestTypes, ResponseTypeMapping, urlMapping } from '../schema/mapping'
import WxkfError from '../error/error'
import { WXKF_ERROR, WXKF_ERROR_CODE } from '../error/error-code'
import { DownloadMediaRequest, DownloadMediaResponse, FileMessageTypes, FileTypes, GetKfAccountListRequest, GetAccessTokenRequest, GetAccessTokenResponse, ImageMessage, LocationMessage, MiniProgramMessage, MsgType, SendMessageRequest, TextMessage, TrueOrFalse, UploadMediaRequest, UploadMediaResponse, VoiceFormat, WxkfMessage, LinkMessageSend, MessageReceiveTypes } from '../schema/request'
import { Logger, payloads, types } from '../wechaty-dep'
import { CacheService } from './cache'
import { HISTORY_MESSAGE_TIME_THRESHOLD } from '../util/constant'
import { ManagerEvents } from '../schema/event'
import TypedEmitter from 'typed-emitter'
import EventEmitter from 'node:events'
import { convertMessageToPayload } from '../util/message-helper'
import { convertContactToPayload } from '../util/contact-helper'
import { FileBox, FileBoxType } from '../filebox-dep'
import path from 'path'
import { FILE_SIZE_THRESHOLD, FileTempDir, getContentType, getDefaultFilename, getFileType, getMd5, getUploadType } from '../util/file-helper'
import fs from 'fs-extra'
import { v4 as uuidV4 } from 'uuid'
import { VoiceMessage } from '../schema/request'
import { VideoMessage } from '../schema/request'
import { FileMessage } from '../schema/request'
import FormData from 'form-data'
import { MEDIA_EXPIRE_THRESHOLD } from '../schema/cache'
import { ObjectStorageService } from './oss'
import { KnownErrorCodeReason } from '../error/wecom-error-code'

export class Manager extends (EventEmitter as new () => TypedEmitter<ManagerEvents>) {
  private readonly logger = new Logger(Manager.name)

  private readonly callbackServer: CallbackServer
  private readonly authData: WxkfAuth

  private readonly postRequestInstance: AxiosInstance
  private readonly cacheService: CacheService
  private readonly ossService: ObjectStorageService

  private accessToken?: string
  // private accessTokenExpireTime?: number
  private accessTokenTimestamp?: number
  private accessTokenRenewTimer: NodeJS.Timeout

  constructor(options: PuppetWxkfOptions) {
    super()
    const authData = getAuthData(options['authData'])
    const ossConfig = getOss(options['ossOptions'])
    this.authData = authData
    const port = getPort(options.callbackPort)

    this.callbackServer = new CallbackServer(authData, port)
    this.callbackServer.on('message', this.messageHandler.bind(this) as typeof this.messageHandler)

    this.cacheService = new CacheService()
    this.ossService = new ObjectStorageService(ossConfig)

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
    const selfInfo = await this.getSelfInfo()
    if (!this.authData.kfOpenId) {
      this.authData.kfOpenId = selfInfo.id
    }
    this.cacheService.onStart(selfInfo.id)
    await this.cacheService.setContact(selfInfo.id, selfInfo)

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
      const response = await axios.get<GetAccessTokenResponse, AxiosResponse<GetAccessTokenResponse>, GetAccessTokenRequest>(`${baseUrl}${urlMapping[RequestTypes.GET_ACCESS_TOKEN]}`, {
        params: {
          corpid: this.authData.corpId,
          corpsecret: this.authData.corpSecret
        }
      })
      if (response.data.errcode) {
        throw new WxkfError(WXKF_ERROR.AUTH_ERROR, `cannot get access token for code: ${response.data.errcode}, message: ${response.data.errmsg}`)
      }
      this.accessToken = response.data.access_token
      
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
    const response = await this.postRequestInstance.post<ResponseTypeMapping[T], AxiosResponse<ResponseTypeMapping[T]>, RequestTypeMapping[T]>(urlMapping[type], data)

    const responseData = response.data
    if (responseData.errcode) {
      throw new WxkfError(WXKF_ERROR_CODE.SERVER_ERROR, 
        KnownErrorCodeReason[String(responseData.errcode)]
          || `request error with code: ${responseData.errcode}, message: ${responseData.errmsg}`
      )
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
      const currentAccount = accounts.filter(account => (account.open_kfid === this.authData.kfOpenId || account.name === this.authData.kfName))
      if (currentAccount.length > 0) {
        if (currentAccount[0].manage_privilege) {
          const contactSelf = currentAccount[0]
          return {
            id: contactSelf.open_kfid,
            name: contactSelf.name,
            avatar: contactSelf.avatar,
          }
        }
        throw new WxkfError(WXKF_ERROR.AUTH_ERROR, `cannot manage wxkf id: ${this.authData.kfOpenId}, you don't have required privilege`)
      }
      if (accounts.length < limit) {
        throw new WxkfError(WXKF_ERROR.AUTH_ERROR, `cannot find wxkf with id: ${this.authData.kfOpenId}`)
      }
      offset += 100
    }
  }

  async handleMessages(messages: WxkfMessage<MessageReceiveTypes>[], firstSync = false) {
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
    if (file.type === FileBoxType.Url) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const url = (file as any).remoteUrl as string
      const mediaInfo = await this.cacheService.getMedia(url)
      if (mediaInfo) {
        this.logger.info(`got ${mediaInfo.type} from url cache: ${mediaInfo.mediaId}`)

        return {
          mediaId: mediaInfo.mediaId,
          type: mediaInfo.type
        }
      }
    }
    
    if (file.md5) {
      const mediaInfo = await this.cacheService.getMedia(file.md5 as string) // why this as is needed?
      if (mediaInfo) {
        this.logger.info(`got ${mediaInfo.type} from metadata md5 cache: ${mediaInfo.mediaId}`)

        return {
          mediaId: mediaInfo.mediaId,
          type: mediaInfo.type
        }
      }
    }

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
    const md5 = await getMd5(localFile)

    const mediaInfo = await this.cacheService.getMedia(md5)
    if (mediaInfo) {
      fs.rmSync(localPath)

      this.logger.info(`got ${mediaInfo.type} from calculated md5 cache: ${mediaInfo.mediaId}`)
      return {
        mediaId: mediaInfo.mediaId,
        type: mediaInfo.type
      }
    }

    const formData = new FormData()
    formData.append('media', await localFile.toStream(), {
      filename: filename || getDefaultFilename(fileType),
      knownLength: localFile.size,
      contentType: getContentType(type)
    })

    const headers = formData.getHeaders()

    const response = await axios.post<UploadMediaResponse, AxiosResponse<UploadMediaResponse>, UploadMediaRequest>(`${baseUrl}/media/upload`, formData, {
      params: {
        access_token: this.accessToken,
        type: fileType,
      },
      headers,
    })

    fs.rmSync(localPath)
    
    await this.cacheService.setMedia(md5, {
      mediaId: response.data.media_id,
      type: fileType,
      createdAt: timestampToMilliseconds(Number(response.data.created_at) || Date.now()),
    })
    if (file.type === FileBoxType.Url) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const url = (file as any).remoteUrl as string
      await this.cacheService.setMedia(url, {
        mediaId: response.data.media_id,
        type: fileType,
        createdAt: timestampToMilliseconds(Number(response.data.created_at) || Date.now()),
      })
    }

    this.logger.info(`new ${fileType} uploaded: ${response.data.media_id}`)

    return {
      mediaId: response.data.media_id,
      type: fileType
    }
  }

  private async downloadMedia(mediaId: string) {
    const response = await axios.get<DownloadMediaResponse, AxiosResponse<DownloadMediaResponse>, DownloadMediaRequest>(`${baseUrl}/media/get`, {
      params: {
        access_token: this.accessToken,
        media_id: mediaId,
      },
      responseType: 'stream'
    })
    const disposition = response.headers['content-disposition'] as string
    const matchResult = disposition.match(/filename="(.*?)"/)
    let filename: string
    if (matchResult) {
      filename = matchResult[1]
    } else {
      const mimeType = response.headers['content-type'] as string
      const fileType = getFileType(mimeType)
      filename = getDefaultFilename(fileType)
    }

    const localPath = path.join(
      FileTempDir,
      uuidV4(),
    )

    const file = FileBox.fromStream(response.data )
    await file.toFile(localPath, true)
    const localFile = FileBox.fromFile(localPath, filename)
    
    return localFile
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

  async messageSendMiniProgram(toId: string, payload: payloads.MiniProgram) {
    const { mediaId } = await this.uploadMedia(FileBox.fromUrl(payload.thumbUrl))

    const data: SendMessageRequest<MiniProgramMessage> = {
      touser: toId,
      open_kfid: this.authData.kfOpenId,
      msgtype: MsgType.MSG_TYPE_MINIPROGRAM,
      miniprogram: {
        appid: payload.appid.startsWith('gh_') ?  payload.username : payload.appid,
        title: payload.title,
        pagepath: payload.pagePath,
        thumb_media_id: mediaId,
      }
    }

    const response = await this.request(RequestTypes.SEND_MESSAGE, data)

    return response.msgid
  }


  async messageSendUrl(toId: string, payload: payloads.UrlLink) {
    const { mediaId } = await this.uploadMedia(FileBox.fromUrl(payload.thumbnailUrl))

    const data: SendMessageRequest<LinkMessageSend> = {
      touser: toId,
      open_kfid: this.authData.kfOpenId,
      msgtype: MsgType.MSG_TYPE_LINK,
      link: {
        title: payload.title,
        desc: payload.description,
        url: payload.url,
        thumb_media_id: mediaId,
      }
    }

    const response = await this.request(RequestTypes.SEND_MESSAGE, data)

    return response.msgid
  }

  async messageSendLocation(toId: string, payload: payloads.Location) {
    const data: SendMessageRequest<LocationMessage> = {
      touser: toId,
      open_kfid: this.authData.kfOpenId,
      msgtype: MsgType.MSG_TYPE_LOCATION,
      location: {
        latitude: payload.latitude,
        longitude: payload.longitude,
        name: payload.name,
        address: payload.address,
      }
    }

    const response = await this.request(RequestTypes.SEND_MESSAGE, data)

    return response.msgid
  }

  async messageFile(messageId: string) {
    const message = await this.cacheService.getMessage(messageId)

    if (!message) {
      throw new WxkfError(WXKF_ERROR.MESSAGE_PARSE_ERROR, `cannot find message for id: ${messageId}`)
    }

    if (!MessageTypesWithFile.includes(message.type)) {
      throw new WxkfError(WXKF_ERROR.MESSAGE_PARSE_ERROR, `message does not contain any file, id: ${messageId}`)
    }

    if (message.mediaOssUrl) {
      return FileBox.fromUrl(message.mediaOssUrl, {
        name: message.filename
      })
    }

    if (message.mediaPath) {
      if (fs.existsSync(message.mediaPath)) {
        return FileBox.fromFile(message.mediaPath, message.filename)
      }
    }

    if (message.timestamp + MEDIA_EXPIRE_THRESHOLD < Date.now()) {
      throw new WxkfError(WXKF_ERROR.MESSAGE_PARSE_ERROR, `cannot download file for message id: ${messageId}, the file has expired`)
    }

    const localFile = await this.downloadMedia(message.mediaId)
    message.filename = localFile.name

    const url = await this.ossService.uploadFile(localFile, getUploadType(message.type))
    if (url) {
      message.mediaOssUrl = url
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      fs.rmSync((localFile as any).localPath as string)
      await this.cacheService.setMessage(message.id, message)
      return FileBox.fromUrl(url)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    message.mediaPath = (localFile as any).localPath as string
    await this.cacheService.setMessage(message.id, message)

    return localFile
  }

  async messageMiniProgram(messageId: string) {
    const message = await this.cacheService.getMessage(messageId)

    if (!message) {
      throw new WxkfError(WXKF_ERROR.MESSAGE_PARSE_ERROR, `cannot find message for id: ${messageId}`)
    }

    if (message.type !== types.Message.MiniProgram) {
      throw new WxkfError(WXKF_ERROR.MESSAGE_PARSE_ERROR, `message does not contain mini program, id: ${messageId}`)
    }

    const payload = message.miniProgramPayload
    if (!payload.thumbUrl && this.ossService.configured) {
      const file = await this.messageFile(messageId)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const url = (file as any).remoteUrl as string

      payload.thumbUrl = url
      await this.cacheService.setMessage(messageId, message)
    }

    return payload
  }

  async messageUrl(messageId: string) {
    const message = await this.cacheService.getMessage(messageId)

    if (!message) {
      throw new WxkfError(WXKF_ERROR.MESSAGE_PARSE_ERROR, `cannot find message for id: ${messageId}`)
    }

    if (message.type !== types.Message.Url) {
      throw new WxkfError(WXKF_ERROR.MESSAGE_PARSE_ERROR, `message does not contain url link, id: ${messageId}`)
    }

    return message.urlPayload
  }

  async messageLocation(messageId: string) {
    const message = await this.cacheService.getMessage(messageId)

    if (!message) {
      throw new WxkfError(WXKF_ERROR.MESSAGE_PARSE_ERROR, `cannot find message for id: ${messageId}`)
    }

    if (message.type !== types.Message.Location) {
      throw new WxkfError(WXKF_ERROR.MESSAGE_PARSE_ERROR, `message does not contain location, id: ${messageId}`)
    }

    return message.locationPayload
  }

  async messageContact(messageId: string) {
    const message = await this.cacheService.getMessage(messageId)

    if (!message) {
      throw new WxkfError(WXKF_ERROR.MESSAGE_PARSE_ERROR, `cannot find message for id: ${messageId}`)
    }

    if (message.type !== types.Message.Contact) {
      throw new WxkfError(WXKF_ERROR.MESSAGE_PARSE_ERROR, `message does not contain contact, id: ${messageId}`)
    }

    return message.contactId
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