import { useState } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
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
import type { Folder } from '@/types/folder'
import { useRenameFolder } from '../hooks/use-rename-folder'

type RenameFolderDialogProps = {
  folder: Folder | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenameFolderDialog({
  folder,
  open,
  onOpenChange,
}: RenameFolderDialogProps) {
  const renameFolder = useRenameFolder()

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (renameFolder.isPending) {
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        {open && folder ? (
          <RenameFolderForm
            folder={folder}
            renameFolder={renameFolder}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function RenameFolderForm({
  folder,
  renameFolder,
  onClose,
}: {
  folder: Folder
  renameFolder: UseMutationResult<
    Folder,
    Error,
    { folderId: string; name: string }
  >
  onClose: () => void
}) {
  const [name, setName] = useState(folder.name)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName || trimmedName === folder.name) {
      onClose()
      return
    }

    renameFolder.mutate(
      { folderId: folder.id, name: trimmedName },
      {
        onSuccess: onClose,
      },
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Rename folder</DialogTitle>
        <DialogDescription>
          Choose a name that is unique in this location.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2 py-4">
        <Label htmlFor="rename-folder-name">Name</Label>
        <Input
          id="rename-folder-name"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={renameFolder.isPending}
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={renameFolder.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim() || renameFolder.isPending}>
          {renameFolder.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  )
}
