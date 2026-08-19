import { useQuery } from '@tanstack/react-query'
import { resolveShareLink } from '@/api/share.api'
import { shareQueryKeys } from '../share-query-keys'

export function useShareLink(token: string | undefined) {
  return useQuery({
    queryKey: shareQueryKeys.link(token ?? ''),
    queryFn: () => resolveShareLink(token!),
    enabled: Boolean(token),
    retry: false,
  })
}
