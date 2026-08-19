import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  inviteShareUsers,
  revokeShare,
  setPublicLink,
} from '@/api/share.api'
import { getApiErrorMessage } from '@/lib/api-error'
import type { ResourceShares, ShareResourceType } from '@/types/share'
import { SHARE_ERRORS } from '../constants/share.errors'
import { shareQueryKeys } from '../share-query-keys'

export function useShareMutations(
  resourceType: ShareResourceType | undefined,
  resourceId: string | undefined,
) {
  const queryClient = useQueryClient()
  const resourceKey =
    resourceType && resourceId
      ? shareQueryKeys.resource(resourceType, resourceId)
      : null

  const invalidate = () => {
    if (resourceKey) {
      void queryClient.invalidateQueries({ queryKey: resourceKey })
    }
    void queryClient.invalidateQueries({ queryKey: shareQueryKeys.inbox })
  }

  const invite = useMutation({
    mutationFn: (emails: string[]) =>
      inviteShareUsers(resourceType!, resourceId!, emails),
    onSuccess: (result) => {
      invalidate()
      if (result.created.length > 0) {
        toast.success(
          result.created.length === 1
            ? 'Person added'
            : `${result.created.length} people added`,
        )
      } else if (result.skipped.length > 0) {
        toast.message('Those people already have access')
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, SHARE_ERRORS.INVITE_FAILED))
    },
  })

  const setLink = useMutation({
    mutationFn: (enabled: boolean) =>
      setPublicLink(resourceType!, resourceId!, enabled),
    onSuccess: (publicLink) => {
      if (resourceKey) {
        queryClient.setQueryData<ResourceShares>(resourceKey, (current) => {
          if (!current) {
            return current
          }
          return { ...current, publicLink }
        })
      }
      toast.success(
        publicLink.enabled
          ? 'Anyone with the link can view'
          : 'Link access turned off',
      )
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, SHARE_ERRORS.LINK_FAILED))
    },
  })

  const revoke = useMutation({
    mutationFn: (shareId: string) => revokeShare(shareId),
    onSuccess: () => {
      invalidate()
      toast.success('Access removed')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, SHARE_ERRORS.REVOKE_FAILED))
    },
  })

  return { invite, setLink, revoke }
}
