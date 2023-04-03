import path from 'path'
import fs from 'fs-extra'
import os from 'os'

import { FlashStore } from 'flash-store'
import { ContactPayloadCache, MediaExpireThreshold, MediaIdCache, MessagePayloadCache } from '../schema/cache'


export class CacheService {

  private readonly caches: {
    property: FlashStore<string, string>
    message: FlashStore<string, MessagePayloadCache>
    contact: FlashStore<string, ContactPayloadCache>
    media: FlashStore<string, MediaIdCache>
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
      property: new FlashStore(path.join(baseDir, 'property')),
      message: new FlashStore(path.join(baseDir, 'message')),
      contact: new FlashStore(path.join(baseDir, 'contact')),
      media: new FlashStore(path.join(baseDir, 'media'))
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

  async setMessage(messageId: string, payload: MessagePayloadCache) {
    await this.caches.message.set(messageId, payload)
  }

  async getMessage(messageId: string) {
    return this.caches.message.get(messageId)
  }

  async hasMessage(messageId: string) {
    return this.caches.message.has(messageId)
  }

  async setContact(contactId: string, payload: ContactPayloadCache) {
    await this.caches.contact.set(contactId, payload)
  }

  async getContact(contactId: string) {
    return this.caches.contact.get(contactId)
  }

  /**
   * 
   * @param key Url or Md5 of the file
   * @param mediaData Media and Create Timestamp
   */
  async setMedia(key: string, mediaData: MediaIdCache) {
    await this.caches.media.set(key, mediaData)
  }

  async getMedia(key: string) {
    const media = await this.caches.media.get(key)
    if (!media || (media.createdAt + MediaExpireThreshold < Date.now())) {
      return null
    }
    return media
  }
}