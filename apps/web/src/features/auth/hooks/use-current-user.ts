import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '@/api/auth.api'

export const currentUserQueryKey = ['users', 'me'] as const

export function useCurrentUser(enabled: boolean) {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    enabled,
  })
}
