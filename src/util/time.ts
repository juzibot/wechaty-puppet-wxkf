export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR
export const WEEK = 7 * DAY

export const sleep = function (timeInMillisecond: number) {
  return new Promise(resolve => {
    setTimeout(resolve, timeInMillisecond)
  })
}

export const timestampToMilliseconds = (timestamp: number) => {
  return timestamp < 1e11 ? timestamp * 1000 : timestamp
}

/**
 * Convert timestamp or seconds to seconds
 * @param timestamp timestamp
 * @returns seconds
 */
export function timestampToSeconds (timestamp: number): number {
  /**
    * 1e11:
    *   in milliseconds:  Sat Mar 03 1973 09:46:39 UTC
    *   in seconds:       Wed Nov 16 5138 9:46:40 UTC
    */
  if (timestamp < 1e11) {
    return timestamp
  }

  return Math.floor(timestamp / 1000)
}
