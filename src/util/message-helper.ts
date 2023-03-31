import { payloads, types } from '../wechaty-dep'
import { WxkfMessage, MessageTypes, MsgType } from '../schema/request'
import { timestampToMilliseconds } from './time'
import WxkfError from '../error/error'
import { WXKF_ERROR } from '../error/error-code'

export const convertMessageToPayload = (rawMessage: WxkfMessage<MessageTypes>) => {
  const messagePayload: payloads.Message = {
    id: rawMessage.msgid,
    talkerId: rawMessage.external_userid,
    timestamp: timestampToMilliseconds(rawMessage.send_time),
    listenerId: rawMessage.open_kfid,
    type: types.Message.Unknown
  }

  switch (rawMessage.msgtype) {
    case MsgType.MSG_TYPE_TEXT:
      messagePayload.type = types.Message.Text
      messagePayload.text = rawMessage.text.content
      break
    default:
      throw new WxkfError(WXKF_ERROR.MESSAGE_PARSE_ERROR, `unsupported message type ${rawMessage.msgtype}`)
  }

  return messagePayload
}