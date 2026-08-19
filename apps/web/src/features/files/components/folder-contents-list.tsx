import { type DragEvent, useEffect, useRef, useState } from 'react'
import { FileIcon, FolderIcon, Loader2Icon, MoreHorizontalIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { cn } from '@/lib/utils'
import type { FileItem } from '@/types/file'
import type { Folder } from '@/types/folder'
import { formatFolderModifiedAt } from '@/features/folders/folder.utils'
import {
  formatFileSize,
  getFileMoveId,
  isFileMoveDrag,
  setFileMoveDrag,
} from '../file.utils'

type FolderContentsListProps = {
  folders: Folder[]
  files: FileItem[]
  highlightFileId?: string
  variant?: 'owner' | 'viewer'
  onOpenFolder?: (folder: Folder) => void
  onRenameFolder?: (folder: Folder) => void
  onDeleteFolder?: (folder: Folder) => void
  onShareFolder?: (folder: Folder) => void
  onPreviewFile: (file: FileItem) => void
  onRenameFile?: (file: FileItem) => void
  onMoveFile?: (file: FileItem) => void
  onMoveFileToFolder?: (fileId: string, folderId: string) => void
  onDeleteFile?: (file: FileItem) => void
  onShareFile?: (file: FileItem) => void
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

export function FolderContentsList({
  folders,
  files,
  highlightFileId,
  variant = 'owner',
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  onShareFolder,
  onPreviewFile,
  onRenameFile,
  onMoveFile,
  onMoveFileToFolder,
  onDeleteFile,
  onShareFile,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: FolderContentsListProps) {
  const navigate = useNavigate()
  const isViewer = variant === 'viewer'
  const canDragFiles = Boolean(onMoveFileToFolder)
  const [dropFolderId, setDropFolderId] = useState<string | null>(null)
  const [draggingFileId, setDraggingFileId] = useState<string | null>(null)
  const skipClickRef = useRef(false)
  const highlightedRowRef = useRef<HTMLTableRowElement>(null)
  const loadMoreRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    if (!highlightFileId) {
      return
    }

    highlightedRowRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    })
  }, [highlightFileId, files])

  useEffect(() => {
    if (!hasMore || !onLoadMore) {
      return
    }

    const node = loadMoreRef.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          onLoadMore()
        }
      },
      { rootMargin: '240px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, onLoadMore])

  function handleFolderDragOver(
    event: DragEvent<HTMLTableRowElement>,
    folderId: string,
  ) {
    if (!canDragFiles || !isFileMoveDrag(event.dataTransfer)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'
    setDropFolderId(folderId)
  }

  function handleFolderDrop(
    event: DragEvent<HTMLTableRowElement>,
    folderId: string,
  ) {
    if (!onMoveFileToFolder || !isFileMoveDrag(event.dataTransfer)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    skipClickRef.current = true
    setDropFolderId(null)

    const fileId = getFileMoveId(event.dataTransfer)
    if (fileId) {
      onMoveFileToFolder(fileId, folderId)
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Name</TableHead>
          <TableHead className="w-28">Size</TableHead>
          <TableHead className="w-40">Modified</TableHead>
          {isViewer ? null : (
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {folders.map((folder) => (
          <TableRow
            key={`folder-${folder.id}`}
            className={cn(
              'cursor-pointer',
              dropFolderId === folder.id &&
                'bg-primary/10 ring-2 ring-inset ring-primary/40 hover:bg-primary/10',
            )}
            onClick={() => {
              if (skipClickRef.current) {
                skipClickRef.current = false
                return
              }
              if (onOpenFolder) {
                onOpenFolder(folder)
                return
              }
              navigate(`/folders/${folder.id}`)
            }}
            onDragOver={(event) => handleFolderDragOver(event, folder.id)}
            onDragLeave={() => {
              setDropFolderId((current) =>
                current === folder.id ? null : current,
              )
            }}
            onDrop={(event) => handleFolderDrop(event, folder.id)}
          >
            <TableCell>
              <div className="flex min-w-0 items-center gap-2.5">
                <FolderIcon className="size-5 shrink-0 fill-amber-400/90 text-amber-500" />
                <span className="truncate font-medium">{folder.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">—</TableCell>
            <TableCell className="text-muted-foreground">
              {formatFolderModifiedAt(folder.updatedAt)}
            </TableCell>
            {isViewer ? null : (
              <TableCell
                className="text-right"
                onClick={(event) => event.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${folder.name}`}
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onShareFolder ? (
                      <DropdownMenuItem onSelect={() => onShareFolder(folder)}>
                        Share
                      </DropdownMenuItem>
                    ) : null}
                    {onRenameFolder ? (
                      <DropdownMenuItem onSelect={() => onRenameFolder(folder)}>
                        Rename
                      </DropdownMenuItem>
                    ) : null}
                    {onDeleteFolder ? (
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => onDeleteFolder(folder)}
                      >
                        Delete
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
        {files.map((file) => (
          <TableRow
            key={`file-${file.id}`}
            ref={highlightFileId === file.id ? highlightedRowRef : undefined}
            className={cn(
              'cursor-pointer',
              canDragFiles && 'active:cursor-grabbing',
              draggingFileId === file.id && 'cursor-grabbing opacity-50',
              highlightFileId === file.id && 'bg-muted',
            )}
            draggable={canDragFiles}
            onDragStart={(event) => {
              if (!canDragFiles) {
                return
              }
              skipClickRef.current = true
              setDraggingFileId(file.id)
              setFileMoveDrag(event.dataTransfer, file.id)
            }}
            onDragEnd={() => {
              setDropFolderId(null)
              setDraggingFileId(null)
              window.setTimeout(() => {
                skipClickRef.current = false
              }, 0)
            }}
            onClick={() => {
              if (skipClickRef.current) {
                skipClickRef.current = false
                return
              }
              onPreviewFile(file)
            }}
          >
            <TableCell>
              <div className="flex min-w-0 items-center gap-2.5">
                <FileIcon className="size-5 shrink-0 text-red-500" />
                <span className="truncate font-medium">{file.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatFileSize(file.sizeBytes)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatFolderModifiedAt(file.updatedAt)}
            </TableCell>
            {isViewer ? null : (
              <TableCell
                className="text-right"
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${file.name}`}
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onPreviewFile(file)}>
                      Open
                    </DropdownMenuItem>
                    {onShareFile ? (
                      <DropdownMenuItem onSelect={() => onShareFile(file)}>
                        Share
                      </DropdownMenuItem>
                    ) : null}
                    {onRenameFile ? (
                      <DropdownMenuItem onSelect={() => onRenameFile(file)}>
                        Rename
                      </DropdownMenuItem>
                    ) : null}
                    {onMoveFile ? (
                      <DropdownMenuItem onSelect={() => onMoveFile(file)}>
                        Move
                      </DropdownMenuItem>
                    ) : null}
                    {onDeleteFile ? (
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => onDeleteFile(file)}
                      >
                        Delete
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
        {hasMore || isLoadingMore ? (
          <TableRow ref={loadMoreRef} className="hover:bg-transparent">
            <TableCell
              colSpan={isViewer ? 3 : 4}
              className="py-4 text-center text-muted-foreground"
            >
              {isLoadingMore ? (
                <span className="inline-flex items-center gap-2 text-sm">
                  <Loader2Icon className="size-4 animate-spin" />
                  Loading more files
                </span>
              ) : (
                <span className="text-sm">Scroll to load more</span>
              )}
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  )
}
