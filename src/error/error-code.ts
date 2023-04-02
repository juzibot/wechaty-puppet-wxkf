export enum WXKF_ERROR {
  AUTH_ERROR = 100,
  SERVER_ERROR = 200,
  MESSAGE_PARSE_ERROR = 301,
  MESSAGE_SEND_ERROR_PARAM = 302, // 参数问题，重试也没用
  CONTACT_PARSE_ERROR = 401,
}

export const WXKF_ERROR_CODE = {
  ...WXKF_ERROR
}

export type WxkfErrorCodeType = 
  | WXKF_ERROR