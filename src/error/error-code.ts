export enum WXKF_ERROR {
  AUTH_ERROR = 100,
  SERVER_ERROR = 200,
}

export const WXKF_ERROR_CODE = {
  ...WXKF_ERROR
}

export type WxkfErrorCodeType = 
  | WXKF_ERROR