import { Image } from 'wechaty-puppet/types'
import { FileBox } from './filebox-dep'
import { PuppetWxkfOptions } from './schema/base'
import { ContactPayloadCache } from './schema/cache'
import { Manager } from './service/manager'
import { convertContactPayloadCacheToWechatyPayload } from './util/contact-helper'
import { Logger, Puppet, payloads } from './wechaty-dep'

export class PuppetWxkf extends Puppet {

  private readonly logger = new Logger(PuppetWxkf.name)
  private manager?: Manager

  constructor(private readonly wxkfOptions: PuppetWxkfOptions = {}) {
    super(wxkfOptions)
  }

  async onStart(): Promise<void> {
    this.logger.info('onStart()')
    this.manager = new Manager(this.wxkfOptions)

    this.manager.on('message', (payload) => {
      this.emit('message', payload)
    })
    this.manager.on('ready', (payload) => {
      this.emit('ready', payload)
    })
    this.manager.on('login', (payload) => {
      super.login(payload.contactId)
    })

    await this.manager.onStart()
  }

  async onStop(): Promise<void> {
    this.logger.info('onStop()')
    await this.manager.onStop()
    this.manager.removeAllListeners()
    delete this.manager
  }

  override messageRawPayload(messageId: string): Promise<any> {
    return this.manager.messagePayload(messageId)
  }

  override messageRawPayloadParser(rawPayload: any): Promise<payloads.Message> {
    return Promise.resolve(rawPayload as payloads.Message)
  }

  override messageSendText(conversationId: string, text: string): Promise<string | void> {
    return this.manager.messageSendText(conversationId, text)
  }

  override messageSendFile(conversationId: string, file: FileBox): Promise<string | void> {
    return this.manager.messageSendFile(conversationId, file)
  }

  override messageSendMiniProgram(conversationId: string, miniProgramPayload: payloads.MiniProgram): Promise<string | void> {
    return this.manager.messageSendMiniProgram(conversationId, miniProgramPayload)
  }

  override messageSendUrl(conversationId: string, urlLinkPayload: payloads.UrlLink): Promise<string | void> {
    return this.manager.messageSendUrl(conversationId, urlLinkPayload)
  }

  override messageSendLocation(conversationId: string, locationPayload: payloads.Location): Promise<string | void> {
    return this.manager.messageSendLocation(conversationId, locationPayload)
  }

  override messageImage(messageId: string, imageType: Image): Promise<FileBox> {
    void imageType
    return this.manager.messageFile(messageId)
  }

  override messageFile(messageId: string): Promise<FileBox> {
    return this.manager.messageFile(messageId)
  }

  override messageUrl(messageId: string): Promise<payloads.UrlLink> {
    return this.manager.messageUrl(messageId)
  }

  override messageLocation(messageId: string): Promise<payloads.Location> {
    return this.manager.messageLocation(messageId)
  }

  override messageContact(messageId: string): Promise<string> {
    return this.manager.messageContact(messageId)
  }

  override messageMiniProgram(messageId: string): Promise<payloads.MiniProgram> {
    return this.manager.messageMiniProgram(messageId)
  }

  override contactList(): Promise<string[]> {
    return Promise.resolve([])
  }

  override roomList(): Promise<string[]> {
    return Promise.resolve([])
  }

  override contactRawPayload(contactId: string): Promise<ContactPayloadCache> {
    return this.manager.contactPayload(contactId)
  }

  override contactRawPayloadParser(rawPayload: ContactPayloadCache): Promise<payloads.Contact> {
    return Promise.resolve(convertContactPayloadCacheToWechatyPayload(rawPayload))
  }

}