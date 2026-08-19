import { apiClient } from '@/lib/api-client'
import type { FileItem, FilePreviewUrl } from '@/types/file'

export async function uploadFile(
  folderId: string,
  file: File,
  onProgress?: (percent: number) => void,
) {
  const formData = new FormData()
  formData.append('folderId', folderId)
  formData.append('file', file)

  const { data } = await apiClient.post<FileItem>('/files', formData, {
    onUploadProgress: (event) => {
      if (!event.total) {
        return
      }

      onProgress?.(Math.round((event.loaded / event.total) * 100))
    },
  })

  return data
}

export async function getFilePreviewUrl(fileId: string) {
  const { data } = await apiClient.get<FilePreviewUrl>(
    `/files/${fileId}/preview-url`,
  )
  return data
}

export async function renameFile(fileId: string, name: string) {
  const { data } = await apiClient.patch<FileItem>(`/files/${fileId}`, { name })
  return data
}

export async function moveFile(fileId: string, folderId: string) {
  const { data } = await apiClient.patch<FileItem>(`/files/${fileId}`, {
    folderId,
  })
  return data
}

export async function deleteFile(fileId: string) {
  await apiClient.delete(`/files/${fileId}`)
}
