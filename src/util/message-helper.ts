import { types } from '../wechaty-dep'
import { WxkfMessage, MessageTypes, MsgType } from '../schema/request'
import { timestampToMilliseconds } from './time'
import { MessagePayloadCache } from '../schema/cache'

export const convertMessageToPayload = (rawMessage: WxkfMessage<MessageTypes>) => {
  const messagePayload: MessagePayloadCache = {
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
        appid: rawMessage.miniprogram.appid,
        title: rawMessage.miniprogram.title,
        pagePath: rawMessage.miniprogram.pagepath,
      }
      messagePayload.mediaId = rawMessage.miniprogram.thumb_media_id
      break
    default:
      return null
  }

  return messagePayload
}