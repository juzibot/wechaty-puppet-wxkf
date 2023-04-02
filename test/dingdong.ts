import { PuppetWxkf } from '../src/puppet-wxkf'

const puppet = new PuppetWxkf()

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

  if (messagePayload.text === 'ding') {
    await puppet.messageSendText(messagePayload.talkerId, 'dong')
  }

  const contact = await puppet.contactPayload(messagePayload.talkerId)
  console.log(contact)

})

puppet.on('ready', payload => {
  console.log(payload)
})

puppet.start()
