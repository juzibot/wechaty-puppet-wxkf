export const KnownErrorCodeReason: {
  [errorCode: string]: string
} = {
  '95001': '给该客户发送的消息数量已达上限，请等待客户回复后方可再发送。', // 当用户主动发送消息给微信客服时，企业最多可发送5条消息给用户；若用户继续发送消息，企业可再次下发消息
}
