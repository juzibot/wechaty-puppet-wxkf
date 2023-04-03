import FormData from 'form-data'
import stream from 'stream'

export interface ResponseBase {
  errcode: number, // 返回码
  errmsg: string, // 错误码描述
}

export interface GetZJYYAccessTokenRequest {
  corpid: string,
  corpsecret: string,
}

export interface GetZJYYAccessTokenResponse extends ResponseBase {
  access_token?: string,
  expires_in?: number
}

export interface GetFWSDKFAccessTokenRequest {
  corpid: string,
  provider_secret: string,
}

export interface GetFWSDKFAccessTokenResponse extends ResponseBase {
  provider_access_token?: string,
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
  msgtype: MsgType
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

export enum MsgType {
  MSG_TYPE_TEXT = 'text',
  MSG_TYPE_IMAGE = 'image',
  MSG_TYPE_VOICE = 'voice',
  MSG_TYPE_VIDEO = 'video',
  MSG_TYPE_FILE = 'file',
  MSG_TYPE_LOCATION = 'location',
  MSG_TYPE_LINK = 'link',
  MSG_TYPE_BUSINESS_CARD = 'business_card',
  MSG_TYPE_MINIPROGRAM = 'miniprogram',
  MSG_TYPE_CHANNEL = 'channels',

