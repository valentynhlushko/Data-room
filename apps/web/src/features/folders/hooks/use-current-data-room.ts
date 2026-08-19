import { useQuery } from '@tanstack/react-query'
import { getCurrentDataRoom } from '@/api/data-room.api'
import { dataRoomQueryKeys } from '../folder-query-keys'

export function useCurrentDataRoom() {
  return useQuery({
    queryKey: dataRoomQueryKeys.current,
    queryFn: getCurrentDataRoom,
  })
}
