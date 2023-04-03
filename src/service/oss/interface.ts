import { Readable } from 'stream'

export interface OssBasicConfig {
  ossClientType: string,
  ossRegion: string,
  ossAccessKeyId: string,
  ossAccessKeySecret: string,
  ossBucket: string,
}

export interface OssS3Config extends OssBasicConfig {
  ossExpireTime?: number
}

export interface OssAliConfig extends OssBasicConfig {
  ossAliInternal?: boolean
}

export interface OssMinioConfig extends OssBasicConfig {
  ossMinioUseSsl: boolean
  ossMinioEndpoint: string
  ossMinioPort: number
  ossMinioDebugFile?: string
}

export interface OssCosConfig extends OssBasicConfig {
  ossCosAppid?: string
}

export interface OssTosConfig extends OssBasicConfig {
  /** only this path has read/write permission */
  ossBasePath?: string
  /** endpoint for tos url */
  ossEndpoint?: string
  /** default is false, true for https, false for http. */
  ossSecure?: boolean
}

export type OssConfig = OssS3Config | OssAliConfig | OssMinioConfig | OssCosConfig | OssTosConfig

export interface OssUploadFileParams {
  filename: string,
  path?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stream?: Readable,
  type?: UPLOAD_TYPE,
}

export enum OSS_CLIENT_TYPE {
  S3 = 'S3',
  Ali = 'Ali',
  Minio = 'Minio',
  Cos = 'Cos',
  Tos = 'Tos',
}

export enum UPLOAD_TYPE {
  LINK_MSG = 'link_msg',
  IMAGE_MSG = 'image_msg',
  EMOJI_MSG = 'emoji_msg',
  VIDEO_MSG = 'video_msg',
  FILE_MSG = 'file_msg',
  ROOM_AVATAR = 'room_avatar',
  AUTH_CONFIG_FILE = 'auth_config_file',
}
