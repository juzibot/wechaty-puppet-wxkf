import WxkfError from '../error/error'
import { WXKF_ERROR } from '../error/error-code'
import { WxkfAuth } from '../schema/base'

export const getAuthData = (options: WxkfAuth = {}) => {
  const token = options.token || process.env['WECOM_APP_TOKEN']
  const encodingAESKey =
    options.encodingAESKey || process.env['WECOM_APP_AES_KEY']
  const corpId = options.corpId || process.env['WECOM_CORP_ID']
  const corpSecret = options.corpSecret || process.env['WECOM_CORP_SECRET']
  const kfOpenId = options.kfOpenId || process.env['WECOM_KF_OPEN_ID']

  const result = {
    token,
    encodingAESKey,
    corpId,
    corpSecret,
    kfOpenId,
  }

  for (const key in result) {
    if (!result[key]) {
      throw new WxkfError(WXKF_ERROR.AUTH_ERROR, `cannot auth, ${key} is missing`)
    }
  }

  return result
}

export const getPort = (portOption: string) => {
  const port = Number(portOption || process.env['WXKF_CALLBACK_PORT']) || 3000
  return port
}