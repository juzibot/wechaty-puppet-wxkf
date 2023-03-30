import { WxkfErrorCodeType } from './error-code'

export default class WxkfError extends Error {
  constructor (type: WxkfErrorCodeType, message: string) {
    super(`WxkfErrorCode: ${type}, ${message}`)
  }
}