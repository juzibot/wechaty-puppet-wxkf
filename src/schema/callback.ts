export interface GetCallbackData {
  msg_signature: string, // 企业微信加密签名，msg_signature结合了企业填写的token、请求中的timestamp、nonce参数、加密的消息体
  timestamp: string, // 时间戳
  nonce: string, // 随机数
  echostr: string, // 加密的字符串。需要解密得到消息内容明文，解密后有random、msg_len、msg、CorpID四个字段，其中msg即为消息内容明文
}

export interface PostCallbackData {
  msg_signature: string, // 企业微信加密签名，msg_signature结合了企业填写的token、请求中的timestamp、nonce参数、加密的消息体
  timestamp: string, // 时间戳
  nonce: string, // 随机数
}

export interface BodyXmlData {
  xml: {
    ToUserName: string[], // 企业微信的CorpID，当为第三方套件回调事件时，CorpID的内容为suiteid
    AgentID: string[], // 接收的应用id，可在应用的设置页面获取
    Encrypt: string[], //消息结构体加密后的字符串
  }
}

export interface EventXmlData {
  xml: {
    ToUserName: string[], // 企业微信CorpID
    CreateTime: string[], // 消息创建时间，unix时间戳
    MsgType: string[], // 消息的类型，此时固定为：event
    Event: string[], // 事件的类型，此时固定为：kf_msg_or_event
    Token: string[], // 调用拉取消息接口时，需要传此token，用于校验请求的合法性
    OpenKfId: string[], // 有新消息的客服帐号。可通过sync_msg接口指定open_kfid获取此客服帐号的消息
  }
}

export interface DecryptedMessageEventData {
  token: string,
  openKfId: string,
}
