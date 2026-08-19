import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteFolder } from '@/api/folder.api'
import { getApiErrorMessage } from '@/lib/api-error'
import { FOLDER_ERRORS } from '../constants/folder.errors'
import { folderQueryKeys } from '../folder-query-keys'

export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ folderId }: { folderId: string; parentId: string | null }) =>
      deleteFolder(folderId),
    onSuccess: async (_void, { folderId, parentId }) => {
      queryClient.removeQueries({
        queryKey: folderQueryKeys.contents(folderId),
      })
      queryClient.removeQueries({
        queryKey: folderQueryKeys.deletionPreview(folderId),
      })

      if (parentId) {
        await queryClient.invalidateQueries({
          queryKey: folderQueryKeys.contents(parentId),
        })
      }

      toast.success('Folder deleted')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, FOLDER_ERRORS.DELETE_FAILED))
    },
  })
}
