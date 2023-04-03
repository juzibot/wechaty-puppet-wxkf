import { OssConfig, OSS_CLIENT_TYPE, OssS3Config, OssAliConfig, OssMinioConfig, OssCosConfig, OssTosConfig } from '../service/oss/interface'
import WxkfError from '../error/error'
import { WXKF_ERROR } from '../error/error-code'
import { WXKF_AUTH_TYPE, WxkfAuth, WxkfAuthZjyy } from '../schema/base'
import { WxkfAuthFwsdkf } from '../schema/base'

export const getAuthData = (rawOptions: WxkfAuth = {}) => {
  const authType = rawOptions.authType || process.env['AUTH_TYPE']

  switch (authType) {
    case WXKF_AUTH_TYPE.ZJYY: {
      const options = rawOptions as WxkfAuthZjyy
      const token = options.token || process.env['WECOM_ZJYY_APP_TOKEN']
      const encodingAESKey =
        options.encodingAESKey || process.env['WECOM_ZJYY_APP_AES_KEY']
      const corpId = options.corpId || process.env['WECOM_ZJYY_CORP_ID']
      const corpSecret = options.corpSecret || process.env['WECOM_ZJYY_CORP_SECRET']
      const kfOpenId = options.kfOpenId || process.env['WECOM_KF_OPEN_ID']
    
      const result: WxkfAuthZjyy = {
        token,
        encodingAESKey,
        corpId,
        corpSecret,
        kfOpenId,
        authType,
      }
      for (const key in result) {
        if (!result[key]) {
          throw new WxkfError(WXKF_ERROR.AUTH_ERROR, `cannot auth, ${key} is missing`)
        }
      }
    
      return result
    }
    case WXKF_AUTH_TYPE.FWSDKF: {
      const options = rawOptions as WxkfAuthFwsdkf
      const kfOpenId = options.kfOpenId || process.env['WECOM_KF_OPEN_ID']
      const providerSecret = options.providerSecret || process.env['WECOM_FWSDKF_PROVIDER_SECRET']
      const providerCorpId = options.providerCorpId || process.env['WECOM_FWSDKF_PROVIDER_CORP_ID']
      const result: WxkfAuthFwsdkf = {
        kfOpenId,
        authType,
        providerSecret,
        providerCorpId,
      }
      for (const key in result) {
        if (!result[key]) {
          throw new WxkfError(WXKF_ERROR.AUTH_ERROR, `cannot auth, ${key} is missing`)
        }
      }
    
      return result
    }
    default:
      throw new WxkfError(WXKF_ERROR.AUTH_ERROR, `cannot auth, unknwon auth type ${authType}`)

  }
}

export const getPort = (portOption: string) => {
  const port = Number(portOption || process.env['WXKF_CALLBACK_PORT']) || 3000
  return port
}

export const getOss = () => {
  const type = process.env['OSS_CLIENT_TYPE'] || ''
  if (!type) {
    return {
      ossClientType: '',
    }
  }

  const basicConfig = {
    ossClientType: process.env['OSS_CLIENT_TYPE'],
    ossRegion: process.env['OSS_REGION'],
    ossAccessKeyId: process.env['OSS_ACCESS_KEY_ID'],
    ossAccessKeySecret: process.env['OSS_ACCESS_KEY_SECRET'],
    ossBucket: process.env['OSS_BUCKET'],
  }

  const ossConfig: OssConfig = {
    ...basicConfig,
  }
  switch (type) {
    case OSS_CLIENT_TYPE.S3:
      (ossConfig as OssS3Config).ossExpireTime = Number(process.env['OSS_EXPIRE_TIME'] || 3600 * 1000 * 24 * 30)
      break
    case OSS_CLIENT_TYPE.Ali:
      (ossConfig as OssAliConfig).ossAliInternal = process.env['OSS_ALI_INTERNAL'] === 'true'
      break
    case OSS_CLIENT_TYPE.Minio:
      (ossConfig as OssMinioConfig).ossMinioUseSsl = process.env['OSS_MINIO_USE_SSL'] === 'true'
      ;(ossConfig as OssMinioConfig).ossMinioEndpoint = process.env['OSS_MINIO_ENDPOINT'] || 'play.min.io'
      ;(ossConfig as OssMinioConfig).ossMinioPort = Number(process.env['OSS_MINIO_PORT'] || 9000)
      ;(ossConfig as OssMinioConfig).ossMinioDebugFile = process.env['OSS_MINIO_DEBUG_FILE'] || ''
      break
    case OSS_CLIENT_TYPE.Cos:
      (ossConfig as OssCosConfig).ossCosAppid = process.env['OSS_COS_APPID']
      break
    case OSS_CLIENT_TYPE.Tos:
      (ossConfig as OssTosConfig).ossBasePath = process.env['OSS_BASE_PATH']
      ;(ossConfig as OssTosConfig).ossEndpoint = process.env['OSS_ENDPOINT']
      ;(ossConfig as OssTosConfig).ossSecure = process.env['OSS_SECURE'] === 'true'
      break
    default:
      (ossConfig as OssS3Config).ossExpireTime = Number(process.env['OSS_EXPIRE_TIME'] || 3600 * 1000 * 24 * 30)
  }
  return ossConfig
}