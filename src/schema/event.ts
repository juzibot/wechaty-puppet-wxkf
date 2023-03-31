import { payloads } from '../wechaty-dep'

export type CallbackServerEvents = {
  message: (messageToken: string) => void | Promise<void>
}

export type ManagerEvents = {
  message: (payload: payloads.EventMessage) => void | Promise<void>
  ready: (payload: payloads.EventReady) => void | Promise<void>
  login: (payload: payloads.EventLogin) => void | Promise<void>
}