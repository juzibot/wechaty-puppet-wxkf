/* eslint-disable @typescript-eslint/no-explicit-any */
import { MINUTE, sleep } from '../util/time'
import { Logger } from '../wechaty-dep'

interface FunctionObj {
  func: () => any,
  resolve: (data: any) => void,
  reject: (e: any) => void,
  delayBefore?: number,
  delayAfter?: number,
  uniqueKey?: string,
  timeout?: number,
}

export interface RateOptions {
  queueId?: string,
  delayBefore?: number,
  delayAfter?: number,
  uniqueKey?: string,
  timeout?: number,
}

const MAX_QUEUE_SIZE = 1000

export class ExecQueueService {
  private static readonly logger = new Logger(ExecQueueService.name)

  private static queueLength = 0

  private static functionQueueMap: { [id: string]: FunctionObj[] } = {}
  private static runningMap: { [id: string]: boolean } = {}

  static async exec<T> (func: () => T, options: RateOptions = {}) {
    const queueId = options.queueId || 'default'
    const { delayAfter, delayBefore, uniqueKey, timeout } = options

    if (!this.functionQueueMap[queueId]) {
      this.functionQueueMap[queueId] = []
    }

    if (this.queueLength > MAX_QUEUE_SIZE) {
      this.logger.error(`Can not exec more tasks since the queue is full, max queue size: ${MAX_QUEUE_SIZE}, current length: ${this.queueLength}`)
      throw new Error(`Can not exec more tasks since the execution queue is full`)
    }
    this.queueLength++

    return new Promise<T>((resolve, reject) => {
      this.functionQueueMap[queueId].push({ delayAfter, delayBefore, func, reject, resolve, uniqueKey, timeout })
      if (!this.runningMap[queueId]) {
        this.runningMap[queueId] = true
        this.execNext(queueId).catch(reject)
      }
    })
  }

  private static async execNext (queueId: string) {
    const queue = this.functionQueueMap[queueId]
    if (!queue) {
      return
    }

    const funcObj = queue.shift()
    if (!funcObj) {
      throw new Error(`can not get funcObj with queueId: ${queueId}.`)
    }
    const { delayAfter, delayBefore, func, resolve, reject, uniqueKey, timeout } = funcObj
    const queueTimeout = typeof timeout === 'undefined' ? MINUTE : timeout
    if (delayBefore) {
      await sleep(delayBefore)
    }
    try {
      const result = await Promise.race([
        func(),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        new Promise((_resolve, reject) => setTimeout(() => reject(new Error(`exec task timeout, queueId: ${queueId}`)), queueTimeout))
      ])
      resolve(result)
      /**
       * If uniqueKey is given, will resolve functions with same key in the queue
       */
      if (uniqueKey) {
        const sameFuncIndexes = queue.map((f, index) => ({ func: f, index }))
          .filter(o => o.func.uniqueKey === uniqueKey)
          .map(o => o.index)
          .sort((a, b) => b - a)
        for (const index of sameFuncIndexes) {
          const [sameFunc] = queue.splice(index, 1)
          sameFunc.resolve(result)
          this.queueLength--
        }
      }
    } catch (e) {
      reject(e)
    }

    this.queueLength--
    if (delayAfter) {
      await sleep(delayAfter)
    }
    if (queue.length > 0) {
      await this.execNext(queueId)
    } else {
      delete this.runningMap[queueId]
    }
  }
}
