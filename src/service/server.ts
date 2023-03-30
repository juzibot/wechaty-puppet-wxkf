import { WxkfAuth } from '../schema/base'
import express, { Express } from 'express'
import bodyParser from 'body-parser'
import { CallbackController } from '../controller/callback'
import { Logger } from '../wechaty-dep'

export class Server {
  private readonly logger = new Logger(Server.name)

  private readonly app: Express
  private readonly callbackController: CallbackController

  constructor(options: WxkfAuth, port: number) {

    this.app = express()

    this.app.use(bodyParser.text({type: ['text/xml', 'application/xml']}))
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
    
    this.callbackController = new CallbackController(options.encodingAESKey, options.token, this.app)

    this.app.listen(port, () => {
      this.logger.info(`callback server started on port ${port}`)
    })
  }
}