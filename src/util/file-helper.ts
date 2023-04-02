import { FileTypes } from '../schema/request'
import os from 'os'
import path from 'path'
import { v4 as uuidV4 } from 'uuid'

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
  if (type.includes('/')) return true

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