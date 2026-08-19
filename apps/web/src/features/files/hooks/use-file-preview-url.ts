import { useQuery } from '@tanstack/react-query'
import { getFilePreviewUrl } from '@/api/file.api'
import { getShareFilePreviewUrl } from '@/api/share.api'
import { shareQueryKeys } from '@/features/shares/share-query-keys'

export function useFilePreviewUrl(
  fileId: string | undefined,
  enabled: boolean,
  shareToken?: string,
) {
  return useQuery({
    queryKey: shareToken
      ? shareQueryKeys.filePreview(shareToken, fileId ?? '')
      : ['files', fileId, 'preview-url'],
    queryFn: () =>
      shareToken
        ? getShareFilePreviewUrl(shareToken, fileId!)
        : getFilePreviewUrl(fileId!),
    enabled: Boolean(fileId) && enabled,
    staleTime: 5 * 60 * 1000,
  })
}
