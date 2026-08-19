import { apiClient } from '@/lib/api-client'
import type { SearchResults } from '@/types/search'

export async function searchItems(query: string) {
  const { data } = await apiClient.get<SearchResults>('/search', {
    params: { q: query },
  })
  return data
}
