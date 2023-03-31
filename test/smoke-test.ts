import { PuppetWxkf } from '../src/puppet-wxkf'

const puppet = new PuppetWxkf()

puppet.on('error', (e) => {
  console.log((e as Error).message)
})

puppet.on('message', async payload => {
  console.log('message', payload)

  const messageId = payload.messageId

  const messagePayload = await puppet.messageRawPayloadParser(await puppet.messagePayload(messageId))

  console.log(messagePayload)
})

puppet.on('ready', payload => {
  console.log(payload)
})

puppet.start()