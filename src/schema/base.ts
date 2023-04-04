import { PuppetOptions, types } from '../wechaty-dep'

export interface PuppetWxkfOptions extends PuppetOptions {
  callbackPort?: string,
  wxkfAuth?: WxkfAuth
}

export interface WxkfAuth {
  token?: string, // Token可由企业任意填写，用于生成签名。
  encodingAESKey?: string, // EncodingAESKey用于消息体的加密。
  corpId?: string, // 企微客服所属企业的id
  corpSecret?: string, // 企微客服应用的secret
  kfOpenId?: string, // 企微客服openId
}

export const MessageTypesWithFile = [
  types.Message.Attachment,
  types.Message.Image,
  types.Message.Video,
  types.Message.Audio,
  types.Message.MiniProgram,
]
