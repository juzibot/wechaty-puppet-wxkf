import { baseUrl, PuppetWxkfOptions, urlMapping, WxkfAuth } from '../schema/base'
import { getAuthData, getPort } from '../util/env'
import { Server } from './server'
import axios from 'axios'

export class Manager {
  private readonly server: Server
  private readonly authData: WxkfAuth

  private accessToken?: string
  private accessTokenExpireTime?: number

  constructor(options: PuppetWxkfOptions) {
    const authData = getAuthData(options['authData'])
    this.authData = authData
    const port = getPort(options.callbackPort)

    this.server = new Server(authData, port)
    void this.getAccessToken()
  }

  private async getAccessToken() {
    const response = await axios.get(`${baseUrl}${urlMapping.getAccessToken}`, {
      params: {
        corpid: this.authData.corpId,
        corpsecret: this.authData.corpSecret
      }
    })
    console.log(response.data)

    this.accessToken = response.data.access_token
    this.accessTokenExpireTime = Date.now() + response.data.expires_in
  }
}