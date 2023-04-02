export enum WXKF_ERROR {
  AUTH_ERROR = 100,
  SERVER_ERROR = 200,
  MESSAGE_PARSE_ERROR = 301,
  CONTACT_PARSE_ERROR = 401,
}

export const WXKF_ERROR_CODE = {
  ...WXKF_ERROR
}

export type WxkfErrorCodeType = 
  | WXKF_ERROR