import path from 'path'
import fs from 'fs-extra'
import os from 'os'

import { FlashStore } from 'flash-store'


export class CacheService {

  private readonly caches: {
    property: FlashStore<string, string>
  }

  constructor (userId: string) {
    const baseDir = path.join(
      os.homedir(),
      '.wecahty',
      'puppet-wxkf',
      'flash-store',
      userId,
    )

    const baseDirExist = fs.existsSync(baseDir)

    if (!baseDirExist) {
      fs.mkdirpSync(baseDir)
    }

    this.caches = {
      property: new FlashStore(path.join(baseDir, 'property'))
    }
  }

  async onStop() {
    const promises: Promise<void>[] = []
    for (const key in this.caches) {
      const cache = this.caches[key] as FlashStore
      promises.push(cache.close())
    }
    return Promise.all(promises)
  }

  async setProperty(key: string, value: string) {
    await this.caches.property.set(key, value)
  }

  async getProperty(key: string) {
    return this.caches.property.get(key)
  }
}