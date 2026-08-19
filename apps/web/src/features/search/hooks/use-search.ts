import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchItems } from '@/api/search.api'
import { searchQueryKeys } from '../search-query-keys'

export function useSearch(query: string) {
  const q = query.trim()

  return useQuery({
    queryKey: searchQueryKeys.query(q),
    queryFn: () => searchItems(q),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
  })
}
