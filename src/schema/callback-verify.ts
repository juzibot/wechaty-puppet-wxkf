export interface CallbackVerifyData {
  msg_signature: string, // 企业微信加密签名，msg_signature结合了企业填写的token、请求中的timestamp、nonce参数、加密的消息体
  timestamp: string, // 时间戳
  nonce: string, // 随机数
  echostr: string, // 加密的字符串。需要解密得到消息内容明文，解密后有random、msg_len、msg、CorpID四个字段，其中msg即为消息内容明文
}