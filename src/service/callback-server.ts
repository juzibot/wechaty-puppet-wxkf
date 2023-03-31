import { WxkfAuth } from '../schema/base'
import express, { Express } from 'express'
import bodyParser from 'body-parser'
import { Logger } from '../wechaty-dep'
import * as crypto from '@wecom/crypto'
import xml2js from 'xml2js'
import { GetCallbackData, PostCallbackData, BodyXmlData, EventXmlData } from 'src/schema/callback'
import { CallbackServerEvents } from '../schema/event'
import TypedEmitter from 'typed-emitter'
import EventEmitter from 'node:events'

export class CallbackServer extends (EventEmitter as new () => TypedEmitter<CallbackServerEvents>) {
  private readonly logger = new Logger(CallbackServer.name)

  private readonly app: Express
  private readonly authData: WxkfAuth

  constructor(authData: WxkfAuth, port: number) {
    super()
    this.authData = authData

    this.app = express()

    this.app.use(bodyParser.text({type: ['text/xml', 'application/xml']}))
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
    
    this.app.get('/callback', this.onGetCallback.bind(this) as typeof this.onGetCallback)
    this.app.post('/callback', this.onPostCallback.bind(this) as typeof this.onPostCallback)

    this.app.listen(port, () => {
      this.logger.info(`callback server started on port ${port}`)
    })
  }

  // 应该只有配置api时验证的消息是get
  onGetCallback (req: express.Request, res: express.Response) {
    this.logger.info(`receive verify message: ${JSON.stringify(req.query)}`)

    const { msg_signature, timestamp, nonce, echostr } = req.query as unknown as GetCallbackData
    const signature = crypto.getSignature(this.authData.token, timestamp, nonce, echostr)
    
    if (signature !== msg_signature) {
      this.logger.warn('message signature not match, will dismiss')
      res.status(500)
      res.send('signature not match')
      return
    }

    const { message } = crypto.decrypt(this.authData.encodingAESKey, echostr)
    res.send(message)
  }

  async onPostCallback (req: express.Request, res: express.Response) {   
    const { msg_signature, timestamp, nonce } = req.query as unknown as PostCallbackData
    
    const bodyStr = req.body as string

    const bodyObject = await xml2js.parseStringPromise(bodyStr) as BodyXmlData
    const encryptedStr = bodyObject.xml.Encrypt[0]

    const signature = crypto.getSignature(this.authData.token, timestamp, nonce, encryptedStr)
    if (signature !== msg_signature) {
      this.logger.warn('message signature does not match, will dismiss')
      res.status(500)
      res.send('signature not match')
      return
    }
    
    const { message, id, random } = crypto.decrypt(this.authData.encodingAESKey, encryptedStr)
    
    const messageObject = await xml2js.parseStringPromise(message) as EventXmlData

    const corpId = messageObject.xml.ToUserName[0]
    if (corpId !== this.authData.corpId) {
      this.logger.warn('message corpId does not match, will dismiss')
      res.status(500)
      res.send('corpId not match')
      return
    }

    const openKfId = messageObject.xml.OpenKfId[0]
    if (openKfId !== this.authData.kfOpenId) {
      this.logger.warn('message kfOpenId does not match, will dismiss')
      res.status(500)
      res.send('kfOpenId not match')
      return
    }

    const eventType = messageObject.xml.Event[0]
    if (eventType === 'kf_msg_or_event') {
      this.emit('message', messageObject.xml.Token[0])
    }

    res.send('')
  }
}