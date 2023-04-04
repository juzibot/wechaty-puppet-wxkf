
import COS from 'cos-nodejs-sdk-v5'
import fs from 'fs'
import { Readable } from 'stream'
import { v4 as uuidV4 } from 'uuid'
import { OssCosConfig, OssUploadFileParams, OSS_CLIENT_TYPE, UPLOAD_TYPE } from './interface'
import { Logger } from '../../wechaty-dep'

export class CosClient {
  private instance: COS
  private readonly logger = new Logger(CosClient.name)

  constructor(private ossConfig: OssCosConfig) {
    if (this.ossConfig.ossClientType !== OSS_CLIENT_TYPE.Cos) {
      // prettier-ignore
      this.logger.info(`trying to get ${CosClient.name} instance when the client type is ${this.ossConfig.ossClientType}`)
      return
    }
    this.instance = new COS({
      SecretId: this.ossConfig.ossAccessKeyId,
      SecretKey: this.ossConfig.ossAccessKeySecret,
    })
  }

  public async uploadFile(input: OssUploadFileParams): Promise<void | string> {
    const client = this.instance
    const { filename, path, stream, type = UPLOAD_TYPE.LINK_MSG } = input
    if (!client) {
      this.logger.warn(`uploadFile(${filename}) failed, can not get ${CosClient.name}`)
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
    if (!this.ossConfig.ossBucket || !this.ossConfig.ossRegion || !this.ossConfig.ossCosAppid) {
      // prettier-ignore
      this.logger.warn(`uploadFile(${filename}) failed, something wrong with configuration, this.ossConfig.ossBucket: ${this.ossConfig.ossBucket} this.ossConfig.ossRegion: ${this.ossConfig.ossRegion} this.ossConfig.ossCosAppid: ${this.ossConfig.ossCosAppid}`)
      return
    }

    const ossPath = `${type}/${uuidV4()}/${filename}`
    const that = this
    let lastUploadProgress = 0
    const res = await client.putObject({
      Bucket: `${this.ossConfig.ossBucket}-${this.ossConfig.ossCosAppid}`,
      Region: this.ossConfig.ossRegion,
      Key: ossPath,
      Body: body,
      onProgress: function(progressData) {
        if (progressData.percent && progressData.percent - lastUploadProgress > 30) {
          that.logger.info(`uploading file ${ossPath} to COS, progress: ${JSON.stringify(progressData)}`)
          lastUploadProgress = progressData.percent
        }
      }
    })
    if (path) {
      (body as fs.ReadStream).close()
    }
    return `https://${res.Location}`
  }
}
