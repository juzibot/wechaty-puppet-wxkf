import { PuppetWxkfOptions } from './schema/base'
import { Manager } from './service/manager'
import { Logger, Puppet, payloads } from './wechaty-dep'

export class PuppetWxkf extends Puppet {

  private readonly logger = new Logger(PuppetWxkf.name)
  private manager?: Manager

  constructor(private readonly wxkfOptions: PuppetWxkfOptions = {}) {
    super(wxkfOptions)
  }

  async onStart(): Promise<void> {
    this.logger.info('onStart()')
    this.manager = new Manager(this.wxkfOptions)

    this.manager.on('message', (payload) => {
      this.emit('message', payload)
    })
    this.manager.on('ready', (payload) => {
      this.emit('ready', payload)
    })

    await this.manager.onStart()
  }

  async onStop(): Promise<void> {
    this.logger.info('onStop()')
    await this.manager.onStop()
    this.manager.removeAllListeners()
    delete this.manager
  }

  override messageRawPayload(messageId: string): Promise<any> {
    return this.manager.messagePayload(messageId)
  }

  override messageRawPayloadParser(rawPayload: any): Promise<payloads.Message> {
    return Promise.resolve(rawPayload as payloads.Message)
  }
}