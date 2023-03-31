export interface ResponseBase {
  errcode: number, // 返回码
  errmsg: string, // 错误码描述
}

export interface GetAccessTokenRequest {
  corpid: string,
  corpsecret: string,
}

export interface GetAccessTokenResponse extends ResponseBase {
  access_token?: string,
  expires_in?: number
}

export interface SyncMessageRequest {
  cursor?: string // 上一次调用时返回的next_cursor，第一次拉取可以不填。若不填，从3天内最早的消息开始返回。
  token?: string // 回调事件返回的token字段，10分钟内有效；可不填，如果不填接口有严格的频率限制
  limit?: number // 	期望请求的数据量，默认值和最大值都为1000。注意：可能会出现返回条数少于limit的情况，需结合返回的has_more字段判断是否继续请求。
  voice_format?: VoiceFormat // 语音消息类型，0-Amr 1-Silk，默认0。可通过该参数控制返回的语音格式，开发者可按需选择自己程序支持的一种格式
  open_kfid?: string // 指定拉取某个客服帐号的消息，否则默认返回有权限的客服帐号的消息。当客服帐号较多，建议按open_kfid来拉取以获取更好的性能。
}

export interface SyncMessageResponse extends ResponseBase {
  next_cursor: string // 下次调用带上该值，则从当前的位置继续往后拉，以实现增量拉取。强烈建议对该字段入库保存，每次请求读取带上，请求结束后更新。避免因意外丢，导致必须从头开始拉取，引起消息延迟。
  has_more: TrueOrFalse // 是否还有更多数据。0-否；1-是。不能通过判断msg_list是否空来停止拉取，可能会出现has_more为1，而msg_list为空的情况
  msg_list: WxkfMessage<MessageTypes>[] // 消息列表
}

export type WxkfMessage<T extends MessageTypes> = WxkfMessageBase & T

export type WxkfMessageBase = {
  msgid: string // 消息ID
  open_kfid?: string // 客服帐号ID（msgtype为event，该字段不返回）
  external_userid?: string // 客户UserID（msgtype为event，该字段不返回）
  send_time: number // 消息发送时间
  origin: MessageOrigin // 消息来源。3-微信客户发送的消息 4-系统推送的事件消息 5-接待人员在企业微信客户端发送的消息
  servicer_userid: string // 从企业微信给客户发消息的接待人员userid（即仅origin为5才返回；msgtype为event，该字段不返回）
}

export enum VoiceFormat {
  VOICE_FORMAT_AMR = 0,
  VOICE_FORMAT_SILK = 1,
}

export enum TrueOrFalse {
  FALSE = 0,
  TRUE = 1,
}

export enum MessageOrigin {
  WECHAT_CUSTOMER = 3, // 微信客户发送的消息
  SYSTEM_EVENT = 4, // 系统推送的事件消息
  WECOM_CLIENT = 5, // 接待人员在企业微信客户端发送的消息
}

export type MessageTypes = 
  | TextMessage

export interface TextMessage {
  msgtype: 'text',
  text: {
    content: string,
    menu_id?: string, // 客户点击菜单消息，触发的回复消息中附带的菜单ID
  }
}