import { FileBox } from '../../filebox-dep'
import { Logger } from '../../wechaty-dep'
import { MINUTE } from '../../util/time'
import { S3Client } from './S3Client'
import { OSS_CLIENT_TYPE, OssAliConfig, OssCosConfig, OssMinioConfig, OssOptions, OssS3Config, OssTosConfig, UPLOAD_TYPE } from './interface'
import { AliClient } from './AliClient'
import { MinioClient } from './MinioClient'
import { TosClient } from './TosClient'
import { CosClient } from './CosClient'

const UPLOAD_TIMEOUT = 1 * MINUTE

export class ObjectStorageService {
  private readonly logger = new Logger(ObjectStorageService.name)

  private readonly ossClient: S3Client | AliClient | MinioClient | CosClient | TosClient | null

  get configured() {
    return !!this.ossClient
  }

  constructor(ossConfig: OssOptions) {
    const { ossClientType } = ossConfig
    switch (ossClientType) {
      case OSS_CLIENT_TYPE.S3:
        this.ossClient = new S3Client(ossConfig as OssS3Config)
        break
      case OSS_CLIENT_TYPE.Ali:
        this.ossClient = new AliClient(ossConfig as OssAliConfig)
        break
      case OSS_CLIENT_TYPE.Minio:
        this.ossClient = new MinioClient(ossConfig as OssMinioConfig)
        break
      case OSS_CLIENT_TYPE.Cos:
        this.ossClient = new CosClient(ossConfig as OssCosConfig)
        break
      case OSS_CLIENT_TYPE.Tos:
        this.ossClient = new TosClient(ossConfig as OssTosConfig)
        break
      default:
        this.ossClient = null
        this.logger.warn(`current running without Oss, mini program thumb may not be seen`)
        break
    }
  }

  async uploadFile(file: FileBox, uploadType?: UPLOAD_TYPE): Promise<void | string> {
    const input = {
      filename: file.name,
      stream: await file.toStream(),
      type: uploadType,
    }

    const promise: Promise<string | void> = new Promise((resolve) => {
      resolve(this.ossClient?.uploadFile(input) || '')
    })
    const timeout: Promise<string> = new Promise((resolve) => {
      setTimeout(() => {
        this.logger.warn(`uploadFile() filename: ${input.filename} timeout after 1 minute`)
        resolve('')
      }, UPLOAD_TIMEOUT)
    })
    const url = await Promise.race([promise, timeout])

    if (!url) {
      this.logger.warn(`uploadFile() filename: ${input.filename} no url`)
    } else {
      this.logger.info(`uploadFile() filename: ${input.filename} url: ${url}`)
    }
    return url
  }
}
