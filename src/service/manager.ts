import { PuppetWxkfOptions } from '../schema/base'
import { getAuthData, getPort } from '../util/env'
import { Server } from './server'

export class Manager {
  private readonly server: Server

  constructor(options: PuppetWxkfOptions) {
    const authData = getAuthData(options['authData'])
    const port = getPort(options.callbackPort)

    this.server = new Server(authData, port)
  }
}