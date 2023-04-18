import { DeregisterWxkfPuppetRequest, GetAccessTokenRequest, GetAccessTokenResponse, GetContactInfoRequest, GetContactInfoResponse, GetKfAccountListRequest, GetKfAccountListResponse, MessageSendTypes, RegisterWxkfPuppetRequest, RegisterWxkfPuppetResponse, SendMessageRequest, SendMessageResponse, SyncMessageRequest, SyncMessageResponse, DeregisterWxkfPuppetResponse } from './request'

export const baseUrl = 'https://qyapi.weixin.qq.com/cgi-bin'

export enum RequestTypes {
  GET_ACCESS_TOKEN,
  SYNC_MESSAGE,
  SEND_MESSAGE,
  GET_KF_ACCOUNT_LIST,
  BATCH_GET_CUSTOMER_INFO,
}

export const urlMapping = {
  [RequestTypes.GET_ACCESS_TOKEN]: '/gettoken',
  [RequestTypes.SYNC_MESSAGE]: '/kf/sync_msg',
  [RequestTypes.SEND_MESSAGE]: '/kf/send_msg',
  [RequestTypes.GET_KF_ACCOUNT_LIST]: '/kf/account/list',
  [RequestTypes.BATCH_GET_CUSTOMER_INFO]: '/kf/customer/batchget'
}

export type RequestTypeMapping = {
  [RequestTypes.GET_ACCESS_TOKEN]: GetAccessTokenRequest
  [RequestTypes.SYNC_MESSAGE]: SyncMessageRequest
  [RequestTypes.SEND_MESSAGE]: SendMessageRequest<MessageSendTypes>
  [RequestTypes.GET_KF_ACCOUNT_LIST]: GetKfAccountListRequest
  [RequestTypes.BATCH_GET_CUSTOMER_INFO]: GetContactInfoRequest
}

export type ResponseTypeMapping = {
  [RequestTypes.GET_ACCESS_TOKEN]: GetAccessTokenResponse
  [RequestTypes.SYNC_MESSAGE]: SyncMessageResponse
  [RequestTypes.SEND_MESSAGE]: SendMessageResponse
  [RequestTypes.GET_KF_ACCOUNT_LIST]: GetKfAccountListResponse
  [RequestTypes.BATCH_GET_CUSTOMER_INFO]: GetContactInfoResponse
}

export enum ManagerCenterRequestTypes {
  GET_ACCESS_TOKEN,
  REGISTER,
  DEREGISTER,
}

export const managerCenterUrlMapping = {
  [ManagerCenterRequestTypes.GET_ACCESS_TOKEN]: '/puppetWxkfManager/getToken',
  [ManagerCenterRequestTypes.REGISTER]: '/puppetWxkfManager/register',
  [ManagerCenterRequestTypes.DEREGISTER]: '/puppetWxkfManager/deregister',
}

export type ManagerCenterRequestTypeMapping = {
  [ManagerCenterRequestTypes.GET_ACCESS_TOKEN]: GetAccessTokenRequest,
  [ManagerCenterRequestTypes.REGISTER]: RegisterWxkfPuppetRequest,
  [ManagerCenterRequestTypes.DEREGISTER]: DeregisterWxkfPuppetRequest,
}

export type ManagerCenterResponseTypeMapping = {
  [ManagerCenterRequestTypes.GET_ACCESS_TOKEN]: GetAccessTokenResponse,
  [ManagerCenterRequestTypes.REGISTER]: RegisterWxkfPuppetResponse,
  [ManagerCenterRequestTypes.DEREGISTER]: DeregisterWxkfPuppetResponse,
}
