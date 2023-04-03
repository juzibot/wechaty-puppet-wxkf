import { types } from '../src/wechaty-dep'
import { FileBox } from '../src/filebox-dep'
import { PuppetWxkf } from '../src/puppet-wxkf'

const puppet = new PuppetWxkf()

const file = FileBox.fromUrl('https://s3.cn-north-1.amazonaws.com.cn/xiaoju-material/public/8f69a694-bbbc-43d3-941e-13a38e3ed899%2F3.jpg')
// const file = FileBox.fromFile('/Users/myonlystarcn/LocalDocuments/code/work/wxkf/wechaty-puppet-wxkf/test/dingdong.ts')

puppet.on('error', (e) => {
  console.log((e as Error).message)
})

puppet.on('login', async payload => {
  const contact = await puppet.contactPayload(payload.contactId)
  console.log(contact)
})

puppet.on('message', async payload => {
  console.log('message', payload)

  const messageId = payload.messageId

  const messagePayload = await puppet.messagePayload(messageId)

  if (true) {
    await puppet.messageSendText(messagePayload.talkerId, 'dong')
    // await puppet.messageSendFile(messagePayload.talkerId, file)
  }

  if (messagePayload.type === types.Message.Image) {
    const file = await puppet.messageFile(messageId)
    console.log(file)
    await file.toFile(undefined, true)
  }

  if (messagePayload.type === types.Message.MiniProgram) {
    console.log(await puppet.messageMiniProgram(messageId))
  }

  const contact = await puppet.contactPayload(messagePayload.talkerId)
  console.log(contact)

})

puppet.on('ready', payload => {
  console.log(payload)
  // void puppet.messageSendFile('wmyhmpBwAAgjUIT_sNHgXv0wW7bmRc8Q', file)
})

puppet.start()
