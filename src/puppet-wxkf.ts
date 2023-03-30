import { PuppetWxkfOptions } from './schema/base'
import { Manager } from './service/manager'
import { SECOND, sleep } from './util/time'
import { Logger, Puppet } from './wechaty-dep'

export class PuppetWxkf extends Puppet {

  private readonly logger = new Logger(PuppetWxkf.name)
  private readonly manager: Manager

  constructor(options: PuppetWxkfOptions = {}) {
    super(options)
    this.manager = new Manager(options)
  }

  async onStart(): Promise<void> {
    this.logger.info('onStart()')
    await sleep(1 * SECOND)
  }

  async onStop(): Promise<void> {
    this.logger.info('onStop()')
    await sleep(1 * SECOND)
  }
}