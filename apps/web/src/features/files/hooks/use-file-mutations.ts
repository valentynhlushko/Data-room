import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteFile, moveFile, renameFile } from '@/api/file.api'
import { getApiErrorMessage } from '@/lib/api-error'
import { folderQueryKeys } from '@/features/folders/folder-query-keys'
import { FILE_ERRORS } from '../constants/file.errors'

export function useRenameFile(folderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId, name }: { fileId: string; name: string }) =>
      renameFile(fileId, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: folderQueryKeys.contents(folderId),
      })
      toast.success('File renamed')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, FILE_ERRORS.RENAME_FAILED))
    },
  })
}

export function useMoveFile(sourceFolderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId, folderId }: { fileId: string; folderId: string }) =>
      moveFile(fileId, folderId),
    onSuccess: async (_file, { folderId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: folderQueryKeys.contents(sourceFolderId),
        }),
        queryClient.invalidateQueries({
          queryKey: folderQueryKeys.contents(folderId),
        }),
      ])
      toast.success('File moved')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, FILE_ERRORS.MOVE_FAILED))
    },
  })
}

export function useDeleteFile(folderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fileId: string) => deleteFile(fileId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: folderQueryKeys.contents(folderId),
      })
      toast.success('File deleted')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, FILE_ERRORS.DELETE_FAILED))
    },
  })
}
