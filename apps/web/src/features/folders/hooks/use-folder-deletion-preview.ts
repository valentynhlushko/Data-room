import { useQuery } from '@tanstack/react-query'
import { getFolderDeletionPreview } from '@/api/folder.api'
import { folderQueryKeys } from '../folder-query-keys'

export function useFolderDeletionPreview(
  folderId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: folderQueryKeys.deletionPreview(folderId ?? ''),
    queryFn: () => getFolderDeletionPreview(folderId!),
    enabled: Boolean(folderId) && enabled,
  })
}
