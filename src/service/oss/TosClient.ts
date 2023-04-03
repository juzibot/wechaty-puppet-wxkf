
import TOS from '@volcengine/tos-sdk'
import fs from 'fs'
import { Readable } from 'stream'
import { v4 as uuidV4 } from 'uuid'
import { OssTosConfig, OssUploadFileParams, OSS_CLIENT_TYPE, UPLOAD_TYPE } from './interface'
import { Logger } from '../../wechaty-dep'
import { getOss } from '../../util/env'

export class TosClient {
  private tosInstance: TOS
  private ossConfig: OssTosConfig
  private readonly logger = new Logger(TosClient.name)

  constructor() {
    this.ossConfig = getOss() as OssTosConfig
    if (this.ossConfig.ossClientType !== OSS_CLIENT_TYPE.Tos) {
      this.logger.info(`trying to get ${TosClient.name} instance when the client type is ${this.ossConfig.ossClientType}`)
      return
    }
    this.tosInstance = new TOS({
      accessKeyId: this.ossConfig.ossAccessKeyId,
      accessKeySecret: this.ossConfig.ossAccessKeySecret,
      bucket: this.ossConfig.ossBucket,
      region: this.ossConfig.ossRegion,
      endpoint: this.ossConfig.ossEndpoint,
      secure: this.ossConfig.ossSecure,
    })
  }

  async uploadFile(input: OssUploadFileParams): Promise<void | string> {
    const client = this.tosInstance
    const { filename, path, stream, type = UPLOAD_TYPE.LINK_MSG } = input
    if (!client) {
      this.logger.warn(`uploadFile(${filename}) failed, can not get ${TosClient.name}`)
      return
    }
    if (!path && !stream) {
      this.logger.warn(`uploadFile(${filename}) failed due to no path and stream`)
      return
    }
    let body: Readable
    if (path) {
      body = fs.createReadStream(path)
    }
    if (stream) {
      body = stream
    }
    if (!this.ossConfig.ossBucket) {
      this.logger.warn(`uploadFile(${filename}) failed due to no ossBucket`)
      return
    }
    const objectName = `${this.ossConfig.ossBasePath}/${type}/${uuidV4()}/${filename}`
    await client.putObject({
      bucket: this.ossConfig.ossBucket,
      key: objectName,
      body,
    })
    const url = client.getPreSignedUrl({
      method: 'GET',
      bucket: this.ossConfig.ossBucket,
      key: objectName,
    })
    if (path) {
      (body as fs.ReadStream).close()
    }
    return url
  }
}
