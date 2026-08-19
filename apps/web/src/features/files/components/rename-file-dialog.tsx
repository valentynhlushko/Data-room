import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type { FileItem } from '@/types/file'
import { useRenameFile } from '../hooks/use-file-mutations'

type RenameFileDialogProps = {
  file: FileItem | null
  folderId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenameFileDialog({
  file,
  folderId,
  open,
  onOpenChange,
}: RenameFileDialogProps) {
  const renameFile = useRenameFile(folderId)

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (renameFile.isPending) {
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        {open && file ? (
          <RenameFileForm
            file={file}
            isPending={renameFile.isPending}
            onRename={(name, onSuccess) =>
              renameFile.mutate({ fileId: file.id, name }, { onSuccess })
            }
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function RenameFileForm({
  file,
  isPending,
  onRename,
  onClose,
}: {
  file: FileItem
  isPending: boolean
  onRename: (name: string, onSuccess: () => void) => void
  onClose: () => void
}) {
  const [name, setName] = useState(file.name)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName || trimmedName === file.name) {
      onClose()
      return
    }

    onRename(trimmedName, onClose)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Rename file</DialogTitle>
        <DialogDescription>
          Choose a name that is unique in this folder.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2 py-4">
        <Label htmlFor="rename-file-name">Name</Label>
        <Input
          id="rename-file-name"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isPending}
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim() || isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  )
}
