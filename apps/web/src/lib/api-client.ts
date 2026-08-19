import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { supabase } from '@/lib/supabase'

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined
    const requestUrl = originalRequest?.url ?? ''

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      requestUrl.includes('/share-links/')
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    const { data, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError || !data.session) {
      return Promise.reject(error)
    }

    originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`
    return apiClient(originalRequest)
  },
)
