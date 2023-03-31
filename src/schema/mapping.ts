import { GetAccessTokenRequest, GetAccessTokenResponse, SyncMessageRequest, SyncMessageResponse } from './request'

export const baseUrl = 'https://qyapi.weixin.qq.com/cgi-bin'

export enum RequestTypes {
  GET_ACCESS_TOKEN,
  SYNC_MESSAGE
}

export const urlMapping = {
  [RequestTypes.GET_ACCESS_TOKEN]: '/gettoken',
  [RequestTypes.SYNC_MESSAGE]: '/kf/sync_msg',
}

export type RequestTypeMapping = {
  [RequestTypes.GET_ACCESS_TOKEN]: GetAccessTokenRequest
  [RequestTypes.SYNC_MESSAGE]: SyncMessageRequest
}

export type ResponseTypeMapping = {
  [RequestTypes.GET_ACCESS_TOKEN]: GetAccessTokenResponse
  [RequestTypes.SYNC_MESSAGE]: SyncMessageResponse
}