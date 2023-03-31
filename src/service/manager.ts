import { PuppetWxkfOptions, WxkfAuth } from '../schema/base'
import { getAuthData, getPort } from '../util/env'
import { CallbackServer } from './callback-server'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { MINUTE, SECOND, timestampToMilliseconds } from '../util/time'
import { ExecQueueService } from './exec-queue'
import { baseUrl, RequestTypeMapping, RequestTypes, ResponseTypeMapping, urlMapping } from '../schema/mapping'
import WxkfError from '../error/error'
import { WXKF_ERROR, WXKF_ERROR_CODE } from '../error/error-code'
import { GetAccessTokenRequest, GetAccessTokenResponse, MessageTypes, TrueOrFalse, VoiceFormat, WxkfMessage } from '../schema/request'
import { Logger } from '../wechaty-dep'
import { CacheService } from './cache'
import { HISTORY_MESSAGE_TIME_THRESHOLD } from '../util/constant'
import { ManagerEvents } from '../schema/event'
import TypedEmitter from 'typed-emitter'
import EventEmitter from 'node:events'
import { convertMessageToPayload } from '../util/message-helper'
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
    await this.syncMessage()
    this.emit('ready', {
      data: 'data ready'
    })
  }

  async onStop() {
    await this.cacheService.onStop()
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
}