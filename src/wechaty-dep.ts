export * from 'wechaty-puppet'
import { log } from 'wechaty-puppet'

export class Logger {
  constructor(private readonly PRE: string) {}

  info (...args: unknown[]) {
    log.info(this.PRE, args)
  }

  verbose (...args: unknown[]) {
    log.verbose(this.PRE, args)
  }

  silly (...args: unknown[]) {
    log.silly(this.PRE, args)
  }

  warn (...args: unknown[]) {
    log.warn(this.PRE, args)
  }

  error (...args: unknown[]) {
    log.error(this.PRE, args)
  }
}
