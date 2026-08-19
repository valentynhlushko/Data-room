import { apiClient } from '@/lib/api-client'
import type { Folder, FolderContents, FolderDeletionPreview } from '@/types/folder'

export const FILE_LIST_PAGE_SIZE = 50

export async function getFolderContents(
  folderId: string,
  cursor?: string,
) {
  const { data } = await apiClient.get<FolderContents>(
    `/folders/${folderId}/contents`,
    {
      params: {
        limit: FILE_LIST_PAGE_SIZE,
        ...(cursor ? { cursor } : {}),
      },
    },
  )
  return data
}

export async function createFolder(input: { parentId: string; name: string }) {
  const { data } = await apiClient.post<Folder>('/folders', input)
  return data
}

export async function renameFolder(folderId: string, name: string) {
  const { data } = await apiClient.patch<Folder>(`/folders/${folderId}`, {
    name,
  })
  return data
}

export async function getFolderDeletionPreview(folderId: string) {
  const { data } = await apiClient.get<FolderDeletionPreview>(
    `/folders/${folderId}/deletion-preview`,
  )
  return data
}

export async function deleteFolder(folderId: string) {
  await apiClient.delete(`/folders/${folderId}`)
}
