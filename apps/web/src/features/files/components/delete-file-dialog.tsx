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
import type { FileItem } from '@/types/file'
import { useDeleteFile } from '../hooks/use-file-mutations'

type DeleteFileDialogProps = {
  file: FileItem | null
  folderId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteFileDialog({
  file,
  folderId,
  open,
  onOpenChange,
}: DeleteFileDialogProps) {
  const deleteFile = useDeleteFile(folderId)

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteFile.isPending) {
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete file?</AlertDialogTitle>
          <AlertDialogDescription>
            {file
              ? `This will permanently delete “${file.name}”. This cannot be undone.`
              : 'This cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteFile.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!file || deleteFile.isPending}
            onClick={() => {
              if (!file) {
                return
              }
              deleteFile.mutate(file.id, {
                onSuccess: () => onOpenChange(false),
              })
            }}
          >
            {deleteFile.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
