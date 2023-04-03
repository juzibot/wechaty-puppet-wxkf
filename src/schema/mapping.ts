import { GetZJYYAccessTokenRequest, GetZJYYAccessTokenResponse, GetContactInfoRequest, GetContactInfoResponse, GetKfAccountListRequest, GetKfAccountListResponse, MessageTypes, SendMessageRequest, SendMessageResponse, SyncMessageRequest, SyncMessageResponse, GetFWSDKFAccessTokenRequest, GetFWSDKFAccessTokenResponse } from './request'

export const baseUrl = 'https://qyapi.weixin.qq.com/cgi-bin'

export enum RequestTypes {
  GET_ZJYY_ACCESS_TOKEN,
  GET_FWSDKF_ACCESS_TOKEN,
  SYNC_MESSAGE,
  SEND_MESSAGE,
  GET_KF_ACCOUNT_LIST,
  BATCH_GET_CUSTOMER_INFO,
}

export const urlMapping = {
  [RequestTypes.GET_ZJYY_ACCESS_TOKEN]: '/gettoken',
  [RequestTypes.GET_FWSDKF_ACCESS_TOKEN]: '/service/get_provider_token',
  [RequestTypes.SYNC_MESSAGE]: '/kf/sync_msg',
  [RequestTypes.SEND_MESSAGE]: '/kf/send_msg',
  [RequestTypes.GET_KF_ACCOUNT_LIST]: '/kf/account/list',
  [RequestTypes.BATCH_GET_CUSTOMER_INFO]: '/kf/customer/batchget'
}

export type RequestTypeMapping = {
  [RequestTypes.GET_ZJYY_ACCESS_TOKEN]: GetZJYYAccessTokenRequest
  [RequestTypes.GET_FWSDKF_ACCESS_TOKEN]: GetFWSDKFAccessTokenRequest,
  [RequestTypes.SYNC_MESSAGE]: SyncMessageRequest
  [RequestTypes.SEND_MESSAGE]: SendMessageRequest<MessageTypes>
  [RequestTypes.GET_KF_ACCOUNT_LIST]: GetKfAccountListRequest
  [RequestTypes.BATCH_GET_CUSTOMER_INFO]: GetContactInfoRequest
}

export type ResponseTypeMapping = {
  [RequestTypes.GET_ZJYY_ACCESS_TOKEN]: GetZJYYAccessTokenResponse
  [RequestTypes.GET_FWSDKF_ACCESS_TOKEN]: GetFWSDKFAccessTokenResponse,
  [RequestTypes.SYNC_MESSAGE]: SyncMessageResponse
  [RequestTypes.SEND_MESSAGE]: SendMessageResponse
  [RequestTypes.GET_KF_ACCOUNT_LIST]: GetKfAccountListResponse
  [RequestTypes.BATCH_GET_CUSTOMER_INFO]: GetContactInfoResponse
}