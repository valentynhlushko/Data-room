import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { FolderPlusIcon, Share2Icon, UploadIcon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { getApiErrorMessage } from '@/lib/api-error'
import type { FileItem, FilePreviewTarget } from '@/types/file'
import type { Folder } from '@/types/folder'
import { SHARE_RESOURCE_TYPE, type ShareTarget } from '@/types/share'
import { FilePreviewDialog } from '@/features/files/components/file-preview-dialog'
import { FileUploadDropzone } from '@/features/files/components/file-upload-dropzone'
import { FileUploadPanel } from '@/features/files/components/file-upload-panel'
import { FolderContentsList } from '@/features/files/components/folder-contents-list'
import { DeleteFileDialog } from '@/features/files/components/delete-file-dialog'
import { MoveFileDialog } from '@/features/files/components/move-file-dialog'
import { RenameFileDialog } from '@/features/files/components/rename-file-dialog'
import { useFileUploads } from '@/features/files/hooks/use-file-uploads'
import { useMoveFile } from '@/features/files/hooks/use-file-mutations'
import { FOLDER_ERRORS } from '../constants/folder.errors'
import { useCurrentDataRoom } from '../hooks/use-current-data-room'
import { useFolderContents } from '../hooks/use-folder-contents'
import { CreateFolderDialog } from '../components/create-folder-dialog'
import { DeleteFolderDialog } from '../components/delete-folder-dialog'
import { FolderBreadcrumbs } from '../components/folder-breadcrumbs'
import { RenameFolderDialog } from '../components/rename-folder-dialog'
import { ShareDialog } from '@/features/shares/components/share-dialog'

export function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>()

  if (!folderId) {
    return <Navigate to="/" replace />
  }

  return <FolderBrowser folderId={folderId} />
}

