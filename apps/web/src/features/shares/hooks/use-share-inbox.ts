import { useQuery } from '@tanstack/react-query'
import { getShareInbox } from '@/api/share.api'
import { shareQueryKeys } from '../share-query-keys'

export function useShareInbox() {
  return useQuery({
    queryKey: shareQueryKeys.inbox,
    queryFn: getShareInbox,
  })
}
