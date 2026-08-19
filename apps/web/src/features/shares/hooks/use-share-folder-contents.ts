import { useInfiniteQuery } from '@tanstack/react-query'
import { getShareFolderContents } from '@/api/share.api'
import { shareQueryKeys } from '../share-query-keys'

export function useShareFolderContents(
  token: string | undefined,
  folderId: string | undefined,
) {
  return useInfiniteQuery({
    queryKey: shareQueryKeys.linkContents(token ?? '', folderId ?? ''),
    queryFn: ({ pageParam }) =>
      getShareFolderContents(token!, folderId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextFileCursor ?? undefined,
    enabled: Boolean(token) && Boolean(folderId),
  })
}
