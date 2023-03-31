import { EventMessage } from 'wechaty-puppet/payloads'

export type CallbackServerEvents = {
  message: (messageToken: string) => void | Promise<void>
}

export type ManagerEvents = {
  message: (payload: EventMessage) => void | Promise<void>
}