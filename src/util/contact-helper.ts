import { payloads, types } from '../wechaty-dep'
import { ContactPayloadCache } from '../schema/cache'
import { Customer, Gender } from '../schema/request'

export const convertContactToPayload = (rawContact: Customer): ContactPayloadCache => {
  const contactPayload: ContactPayloadCache = {
    id: rawContact.external_userid,
    name: rawContact.nickname,
    gender: rawContact.gender || Gender.Unknown,
    unionId: rawContact.unionid,
    avatar: rawContact.avatar,
  }

  return contactPayload
}

export const convertContactPayloadCacheToWecahtyPayload = (contactPayload: ContactPayloadCache): payloads.Contact => {
  const payload: payloads.Contact = {
    id: contactPayload.id,
    gender: contactPayload.gender,
    type: types.Contact.Individual,
    name: contactPayload.name,
    avatar: contactPayload.avatar,
    friend: false,
    phone: [],
  }

  return payload
}