import { DAY } from '../util/time'
import { payloads } from '../wechaty-dep'
import { FileTypes } from './request'

export type MessagePayloadCache = payloads.Message & {
  mediaId?: string
  mediaPath?: string,
  mediaOssUrl?: string,
  urlPayload?: payloads.UrlLink,
  contactId?: string,
  miniProgramPayload?: payloads.MiniProgram,
  locationPayload?: payloads.Location,
}

export interface ContactPayloadCache {
  id: string
  name: string
  avatar: string
  gender?: number
  unionId?: string
}

export interface MediaIdCache {
  mediaId: string,
  createdAt: number, // 素材上传得到media_id，该media_id仅三天内有效
  type: FileTypes,
}

export const MediaExpireThreshold = 3 * DAY