import express, { Express } from 'express'
import * as crypto from '@wecom/crypto'
import { CallbackVerifyData } from 'src/schema/callback-verify'
import { Logger } from '../wechaty-dep'

export class CallbackController {
  private readonly logger = new Logger(CallbackController.name)
  
  constructor (private readonly aesKey: string, private readonly token: string, app: Express) {
    app.get('/callback', this.onGetCallback.bind(this) as typeof this.onGetCallback)
    app.post('/callback', this.onPostCallback.bind(this) as typeof this.onPostCallback)
  }

  // 应该只有配置api时验证的消息是get
  onGetCallback (req: express.Request, res: express.Response) {
    this.logger.info(`receive verify message: ${JSON.stringify(req.query)}`)

    const { msg_signature, timestamp, nonce, echostr } = req.query as unknown as CallbackVerifyData
    const signature = crypto.getSignature(this.token, timestamp, nonce, echostr)
    
    if (signature !== msg_signature) {
      this.logger.warn('message signature not match, will dismiss')
      res.status(500)
      res.send('signature not match')
      return
    }

    const { message } = crypto.decrypt(this.aesKey, echostr)
    res.send(message)
  }

  onPostCallback (req: express.Request, res: express.Response) {
    console.log(req.query)
    console.log(req.body)
    res.send('')
  }
}