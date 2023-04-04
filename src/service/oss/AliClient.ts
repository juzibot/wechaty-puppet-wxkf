/* eslint-disable @typescript-eslint/no-unsafe-call */
import OSS from 'ali-oss'
import fs from 'fs'
import { Readable } from 'stream'
import { v4 as uuidV4 } from 'uuid'
import { OssAliConfig, OssUploadFileParams, OSS_CLIENT_TYPE, UPLOAD_TYPE } from './interface'
import { Logger } from '../../wechaty-dep'

export class AliClient {
  private instance: OSS
  private readonly logger = new Logger(AliClient.name)

  constructor(private ossConfig: OssAliConfig) {
    if (this.ossConfig.ossClientType !== OSS_CLIENT_TYPE.Ali) {
      this.logger.info(`trying to get ${AliClient.name} instance when the client type is ${this.ossConfig.ossClientType}`)
      return
    }
    this.instance = new OSS({
      bucket: this.ossConfig.ossBucket,
      region: this.ossConfig.ossRegion,
      accessKeyId: this.ossConfig.ossAccessKeyId,
      accessKeySecret: this.ossConfig.ossAccessKeySecret,
      internal: this.ossConfig.ossAliInternal,
    })
  }

  public async uploadFile(input: OssUploadFileParams): Promise<void | string> {
    const client = this.instance
    const { filename, path, stream, type = UPLOAD_TYPE.LINK_MSG } = input
    if (!client) {
      this.logger.warn(`uploadFile(${filename}) failed, can not get ${AliClient.name}`)
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
    const ossPath = `${type}/${uuidV4()}/${filename}`
    await client.putStream(ossPath, body, { timeout: 20 * 60 * 1000 } as OSS.PutStreamOptions)
    if (path) {
      (body as fs.ReadStream).close()
    }
    return this.getAliyunPublicUrl(ossPath)
  }

  private getAliyunPublicUrl (fullPath: string) {
    return `https://${this.ossConfig.ossBucket}.${this.ossConfig.ossRegion}.aliyuncs.com/${fullPath}`
  }
}
