import { apiClient } from '@/lib/api-client'
import type { FilePreviewUrl } from '@/types/file'
import type { FolderContents } from '@/types/folder'
import { FILE_LIST_PAGE_SIZE } from './folder.api'
import type {
  ResourceShares,
  ShareInboxItem,
  ShareLinkResolve,
  SharePublicLink,
  ShareResourceType,
} from '@/types/share'

export async function listResourceShares(
  resourceType: ShareResourceType,
  resourceId: string,
) {
  const { data } = await apiClient.get<ResourceShares>('/shares', {
    params: { resourceType, resourceId },
  })
  return data
}

export async function inviteShareUsers(
  resourceType: ShareResourceType,
  resourceId: string,
  emails: string[],
) {
  const { data } = await apiClient.post<{
    created: ResourceShares['users']
    skipped: string[]
  }>('/shares/users', { resourceType, resourceId, emails })
  return data
}

export async function setPublicLink(
  resourceType: ShareResourceType,
  resourceId: string,
  enabled: boolean,
) {
  const { data } = await apiClient.put<SharePublicLink>('/shares/public-link', {
    resourceType,
    resourceId,
    enabled,
  })
  return data
}

export async function revokeShare(shareId: string) {
  await apiClient.delete(`/shares/${shareId}`)
}

export async function getShareInbox() {
  const { data } = await apiClient.get<ShareInboxItem[]>('/shares/inbox')
  return data
}

export async function resolveShareLink(token: string) {
  const { data } = await apiClient.get<ShareLinkResolve>(
    `/share-links/${token}`,
  )
  return data
}

export async function getShareFolderContents(
  token: string,
  folderId: string,
  cursor?: string,
) {
  const { data } = await apiClient.get<FolderContents>(
    `/share-links/${token}/folders/${folderId}/contents`,
    {
      params: {
        limit: FILE_LIST_PAGE_SIZE,
        ...(cursor ? { cursor } : {}),
      },
    },
  )
  return data
}

export async function getShareFilePreviewUrl(token: string, fileId: string) {
  const { data } = await apiClient.get<FilePreviewUrl>(
    `/share-links/${token}/files/${fileId}/preview-url`,
  )
  return data
}
