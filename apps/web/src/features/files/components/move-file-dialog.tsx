import { useState } from 'react'
import { FolderIcon, Loader2Icon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { FolderBreadcrumbs } from '@/features/folders/components/folder-breadcrumbs'
import { useCurrentDataRoom } from '@/features/folders/hooks/use-current-data-room'
import { useFolderContents } from '@/features/folders/hooks/use-folder-contents'
import type { FileItem } from '@/types/file'
import { useMoveFile } from '../hooks/use-file-mutations'

type MoveFileDialogProps = {
  file: FileItem | null
  sourceFolderId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MoveFileDialog({
  file,
  sourceFolderId,
  open,
  onOpenChange,
}: MoveFileDialogProps) {
  const dataRoomQuery = useCurrentDataRoom()
  const rootFolderId = dataRoomQuery.data?.rootFolder.id
  const [destinationId, setDestinationId] = useState<string | null>(null)
  const folderId = destinationId ?? rootFolderId
  const contentsQuery = useFolderContents(open ? folderId : undefined)
  const moveFile = useMoveFile(sourceFolderId)
  const dataRoomName = dataRoomQuery.data?.dataRoom.name ?? 'Files'
  const contents = contentsQuery.data?.pages[0]

  const isSameFolder = Boolean(file && folderId === file.folderId)

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (moveFile.isPending) {
          return
        }
        if (!nextOpen) {
          setDestinationId(null)
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move file</DialogTitle>
          <DialogDescription>
            Choose a folder for “{file?.name ?? 'this file'}”.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {contentsQuery.isPending || !contents ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <FolderBreadcrumbs
                items={contents.breadcrumbs}
                dataRoomName={dataRoomName}
                onNavigate={setDestinationId}
              />
              <div className="max-h-56 overflow-y-auto rounded-lg border">
                {contents.folders.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    No subfolders here.
                  </p>
                ) : (
                  <ul>
                    {contents.folders.map((folder) => (
                      <li key={folder.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => setDestinationId(folder.id)}
                        >
                          <FolderIcon className="size-4 fill-amber-400/90 text-amber-500" />
                          <span className="truncate">{folder.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={moveFile.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!file || !folderId || isSameFolder || moveFile.isPending}
            onClick={() => {
              if (!file || !folderId) {
                return
              }
              moveFile.mutate(
                { fileId: file.id, folderId },
                {
                  onSuccess: () => {
                    setDestinationId(null)
                    onOpenChange(false)
                  },
                },
              )
            }}
          >
            {moveFile.isPending ? 'Moving…' : 'Move here'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
