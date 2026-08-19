import axios from 'axios'

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message

    if (typeof message === 'string' && message.trim()) {
      return message
    }

    if (Array.isArray(message) && typeof message[0] === 'string') {
      return message[0]
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
