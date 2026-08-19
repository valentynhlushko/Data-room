import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createFolder } from '@/api/folder.api'
import { getApiErrorMessage } from '@/lib/api-error'
import { FOLDER_ERRORS } from '../constants/folder.errors'
import { folderQueryKeys } from '../folder-query-keys'

export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFolder,
    onSuccess: async (_folder, { parentId }) => {
      await queryClient.invalidateQueries({
        queryKey: folderQueryKeys.contents(parentId),
      })
      toast.success('Folder created')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, FOLDER_ERRORS.CREATE_FAILED))
    },
  })
}
