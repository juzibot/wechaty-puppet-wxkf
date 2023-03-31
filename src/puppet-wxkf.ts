import { PuppetWxkfOptions } from './schema/base'
import { Manager } from './service/manager'
import { SECOND, sleep } from './util/time'
import { Logger, Puppet } from './wechaty-dep'

export class PuppetWxkf extends Puppet {

  private readonly logger = new Logger(PuppetWxkf.name)
  private manager?: Manager

  constructor(private readonly wxkfOptions: PuppetWxkfOptions = {}) {
    super(wxkfOptions)
  }

  async onStart(): Promise<void> {
    this.logger.info('onStart()')
    this.manager = new Manager(this.wxkfOptions)
    await this.manager.onStart()
  }

  async onStop(): Promise<void> {
    this.logger.info('onStop()')
    await this.manager.onStop()
    delete this.manager
  }
}