function FolderBrowser({ folderId }: { folderId: string }) {
  const location = useLocation()
  const dataRoomQuery = useCurrentDataRoom()
  const contentsQuery = useFolderContents(folderId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploads = useFileUploads(folderId)
  const moveFile = useMoveFile(folderId)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null)
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null)
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null)
  const [fileToPreview, setFileToPreview] = useState<FilePreviewTarget | null>(
    null,
  )
  const [fileToRename, setFileToRename] = useState<FileItem | null>(null)
  const [fileToMove, setFileToMove] = useState<FileItem | null>(null)
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null)

  const contents = contentsQuery.data?.pages[0]
  const files = useMemo(
    () => contentsQuery.data?.pages.flatMap((page) => page.files) ?? [],
    [contentsQuery.data],
  )
  const folders = contents?.folders ?? []
  const dataRoomName =
    contents?.dataRoom?.name ?? dataRoomQuery.data?.dataRoom.name ?? 'Files'
  const isOwner = Boolean(
    contents?.dataRoom &&
      dataRoomQuery.data &&
      contents.dataRoom.id === dataRoomQuery.data.dataRoom.id,
  )
  const isEmpty =
    contents !== undefined && folders.length === 0 && files.length === 0
  const highlightFileId = (
    location.state as { highlightFileId?: string } | null
  )?.highlightFileId
  const loadMoreFiles = useCallback(() => {
    if (!contentsQuery.isFetchingNextPage) {
      void contentsQuery.fetchNextPage()
    }
  }, [contentsQuery.fetchNextPage, contentsQuery.isFetchingNextPage])

  useEffect(() => {
    if (!highlightFileId) {
      return
    }

    if (files.some((file) => file.id === highlightFileId)) {
      return
    }

    if (contentsQuery.hasNextPage && !contentsQuery.isFetchingNextPage) {
      void contentsQuery.fetchNextPage()
    }
  }, [
    highlightFileId,
    files,
    contentsQuery.hasNextPage,
    contentsQuery.isFetchingNextPage,
    contentsQuery.fetchNextPage,
  ])

  return (
    <FileUploadDropzone
      disabled={!contents || !isOwner}
      onFiles={(files) => void uploads.startUploads(files)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        {contentsQuery.isPending ? (
          <Skeleton className="h-5 w-48" />
        ) : contents ? (
          <FolderBreadcrumbs
            items={contents.breadcrumbs}
            dataRoomName={dataRoomName}
            onDropFile={
              isOwner
                ? (targetFolderId, fileId) =>
                    moveFile.mutate({ fileId, folderId: targetFolderId })
                : undefined
            }
          />
        ) : (
          <p className="text-sm text-muted-foreground">Folder</p>
        )}
        <div className="flex items-center gap-2">
          {isOwner ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="sr-only"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? [])
                  event.target.value = ''
                  if (files.length > 0) {
                    void uploads.startUploads(files)
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!contents) {
                    return
                  }
                  setShareTarget(
                    contents.folder.isRoot
                      ? {
                          resourceType: SHARE_RESOURCE_TYPE.DATA_ROOM,
                          resourceId: contents.folder.dataRoomId,
                          name: dataRoomName,
                        }
                      : {
                          resourceType: SHARE_RESOURCE_TYPE.FOLDER,
                          resourceId: contents.folder.id,
                          name: contents.folder.name,
                        },
                  )
                }}
                disabled={!contents}
              >
                <Share2Icon />
                Share
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={!contents}
              >
                <UploadIcon />
                Upload PDF
              </Button>
              <Button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                disabled={!contents}
              >
                <FolderPlusIcon />
                New folder
              </Button>
            </>
          ) : (
            <Badge variant="secondary">View only</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        {contentsQuery.isPending ? (
          <FolderListSkeleton />
        ) : contentsQuery.isError ? (
          <FolderErrorState
            message={getApiErrorMessage(
              contentsQuery.error,
              FOLDER_ERRORS.LOAD_FAILED,
            )}
            onRetry={() => contentsQuery.refetch()}
          />
        ) : isEmpty ? (
          isOwner ? (
            <EmptyFolderState
              onCreate={() => setIsCreateOpen(true)}
              onUpload={() => fileInputRef.current?.click()}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm font-medium">This folder is empty</p>
              <p className="text-sm text-muted-foreground">
                Nothing has been added here yet.
              </p>
            </div>
          )
        ) : contents ? (
          <FolderContentsList
            variant={isOwner ? 'owner' : 'viewer'}
            folders={folders}
            files={files}
            highlightFileId={highlightFileId}
            hasMore={contentsQuery.hasNextPage}
            isLoadingMore={contentsQuery.isFetchingNextPage}
            onLoadMore={loadMoreFiles}
            onShareFolder={
              isOwner
                ? (folder) =>
                    setShareTarget({
                      resourceType: SHARE_RESOURCE_TYPE.FOLDER,
                      resourceId: folder.id,
                      name: folder.name,
                    })
                : undefined
            }
            onRenameFolder={isOwner ? setFolderToRename : undefined}
            onDeleteFolder={isOwner ? setFolderToDelete : undefined}
            onPreviewFile={setFileToPreview}
            onShareFile={
              isOwner
                ? (file) =>
                    setShareTarget({
                      resourceType: SHARE_RESOURCE_TYPE.FILE,
                      resourceId: file.id,
                      name: file.name,
                    })
                : undefined
            }
            onRenameFile={isOwner ? setFileToRename : undefined}
            onMoveFile={isOwner ? setFileToMove : undefined}
            onMoveFileToFolder={
              isOwner
                ? (fileId, targetFolderId) =>
                    moveFile.mutate({ fileId, folderId: targetFolderId })
                : undefined
            }
            onDeleteFile={isOwner ? setFileToDelete : undefined}
          />
        ) : null}
      </div>

      <FileUploadPanel
        uploads={uploads.uploads}
        onDismiss={uploads.dismissUpload}
        onClearFinished={uploads.clearFinished}
      />

      <CreateFolderDialog
        open={isCreateOpen}
        parentId={folderId}
        onOpenChange={setIsCreateOpen}
      />
      <RenameFolderDialog
        folder={folderToRename}
        open={Boolean(folderToRename)}
        onOpenChange={(open) => {
          if (!open) {
            setFolderToRename(null)
          }
        }}
      />
      <DeleteFolderDialog
        folder={folderToDelete}
        open={Boolean(folderToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setFolderToDelete(null)
          }
        }}
      />
      <FilePreviewDialog
        file={fileToPreview}
        open={Boolean(fileToPreview)}
        onOpenChange={(open) => {
          if (!open) {
            setFileToPreview(null)
          }
        }}
        onShare={
          isOwner
            ? (file) =>
                setShareTarget({
                  resourceType: SHARE_RESOURCE_TYPE.FILE,
                  resourceId: file.id,
                  name: file.name,
                })
            : undefined
        }
      />
      <ShareDialog
        target={shareTarget}
        open={Boolean(shareTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setShareTarget(null)
          }
        }}
      />
      <RenameFileDialog
        file={fileToRename}
        folderId={folderId}
        open={Boolean(fileToRename)}
        onOpenChange={(open) => {
          if (!open) {
            setFileToRename(null)
          }
        }}
      />
      <MoveFileDialog
        file={fileToMove}
        sourceFolderId={folderId}
        open={Boolean(fileToMove)}
        onOpenChange={(open) => {
          if (!open) {
            setFileToMove(null)
          }
        }}
      />
      <DeleteFileDialog
        file={fileToDelete}
        folderId={folderId}
        open={Boolean(fileToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setFileToDelete(null)
          }
        }}
      />
    </FileUploadDropzone>
  )
}

function FolderListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  )
}

function FolderErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button type="button" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function EmptyFolderState({
  onCreate,
  onUpload,
}: {
  onCreate: () => void
  onUpload: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-medium">This folder is empty</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Upload PDFs or create a folder to organize documents for due diligence.
        You can also drag files here.
      </p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={onUpload}>
          <UploadIcon />
          Upload PDF
        </Button>
        <Button type="button" onClick={onCreate}>
          <FolderPlusIcon />
          New folder
        </Button>
      </div>
    </div>
  )
}
