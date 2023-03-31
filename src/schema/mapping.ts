import { GetAccessTokenRequest, GetAccessTokenResponse, MessageTypes, SendMessageRequest, SendMessageResponse, SyncMessageRequest, SyncMessageResponse } from './request'

export const baseUrl = 'https://qyapi.weixin.qq.com/cgi-bin'

export enum RequestTypes {
  GET_ACCESS_TOKEN,
  SYNC_MESSAGE,
  SEND_MESSAGE,
}

export const urlMapping = {
  [RequestTypes.GET_ACCESS_TOKEN]: '/gettoken',
  [RequestTypes.SYNC_MESSAGE]: '/kf/sync_msg',
  [RequestTypes.SEND_MESSAGE]: '/kf/send_msg'
}

export type RequestTypeMapping = {
  [RequestTypes.GET_ACCESS_TOKEN]: GetAccessTokenRequest
  [RequestTypes.SYNC_MESSAGE]: SyncMessageRequest
  [RequestTypes.SEND_MESSAGE]: SendMessageRequest<MessageTypes>
}

export type ResponseTypeMapping = {
  [RequestTypes.GET_ACCESS_TOKEN]: GetAccessTokenResponse
  [RequestTypes.SYNC_MESSAGE]: SyncMessageResponse
  [RequestTypes.SEND_MESSAGE]: SendMessageResponse
}