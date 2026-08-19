import { Button } from '@/shared/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { getApiErrorMessage } from '@/lib/api-error'
import type { Folder } from '@/types/folder'
import { FOLDER_ERRORS } from '../constants/folder.errors'
import { formatDeletionWarning } from '../folder.utils'
import { useDeleteFolder } from '../hooks/use-delete-folder'
import { useFolderDeletionPreview } from '../hooks/use-folder-deletion-preview'

type DeleteFolderDialogProps = {
  folder: Folder | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteFolderDialog({
  folder,
  open,
  onOpenChange,
}: DeleteFolderDialogProps) {
  const deleteFolder = useDeleteFolder()
  const preview = useFolderDeletionPreview(folder?.id, open && Boolean(folder))

  const description = preview.data
    ? formatDeletionWarning({
        folderName: preview.data.folder.name,
        nestedFolderCount: preview.data.nestedFolderCount,
        nestedFileCount: preview.data.nestedFileCount,
      })
    : preview.isError
      ? getApiErrorMessage(preview.error, FOLDER_ERRORS.PREVIEW_FAILED)
      : 'Checking what will be deleted…'

  function handleDelete() {
    if (!folder) {
      return
    }

    deleteFolder.mutate(
      { folderId: folder.id, parentId: folder.parentId },
      {
        onSuccess: () => onOpenChange(false),
      },
    )
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteFolder.isPending) {
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete folder?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteFolder.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={
              !folder ||
              preview.isPending ||
              preview.isError ||
              deleteFolder.isPending
            }
          >
            {deleteFolder.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
