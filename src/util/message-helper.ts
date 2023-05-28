import { log, types } from '../wechaty-dep'
import { WxkfReceiveMessage, MsgType, MsgTypeChineseName, MessageReceiveTypes, MessageOrigin } from '../schema/request'
import { timestampToMilliseconds } from './time'
import { MessagePayloadCache } from '../schema/cache'

export const convertMessageToPayload = (rawMessage: WxkfReceiveMessage<MessageReceiveTypes>) => {
  const messagePayload: MessagePayloadCache = {
    id: rawMessage.msgid,
    talkerId: rawMessage.external_userid,
    timestamp: timestampToMilliseconds(rawMessage.send_time),
    listenerId: rawMessage.open_kfid,
    type: types.Message.Unknown
  }

  if (rawMessage.origin === MessageOrigin.WECOM_CLIENT) {
    messagePayload.talkerId = rawMessage.open_kfid
    messagePayload.listenerId = rawMessage.external_userid
  }

  if (rawMessage.origin === MessageOrigin.SYSTEM_EVENT) {
    log.warn(`got a event message in messageHandler, raw message: ${JSON.stringify(rawMessage)}`)
  }

  switch (rawMessage.msgtype) {
    case MsgType.MSG_TYPE_TEXT:
      messagePayload.type = types.Message.Text
      messagePayload.text = rawMessage.text.content
      break
    case MsgType.MSG_TYPE_IMAGE:
      messagePayload.type = types.Message.Image
      messagePayload.mediaId = rawMessage.image.media_id
      break
    case MsgType.MSG_TYPE_VOICE:
      messagePayload.type = types.Message.Audio
      messagePayload.mediaId = rawMessage.voice.media_id
      break
    case MsgType.MSG_TYPE_VIDEO:
      messagePayload.type = types.Message.Video
      messagePayload.mediaId = rawMessage.video.media_id
      break
    case MsgType.MSG_TYPE_FILE:
      messagePayload.type = types.Message.Attachment
      messagePayload.mediaId = rawMessage.file.media_id
      break
    case MsgType.MSG_TYPE_LOCATION:
      messagePayload.type = types.Message.Location
      messagePayload.locationPayload = {
        ...rawMessage.location,
        accuracy: 15,
      }
      break
    case MsgType.MSG_TYPE_LINK:
      messagePayload.type = types.Message.Url
      messagePayload.urlPayload = {
        description: rawMessage.link.desc,
        thumbnailUrl: rawMessage.link.pic_url,
        title: rawMessage.link.title,
        url: rawMessage.link.url,
      }
      break
    case MsgType.MSG_TYPE_BUSINESS_CARD:
      messagePayload.type = types.Message.Contact
      messagePayload.contactId = rawMessage.business_card.userid
      break
    case MsgType.MSG_TYPE_MINIPROGRAM: 
      messagePayload.type = types.Message.MiniProgram
      messagePayload.miniProgramPayload = {
        username: rawMessage.miniprogram.appid, // wechaty miniprogram payload key is different with wecom
        title: rawMessage.miniprogram.title,
        pagePath: rawMessage.miniprogram.pagepath,
      }
      messagePayload.mediaId = rawMessage.miniprogram.thumb_media_id
      break
    default:
      messagePayload.type = types.Message.Text
      messagePayload.text = `收到一条【${MsgTypeChineseName[rawMessage.msgtype] || rawMessage.msgtype}】消息，此消息类型暂不支持显示。`
      break
  }

  return messagePayload
}