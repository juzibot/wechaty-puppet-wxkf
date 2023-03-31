import { PuppetWxkfOptions, WxkfAuth } from '../schema/base'
import { getAuthData, getPort } from '../util/env'
import { Server } from './server'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { MINUTE, SECOND } from '../util/time'
import { ExecQueueService } from './exec-queue'
import { baseUrl, RequestTypeMapping, RequestTypes, ResponseTypeMapping, urlMapping } from '../schema/mapping'
import WxkfError from 'src/error/error'
import { WXKF_ERROR, WXKF_ERROR_CODE } from 'src/error/error-code'
import { GetAccessTokenRequest, GetAccessTokenResponse } from 'src/schema/request'

export class Manager {
  private readonly server: Server
  private readonly authData: WxkfAuth

  private readonly postRequestInstance: AxiosInstance

  private accessToken?: string
  private accessTokenExpireTime?: number
  private accessTokenTimestamp?: number
  private accessTokenRenewTimer: NodeJS.Timeout

  constructor(options: PuppetWxkfOptions) {
    const authData = getAuthData(options['authData'])
    this.authData = authData
    const port = getPort(options.callbackPort)

    this.server = new Server(authData, port)

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
    })

  }

  private async request<T extends RequestTypes>(type: T, data: RequestTypeMapping[T]):Promise<ResponseTypeMapping[T]> {
    const response = await this.postRequestInstance.post<RequestTypeMapping[T], AxiosResponse<ResponseTypeMapping[T]>>(urlMapping[type], data)

    const responseData = response.data
    if (responseData.errcode) {
      throw new WxkfError(WXKF_ERROR_CODE.SERVER_ERROR, `request error with code: ${responseData.errcode}, message: ${responseData.errmsg}`)
    }

    return response.data
  }
}