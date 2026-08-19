import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { getApiErrorMessage } from '@/lib/api-error'
import type { FileItem } from '@/types/file'
import { SHARE_RESOURCE_TYPE } from '@/types/share'
import { FilePreviewDialog } from '@/features/files/components/file-preview-dialog'
import { FolderContentsList } from '@/features/files/components/folder-contents-list'
import { useFilePreviewUrl } from '@/features/files/hooks/use-file-preview-url'
import { FolderBreadcrumbs } from '@/features/folders/components/folder-breadcrumbs'
import { SHARE_ERRORS } from '../constants/share.errors'
import { useShareFolderContents } from '../hooks/use-share-folder-contents'
import { useShareLink } from '../hooks/use-share-link'

export function ShareLinkPage() {
  const { token, folderId } = useParams<{ token: string; folderId?: string }>()

  if (!token) {
    return <Navigate to="/" replace />
  }

  return <ShareLinkView token={token} folderId={folderId} />
}

function ShareLinkView({
  token,
  folderId,
}: {
  token: string
  folderId?: string
}) {
  const resolved = useShareLink(token)

  if (resolved.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (resolved.isError || !resolved.data) {
    return (
      <UnavailableState
        message={getApiErrorMessage(
          resolved.error,
          SHARE_ERRORS.LINK_UNAVAILABLE,
        )}
      />
    )
  }

  const { data } = resolved

  if (data.share.resourceType === SHARE_RESOURCE_TYPE.FILE && data.file) {
    return (
      <ShareShell title={data.file.name} roomName={data.dataRoom.name}>
        <PublicFileViewer token={token} file={data.file} />
      </ShareShell>
    )
  }

  const openFolderId = folderId ?? data.rootFolderId
  if (!openFolderId) {
    return <UnavailableState message={SHARE_ERRORS.LINK_UNAVAILABLE} />
  }

  if (!folderId) {
    return <Navigate to={`/share/${token}/folders/${openFolderId}`} replace />
  }

  return (
    <ShareFolderBrowser
      token={token}
      folderId={openFolderId}
      dataRoomName={data.dataRoom.name}
    />
  )
}

function ShareFolderBrowser({
  token,
  folderId,
  dataRoomName,
}: {
  token: string
  folderId: string
  dataRoomName: string
}) {
  const navigate = useNavigate()
  const contentsQuery = useShareFolderContents(token, folderId)
  const [fileToPreview, setFileToPreview] = useState<FileItem | null>(null)
  const contents = contentsQuery.data?.pages[0]
  const files = useMemo(
    () => contentsQuery.data?.pages.flatMap((page) => page.files) ?? [],
    [contentsQuery.data],
  )
  const folders = contents?.folders ?? []
  const isEmpty =
    contents !== undefined && folders.length === 0 && files.length === 0
  const loadMoreFiles = useCallback(() => {
    if (!contentsQuery.isFetchingNextPage) {
      void contentsQuery.fetchNextPage()
    }
  }, [contentsQuery.fetchNextPage, contentsQuery.isFetchingNextPage])

  return (
    <ShareShell
      title={dataRoomName}
      roomName={dataRoomName}
      breadcrumbs={
        contents ? (
          <FolderBreadcrumbs
            items={contents.breadcrumbs}
            dataRoomName={dataRoomName}
            onNavigate={(id) => navigate(`/share/${token}/folders/${id}`)}
          />
        ) : contentsQuery.isPending ? (
          <Skeleton className="h-5 w-48" />
        ) : (
          <p className="text-sm text-muted-foreground">Shared folder</p>
        )
      }
    >
      {contentsQuery.isPending ? (
        <div className="space-y-2 p-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : contentsQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {getApiErrorMessage(contentsQuery.error, SHARE_ERRORS.LINK_UNAVAILABLE)}
          </p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm font-medium">This folder is empty</p>
          <p className="text-sm text-muted-foreground">
            Nothing has been added here yet.
          </p>
        </div>
      ) : contents ? (
        <div className="flex-1 p-6">
          <FolderContentsList
            variant="viewer"
            folders={folders}
            files={files}
            hasMore={contentsQuery.hasNextPage}
            isLoadingMore={contentsQuery.isFetchingNextPage}
            onLoadMore={loadMoreFiles}
            onOpenFolder={(folder) =>
              navigate(`/share/${token}/folders/${folder.id}`)
            }
            onPreviewFile={setFileToPreview}
          />
        </div>
      ) : null}

      <FilePreviewDialog
        file={fileToPreview}
        open={Boolean(fileToPreview)}
        onOpenChange={(open) => {
          if (!open) {
            setFileToPreview(null)
          }
        }}
        shareToken={token}
      />
    </ShareShell>
  )
}

function PublicFileViewer({ token, file }: { token: string; file: FileItem }) {
  const preview = useFilePreviewUrl(file.id, true, token)

  if (preview.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (preview.isError || !preview.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {getApiErrorMessage(preview.error, SHARE_ERRORS.LINK_UNAVAILABLE)}
      </div>
    )
  }

  return (
    <iframe
      title={file.name}
      src={preview.data.url}
      className="min-h-0 flex-1 border-0"
    />
  )
}

function ShareShell({
  title,
  roomName,
  breadcrumbs,
  children,
}: {
  title: string
  roomName: string
  breadcrumbs?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b px-6 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{title}</p>
            <Badge variant="secondary">View only</Badge>
          </div>
          {breadcrumbs ? (
            <div className="mt-1">{breadcrumbs}</div>
          ) : (
            <p className="text-xs text-muted-foreground">{roomName}</p>
          )}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

function UnavailableState({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-lg font-medium">This link is no longer available</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
