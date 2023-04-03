import { PuppetOptions, types } from '../wechaty-dep'

export interface PuppetWxkfOptions extends PuppetOptions {
  callbackPort?: string,
  wxkfAuth?: WxkfAuth
}

export type WxkfAuth = WxkfAuthZjyy | WxkfAuthFwsdkf

export interface WxkfAuthZjyy {
  authType?: WXKF_AUTH_TYPE.ZJYY,
  token?: string, // Token可由企业任意填写，用于生成签名。
  encodingAESKey?: string, // EncodingAESKey用于消息体的加密。
  corpId?: string, // 企微客服所属企业的id
  corpSecret?: string, // 企微客服应用的secret
  kfOpenId?: string, // 企微客服openId
}

export interface WxkfAuthFwsdkf {
  authType?: WXKF_AUTH_TYPE.FWSDKF,
  kfOpenId?: string, // 企微客服openId
  providerSecret?: string, // 服务商的secret，在服务商管理后台可见
  providerCorpId?: string, // 服务商的corpid
}

export const MessageTypesWithFile = [
  types.Message.Attachment,
  types.Message.Image,
  types.Message.Video,
  types.Message.Audio,
  types.Message.MiniProgram,
]

export enum WXKF_AUTH_TYPE {
  ZJYY = 'ZJYY', // 自建应用
  FWSDKF = 'FWSDKF', // 服务商待开发
}