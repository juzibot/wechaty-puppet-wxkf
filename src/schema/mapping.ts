import { GetAccessTokenRequest, GetAccessTokenResponse, GetKfAccountListRequest, GetKfAccountListResponse, MessageTypes, SendMessageRequest, SendMessageResponse, SyncMessageRequest, SyncMessageResponse } from './request'

export const baseUrl = 'https://qyapi.weixin.qq.com/cgi-bin'

export enum RequestTypes {
  GET_ACCESS_TOKEN,
  SYNC_MESSAGE,
  SEND_MESSAGE,
  GET_KF_ACCOUNT_LIST,
}

export const urlMapping = {
  [RequestTypes.GET_ACCESS_TOKEN]: '/gettoken',
  [RequestTypes.SYNC_MESSAGE]: '/kf/sync_msg',
  [RequestTypes.SEND_MESSAGE]: '/kf/send_msg',
  [RequestTypes.GET_KF_ACCOUNT_LIST]: '/kf/account/list',
}

export type RequestTypeMapping = {
  [RequestTypes.GET_ACCESS_TOKEN]: GetAccessTokenRequest
  [RequestTypes.SYNC_MESSAGE]: SyncMessageRequest
  [RequestTypes.SEND_MESSAGE]: SendMessageRequest<MessageTypes>
  [RequestTypes.GET_KF_ACCOUNT_LIST]: GetKfAccountListRequest
}

export type ResponseTypeMapping = {
  [RequestTypes.GET_ACCESS_TOKEN]: GetAccessTokenResponse
  [RequestTypes.SYNC_MESSAGE]: SyncMessageResponse
  [RequestTypes.SEND_MESSAGE]: SendMessageResponse
  [RequestTypes.GET_KF_ACCOUNT_LIST]: GetKfAccountListResponse
}