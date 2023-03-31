import { payloads } from '../wechaty-dep'

export type MessagePayloadCache = payloads.Message & {
  mediaId?: string
  mediaPath?: string,
  urlPayload?: payloads.UrlLink,
  contactId?: string,
  miniProgramPayload?: payloads.MiniProgram,
  locationPayload?: payloads.Location,
}