import { useQuery } from '@tanstack/react-query'
import { listResourceShares } from '@/api/share.api'
import { SHARE_RESOURCE_TYPE, type ShareResourceType } from '@/types/share'
import { shareQueryKeys } from '../share-query-keys'

export function useResourceShares(
  resourceType: ShareResourceType | undefined,
  resourceId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: shareQueryKeys.resource(
      resourceType ?? SHARE_RESOURCE_TYPE.FOLDER,
      resourceId ?? '',
    ),
    queryFn: () => listResourceShares(resourceType!, resourceId!),
    enabled: enabled && Boolean(resourceType) && Boolean(resourceId),
  })
}
