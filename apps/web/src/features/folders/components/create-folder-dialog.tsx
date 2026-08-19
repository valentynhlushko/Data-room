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
import { useCreateFolder } from '../hooks/use-create-folder'

type CreateFolderDialogProps = {
  open: boolean
  parentId: string
  onOpenChange: (open: boolean) => void
}

export function CreateFolderDialog({
  open,
  parentId,
  onOpenChange,
}: CreateFolderDialogProps) {
  const createFolder = useCreateFolder()

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (createFolder.isPending) {
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        {open ? (
          <CreateFolderForm
            parentId={parentId}
            createFolder={createFolder}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function CreateFolderForm({
  parentId,
  createFolder,
  onClose,
}: {
  parentId: string
  createFolder: UseMutationResult<
    Folder,
    Error,
    { parentId: string; name: string }
  >
  onClose: () => void
}) {
  const [name, setName] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }

    createFolder.mutate(
      { parentId, name: trimmedName },
      {
        onSuccess: onClose,
      },
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>New folder</DialogTitle>
        <DialogDescription>
          Folders in the same location must have unique names.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2 py-4">
        <Label htmlFor="folder-name">Name</Label>
        <Input
          id="folder-name"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Untitled folder"
          disabled={createFolder.isPending}
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={createFolder.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim() || createFolder.isPending}>
          {createFolder.isPending ? 'Creating…' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  )
}
