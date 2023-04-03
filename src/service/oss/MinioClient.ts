/* eslint-disable @typescript-eslint/no-unsafe-call */
import fs from 'fs'
import { Client as Minio } from 'minio'
import { Readable } from 'stream'
import { v4 as uuidV4 } from 'uuid'
import { OssMinioConfig, OssUploadFileParams, OSS_CLIENT_TYPE, UPLOAD_TYPE } from './interface'
import { Logger } from '../../wechaty-dep'
import { getOss } from '../../util/env'

export class MinioClient {
  private instance: Minio
  private ossConfig: OssMinioConfig
  private readonly logger = new Logger(MinioClient.name)

  constructor() {
    this.ossConfig = getOss() as OssMinioConfig
    if (this.ossConfig.ossClientType !== OSS_CLIENT_TYPE.Minio) {
      // prettier-ignore
      this.logger.info(`trying to get ${MinioClient.name} instance when the client type is ${this.ossConfig.ossClientType}`)
      return
    }
    this.instance = new Minio({
      endPoint: this.ossConfig.ossMinioEndpoint,
      port: this.ossConfig.ossMinioPort,
      region: this.ossConfig.ossRegion,
      useSSL: this.ossConfig.ossMinioUseSsl,
      accessKey: this.ossConfig.ossAccessKeyId,
      secretKey: this.ossConfig.ossAccessKeySecret,
    })

    if (this.ossConfig.ossMinioDebugFile) {
      const traceStream = fs.createWriteStream(this.ossConfig.ossMinioDebugFile, { flags: 'a' })
      traceStream.write('====================================\n')
      traceStream.write(`${new Date().toString()}\n`)

      /**
       * FIXME: WHY?
       * - 不能直接 instance.logStream = traceStream
       * - instance.logHTTP() 中会无法访问 logStream ，必须要重新 bind
       * 难道是因为 Minio 的 constructor 中没有初始化 logStream 的缘故？
       */
      Object.assign(this.instance, { logStream: traceStream })
      const logHTTP = this.instance['logHTTP'] as Function
      logHTTP.bind(this.instance)
    }
  }

  public async uploadFile(input: OssUploadFileParams): Promise<void | string> {
    const client = this.instance
    const { filename, path, stream, type = UPLOAD_TYPE.LINK_MSG } = input
    if (!client) {
      this.logger.warn(`uploadFile(${filename}) failed, can not get ${MinioClient.name}`)
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unnecessary-type-assertion
    await client.putObject(this.ossConfig.ossBucket, ossPath, body as any)
    if (path) {
      (body as fs.ReadStream).close()
    }
    return `https://${this.ossConfig.ossMinioEndpoint}:${this.ossConfig.ossMinioPort}/${this.ossConfig.ossBucket}/${ossPath}`
  }
}
