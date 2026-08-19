import { useInfiniteQuery } from '@tanstack/react-query'
import { getFolderContents } from '@/api/folder.api'
import { folderQueryKeys } from '../folder-query-keys'

export function useFolderContents(folderId: string | undefined) {
  return useInfiniteQuery({
    queryKey: folderQueryKeys.contents(folderId ?? ''),
    queryFn: ({ pageParam }) => getFolderContents(folderId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextFileCursor ?? undefined,
    enabled: Boolean(folderId),
  })
}
