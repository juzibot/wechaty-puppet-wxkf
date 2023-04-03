import { FileTypes } from '../schema/request'
import os from 'os'
import path from 'path'
import { v4 as uuidV4 } from 'uuid'
import crypto from 'crypto'
import { FileBox } from '../filebox-dep'
import { types } from '../wechaty-dep'
import { UPLOAD_TYPE } from '../service/oss/interface'

const MB = 1024 * 1024

const isImage = (type: string) => {
  return /(.(jpg|jpeg|png)$|image\/(jpg|jpeg|png))/i.test(type)
}

const isVideo = (type: string) => {
  return /.mp4|video\/mp4/i.test(type)
}

const isVoice = (type: string) => {
  return /.(arm)$/i.test(type)
}

export const getFileType = (type: string) => {
  if (isImage(type)) return FileTypes.IMAGE
  if (isVideo(type)) return FileTypes.VIDEO
  if (isVoice(type)) return FileTypes.VOICE
  return FileTypes.FILE
}

export const FILE_SIZE_THRESHOLD = {
  [FileTypes.IMAGE]: 10 * MB,
  [FileTypes.VOICE]: 2 * MB,
  [FileTypes.VIDEO]: 10 * MB,
  [FileTypes.FILE]: 20 * MB
}

export const FileTempDir = path.join(
  os.tmpdir(),
  '.wecahty',
  'puppet-wxkf',
  'files'
)

export const getDefaultFilename = (fileType: FileTypes) => {
  switch (fileType) {
    case FileTypes.IMAGE:
      return `${uuidV4()}.jpg`
    case FileTypes.VIDEO:
      return `${uuidV4()}.mp4`
    case FileTypes.VOICE:
      return `${uuidV4()}.amr`
    default:
      return `${uuidV4()}.dat`
  }
}

export const getContentType = (type: string) => {
  if (type.includes('/')) return type

  if (isImage(type)) {
    return `image/${type}`
  }
  if (isVideo(type)) {
    return 'video/mp4'
  }
  if (isVoice(type)) {
    return 'audio/amr'
  }
  return `application/${type}`
}

export async function getMd5(fileBox: FileBox): Promise<string> {
  const buffer = await fileBox.toBuffer()
  const hash = crypto.createHash('md5')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  hash.update(buffer as any, 'utf8')
  const md5 = hash.digest('hex')
  return md5
}

export const getUploadType = (type: types.Message) => {
  switch (type) {
    case types.Message.Image:
      return UPLOAD_TYPE.IMAGE_MSG
    case types.Message.Url:
    case types.Message.MiniProgram:
      return UPLOAD_TYPE.LINK_MSG
    case types.Message.Video:
      return UPLOAD_TYPE.VIDEO_MSG
    default:
      return UPLOAD_TYPE.FILE_MSG
  }
}