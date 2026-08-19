import { apiClient } from '@/lib/api-client'
import type { CurrentDataRoom } from '@/types/data-room'

export async function getCurrentDataRoom() {
  const { data } = await apiClient.get<CurrentDataRoom>('/data-rooms/current')
  return data
}
