
import S3 from 'aws-sdk/clients/s3'
import fs from 'fs'
import { Readable } from 'stream'
import { v4 as uuidV4 } from 'uuid'
import { OssS3Config, OssUploadFileParams, OSS_CLIENT_TYPE, UPLOAD_TYPE } from './interface'
import { Logger } from '../..//wechaty-dep'

export class S3Client {
  private s3Instance: S3
  private readonly logger = new Logger(S3Client.name)

  constructor(private ossConfig: OssS3Config) {
    if (this.ossConfig.ossClientType !== OSS_CLIENT_TYPE.S3) {
      this.logger.info(`trying to get ${S3Client.name} instance when the client type is ${this.ossConfig.ossClientType}`)
      return
    }
    this.s3Instance = new S3({
      region: this.ossConfig.ossRegion,
      signatureVersion: 'v4',
      credentials: {
        accessKeyId: this.ossConfig.ossAccessKeyId,
        secretAccessKey: this.ossConfig.ossAccessKeySecret,
      },
    })
  }

  async uploadFile(input: OssUploadFileParams): Promise<void | string> {
    const client = this.s3Instance
    const { filename, path, stream, type = UPLOAD_TYPE.LINK_MSG } = input
    if (!client) {
      this.logger.warn(`uploadFile(${filename}) failed, can not get ${S3Client.name}`)
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
    const params = {
      ACL: 'public-read',
      Body: body,
      Bucket: this.ossConfig.ossBucket,
      Key: `${type}/${uuidV4()}/${filename}`,
      Expires: new Date(Date.now() + Number(this.ossConfig.ossExpireTime)),
    }

    const result = await new Promise<S3.ManagedUpload.SendData>((resolve, reject) => {
      client.upload(params, (err: Error, data: S3.ManagedUpload.SendData) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
    if (path) {
      (body as fs.ReadStream).close()
    }
    return result.Location
  }
}