  // unsupported message types
  MSG_TYPE_MENU = 'msgmenu',
  MSG_TYPE_CHANNEL_PRODUCT = 'channels_shop_product',
  MSG_TYPE_CHANNEL_ORDER = 'channel_shop_order',
  MSG_TYPE_CHAT_HISTORY = 'merged_msg',
  MSG_TYPE_MEETING = 'meeting',
  MSG_TYPE_SCHEDULE = 'schedule',
}

export const MsgTypeChineseName = {
  [MsgType.MSG_TYPE_TEXT]: '文本',
  [MsgType.MSG_TYPE_IMAGE]: '图片',
  [MsgType.MSG_TYPE_VOICE]: '语音',
  [MsgType.MSG_TYPE_VIDEO]: '视频',
  [MsgType.MSG_TYPE_FILE]: '文件',
  [MsgType.MSG_TYPE_LOCATION]: '位置',
  [MsgType.MSG_TYPE_LINK]: '图文链接',
  [MsgType.MSG_TYPE_BUSINESS_CARD]: '名片',
  [MsgType.MSG_TYPE_MINIPROGRAM]: '小程序',
  [MsgType.MSG_TYPE_CHANNEL]: '视频号',
  [MsgType.MSG_TYPE_MENU]: '菜单',
  [MsgType.MSG_TYPE_CHANNEL_PRODUCT]: '视频号商品',
  [MsgType.MSG_TYPE_CHANNEL_ORDER]: '视频号订单',
  [MsgType.MSG_TYPE_CHAT_HISTORY]: '合并的聊天记录',
  [MsgType.MSG_TYPE_MEETING]: '会议',
  [MsgType.MSG_TYPE_SCHEDULE]: '日程',
}

export type MessageTypes = 
  | TextMessage
  | ImageMessage
  | VoiceMessage
  | VideoMessage
  | FileMessage
  | LocationMessage
  | LinkMessage
  | BusinessCardMessage
  | MiniProgramMessage
  | ChannelMessage
  | UnsupportedMessage

export interface TextMessage {
  msgtype: MsgType.MSG_TYPE_TEXT
  text: {
    content: string,
    menu_id?: string, // 客户点击菜单消息，触发的回复消息中附带的菜单ID
  }
}

export interface ImageMessage {
  msgtype: MsgType.MSG_TYPE_IMAGE
  image: {
    media_id: string
  }
}

export interface VoiceMessage {
  msgtype: MsgType.MSG_TYPE_VOICE
  voice: {
    media_id: string
  }
}

export interface VideoMessage {
  msgtype: MsgType.MSG_TYPE_VIDEO
  video: {
    media_id: string
  }
}

export interface FileMessage {
  msgtype: MsgType.MSG_TYPE_FILE
  file: {
    media_id: string
  }
}

export interface LocationMessage {
  msgtype: MsgType.MSG_TYPE_LOCATION
  location: {
    latitude: number,
    longitude: number,
    name: string,
    address: string
  }
}

export interface LinkMessage {
  msgtype: MsgType.MSG_TYPE_LINK,
  link: {
    title: string,
    desc: string,
    url: string,
    pic_url: string
  }
}

export interface BusinessCardMessage {
  msgtype: MsgType.MSG_TYPE_BUSINESS_CARD
  business_card: {
    userid: string
  }
}

export interface MiniProgramMessage {
  msgtype: MsgType.MSG_TYPE_MINIPROGRAM,
  miniprogram: {
    title: string,
    appid: string,
    pagepath: string,
    thumb_media_id: string
  }
}

export interface ChannelMessage {
  msgtype: MsgType.MSG_TYPE_CHANNEL
}

export interface UnsupportedMessage {
  msgtype:
  | MsgType.MSG_TYPE_MENU
  | MsgType.MSG_TYPE_CHANNEL_PRODUCT
  | MsgType.MSG_TYPE_CHANNEL_ORDER
  | MsgType.MSG_TYPE_CHAT_HISTORY
  | MsgType.MSG_TYPE_MEETING
  | MsgType.MSG_TYPE_SCHEDULE
}

export type SendMessageRequest<T extends MessageTypes> = SendMessageRequestBase & T

export interface SendMessageRequestBase {
  touser: string,
  open_kfid: string,
  msgid?: string // 如果请求参数指定了msgid，则原样返回，否则系统自动生成并返回。若指定msgid，开发者需确保客服账号内唯一，否则接口返回错误。
  msgtype: MsgType
}

export interface SendMessageResponse extends ResponseBase {
  msgid: string
}

export interface GetKfAccountListRequest {
  offset?: number // 分页，偏移量, 默认为0
  limit?: number // 分页，预期请求的数据量，默认为100，取值范围 1 ~ 100
}

export interface GetKfAccountListResponse extends ResponseBase {
  account_list: KfAccount[]
}

export interface KfAccount {
  open_kfid: string
  name: string
  avatar: string
  manage_privilege: boolean // 当前调用接口的应用身份，是否有该客服账号的管理权限（编辑客服帐号信息、分配会话和收发消息）
}

export interface GetContactInfoRequest {
  external_userid_list: string[]
  need_enter_session_context?: TrueOrFalse
}

export interface GetContactInfoResponse extends ResponseBase {
  customer_list: Customer[]
}

export interface Customer {
  external_userid: string
  nickname: string
  avatar: string // 微信头像。第三方不可获取
  gender: Gender // 性别。第三方不可获取，统一返回0
  unionid: string // unionid，需要绑定微信开发者帐号才能获取到，查看绑定方法。第三方不可获取
  enter_session_context?: CustomerSession
}

export interface CustomerSession {
  scene: string // 进入会话的场景值，获取客服帐号链接开发者自定义的场景值
  scene_param: string // 进入会话的自定义参数，获取客服帐号链接返回的url，开发者按规范拼接的scene_param参数
  wechat_channels: CustomerSessionChannel // 进入会话的视频号信息，从视频号进入会话才有值
}

export interface CustomerSessionChannel {
  nickname?: string // 视频号名称，视频号场景值为1、2、3时返回此项
  shop_nickname?: string // 视频号小店名称，视频号场景值为4、5时返回此项
  scene: CustomerSessionChannelScene // 视频号场景值
}

export enum CustomerSessionChannelScene {
  HOMEPAGE = 1, // 视频号主页
  LIVE_PRODUCT_LIST = 2, // 视频号直播间商品列表页
  DISPLAY_WINDOW = 3, // 视频号商品橱窗页
  CHANNEL_SHOP_PRODUCT_DETAIL = 4, // 视频号小店商品详情页
  CHANNEL_SHOP_ORDER = 5, // 视频号小店订单页
}

export enum Gender {
  Unknown = 0,
  Male = 1,
  Female = 2,
}

export type UploadMediaRequest = FormData

export interface UploadMediaResponse extends ResponseBase {
  type: FileTypes
  media_id: string
  created_at: string
}

export enum FileTypes {
  IMAGE = 'image',
  VIDEO = 'video',
  VOICE = 'voice',
  FILE = 'file',
}

export interface DownloadMediaRequest {
  access_token: string,
  media_id: string,
}

export type DownloadMediaResponse = stream.Readable

export type FileMessageTypes = ImageMessage | VoiceMessage | VideoMessage | FileMessage