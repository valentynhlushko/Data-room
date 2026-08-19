import { useState } from 'react'
import { FileIcon, FolderIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { getApiErrorMessage } from '@/lib/api-error'
import type { FilePreviewTarget } from '@/types/file'
import { SHARE_RESOURCE_TYPE, type ShareInboxItem } from '@/types/share'
import { FilePreviewDialog } from '@/features/files/components/file-preview-dialog'
import { formatFolderModifiedAt } from '@/features/folders/folder.utils'
import { SHARE_ERRORS } from '../constants/share.errors'
import { useShareInbox } from '../hooks/use-share-inbox'

export function SharedWithMePage() {
  const inbox = useShareInbox()
  const [fileToPreview, setFileToPreview] = useState<FilePreviewTarget | null>(
    null,
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b px-6 py-3">
        <h1 className="text-sm font-medium">Shared with me</h1>
        <p className="text-xs text-muted-foreground">
          Folders and files others have shared with your account. View only.
        </p>
      </div>
      <div className="flex-1 p-6">
        {inbox.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : inbox.isError ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">
              {getApiErrorMessage(inbox.error, SHARE_ERRORS.INBOX_FAILED)}
            </p>
            <Button type="button" variant="outline" onClick={() => inbox.refetch()}>
              Try again
            </Button>
          </div>
        ) : inbox.data?.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 pt-16 text-center">
            <p className="text-sm font-medium">Nothing shared with you yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              When someone shares a data room, folder, or file with your Google
              account, it will show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y rounded-xl border">
            {inbox.data?.map((item) => (
              <InboxRow
                key={item.id}
                item={item}
                onPreviewFile={setFileToPreview}
              />
            ))}
          </ul>
        )}
      </div>
      <FilePreviewDialog
        file={fileToPreview}
        open={Boolean(fileToPreview)}
        onOpenChange={(open) => {
          if (!open) {
            setFileToPreview(null)
          }
        }}
      />
    </div>
  )
}

function InboxRow({
  item,
  onPreviewFile,
}: {
  item: ShareInboxItem
  onPreviewFile: (file: FilePreviewTarget) => void
}) {
  const href = inboxHref(item)
  const Icon = item.resourceType === SHARE_RESOURCE_TYPE.FILE ? FileIcon : FolderIcon

  const content = (
    <>
      <Icon
        className={
          item.resourceType === SHARE_RESOURCE_TYPE.FILE
            ? 'size-5 shrink-0 text-red-500'
            : 'size-5 shrink-0 fill-amber-400/90 text-amber-500'
        }
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {resourceLabel(item.resourceType)} · Viewer ·{' '}
          {formatFolderModifiedAt(item.createdAt)}
        </p>
      </div>
    </>
  )

  if (item.resourceType === SHARE_RESOURCE_TYPE.FILE && item.fileId) {
    const fileId = item.fileId
    return (
      <li>
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/50"
          onClick={() =>
            onPreviewFile({
              id: fileId,
              name: item.name,
            })
          }
        >
          {content}
        </button>
      </li>
    )
  }

  if (!href) {
    return (
      <li className="flex items-center gap-3 px-4 py-3 text-muted-foreground">
        {content}
      </li>
    )
  }

  return (
    <li>
      <Link
        to={href}
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
      >
        {content}
      </Link>
    </li>
  )
}

function inboxHref(item: ShareInboxItem) {
  if (!item.openFolderId) {
    return null
  }
  return `/folders/${item.openFolderId}`
}

function resourceLabel(type: ShareInboxItem['resourceType']) {
  if (type === SHARE_RESOURCE_TYPE.DATA_ROOM) {
    return 'Data room'
  }
  if (type === SHARE_RESOURCE_TYPE.FILE) {
    return 'File'
  }
  return 'Folder'
}
