import { payloads } from '../wechaty-dep'

export type MessagePayloadCache = payloads.Message & {
  mediaId?: string
  mediaPath?: string,
  mediaOssPath?: string,
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
