import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { renameFolder } from '@/api/folder.api'
import { getApiErrorMessage } from '@/lib/api-error'
import { FOLDER_ERRORS } from '../constants/folder.errors'
import { folderQueryKeys } from '../folder-query-keys'

export function useRenameFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ folderId, name }: { folderId: string; name: string }) =>
      renameFolder(folderId, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: folderQueryKeys.all })
      toast.success('Folder renamed')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, FOLDER_ERRORS.RENAME_FAILED))
    },
  })
}
