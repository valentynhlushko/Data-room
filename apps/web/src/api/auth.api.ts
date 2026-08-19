import { apiClient } from '@/lib/api-client'
import type { User } from '@/types/user'

export async function getCurrentUser() {
  const { data } = await apiClient.get<User>('/users/me')
  return data
}
