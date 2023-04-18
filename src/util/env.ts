import { OssConfig, OSS_CLIENT_TYPE, OssOptions, OssEmptyConfig, OssAliConfig, OssCosConfig, OssMinioConfig, OssS3Config, OssTosConfig } from '../service/oss/interface'
import WxkfError from '../error/error'
import { WXKF_ERROR } from '../error/error-code'
import { ManagerCenterConfig, WxkfAuth } from '../schema/base'

export const getAuthData = (options: WxkfAuth = {}) => {
  const token = options.token || process.env['PUPPET_WXKF_WECOM_APP_TOKEN']
  const encodingAESKey =
    options.encodingAESKey || process.env['PUPPET_WXKF_WECOM_APP_AES_KEY']
  const corpId = options.corpId || process.env['PUPPET_WXKF_WECOM_CORP_ID']
  const corpSecret = options.corpSecret || process.env['PUPPET_WXKF_WECOM_CORP_SECRET']
  const kfOpenId = options.kfOpenId || process.env['PUPPET_WXKF_WECOM_KF_OPEN_ID']
  const kfName = options.kfName || process.env['PUPPET_WXKF_WECOM_KF_NAME']

  const result = {
    token,
    encodingAESKey,
    corpId,
    corpSecret,
  } as WxkfAuth

  for (const key in result) {
    if (!result[key]) {
      throw new WxkfError(WXKF_ERROR.AUTH_ERROR, `cannot auth, ${key} is missing`)
    }
  }

  if (kfOpenId) {
    result.kfOpenId = kfOpenId
  } else {
    if (kfName) {
      result.kfName = kfName
    } else {
      throw new WxkfError(WXKF_ERROR.AUTH_ERROR, `kf name or openid is not set`)
    }
  }

  return result
}

export const getPort = (portOption: string) => {
  const port = Number(portOption || process.env['PUPPET_WXKF_CALLBACK_PORT']) || 3000
  return port
}

export const getOss = (ossOptions: OssOptions): OssOptions => {
  const type = process.env['PUPPET_WXKF_OSS_CLIENT_TYPE'] || ''
  if (!type) {
    return {
      ossClientType: '',
    } as OssEmptyConfig
  }

  const basicConfig = {
    ossClientType: process.env['PUPPET_WXKF_OSS_CLIENT_TYPE'],
    ossRegion: process.env['PUPPET_WXKF_OSS_REGION'],
    ossAccessKeyId: process.env['PUPPET_WXKF_OSS_ACCESS_KEY_ID'],
    ossAccessKeySecret: process.env['PUPPET_WXKF_OSS_ACCESS_KEY_SECRET'],
    ossBucket: process.env['PUPPET_WXKF_OSS_BUCKET'],
  }

  const ossConfig: OssConfig = {
    ...basicConfig,
  }
  switch (type) {
    case OSS_CLIENT_TYPE.S3:
      (ossConfig as OssS3Config).ossExpireTime = Number(process.env['PUPPET_WXKF_OSS_EXPIRE_TIME'] || 3600 * 1000 * 24 * 30)
      break
    case OSS_CLIENT_TYPE.Ali:
      (ossConfig as OssAliConfig).ossAliInternal = process.env['PUPPET_WXKF_OSS_ALI_INTERNAL'] === 'true'
      break
    case OSS_CLIENT_TYPE.Minio:
      (ossConfig as OssMinioConfig).ossMinioUseSsl = process.env['PUPPET_WXKF_OSS_MINIO_USE_SSL'] === 'true'
      ;(ossConfig as OssMinioConfig).ossMinioEndpoint = process.env['PUPPET_WXKF_OSS_MINIO_ENDPOINT'] || 'play.min.io'
      ;(ossConfig as OssMinioConfig).ossMinioPort = Number(process.env['PUPPET_WXKF_OSS_MINIO_PORT'] || 9000)
      ;(ossConfig as OssMinioConfig).ossMinioDebugFile = process.env['PUPPET_WXKF_OSS_MINIO_DEBUG_FILE'] || ''
      break
    case OSS_CLIENT_TYPE.Cos:
      (ossConfig as OssCosConfig).ossCosAppid = process.env['PUPPET_WXKF_OSS_COS_APPID']
      break
    case OSS_CLIENT_TYPE.Tos:
      (ossConfig as OssTosConfig).ossBasePath = process.env['PUPPET_WXKF_OSS_BASE_PATH']
      ;(ossConfig as OssTosConfig).ossEndpoint = process.env['PUPPET_WXKF_OSS_ENDPOINT']
      ;(ossConfig as OssTosConfig).ossSecure = process.env['PUPPET_WXKF_OSS_SECURE'] === 'true'
      break
    default:
      (ossConfig as OssS3Config).ossExpireTime = Number(process.env['PUPPET_WXKF_OSS_EXPIRE_TIME'] || 3600 * 1000 * 24 * 30)
  }
  return {
    ...ossConfig,
    ...ossOptions,
  }
}

export const getManagerCenterConfig = (managerCenterConfig?: ManagerCenterConfig) => {
  const config = {
    endpoint: managerCenterConfig?.endpoint || process.env['PUPPET_WXKF_MANAGER_CENTER_ENDPOINT'],
    selfEndpoint: managerCenterConfig?.selfEndpoint || process.env['PUPPET_WXKF_SELF_ENDPOINT'],
  }

  return config.endpoint && config.selfEndpoint ? config : undefined
}
