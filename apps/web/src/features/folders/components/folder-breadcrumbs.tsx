import { Fragment, type DragEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb'
import { cn } from '@/lib/utils'
import type { FolderBreadcrumb } from '@/types/folder'
import { getFileMoveId, isFileMoveDrag } from '@/features/files/file.utils'
import { getFolderLabel } from '../folder.utils'

type FolderBreadcrumbsProps = {
  items: FolderBreadcrumb[]
  dataRoomName: string
  onNavigate?: (folderId: string) => void
  onDropFile?: (folderId: string, fileId: string) => void
}

export function FolderBreadcrumbs({
  items,
  dataRoomName,
  onNavigate,
  onDropFile,
}: FolderBreadcrumbsProps) {
  const [dropFolderId, setDropFolderId] = useState<string | null>(null)

  function handleDragOver(
    event: DragEvent<HTMLElement>,
    folderId: string,
    isLast: boolean,
  ) {
    if (!onDropFile || isLast || !isFileMoveDrag(event.dataTransfer)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'
    setDropFolderId(folderId)
  }

  function handleDrop(
    event: DragEvent<HTMLElement>,
    folderId: string,
    isLast: boolean,
  ) {
    if (!onDropFile || isLast || !isFileMoveDrag(event.dataTransfer)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setDropFolderId(null)

    const fileId = getFileMoveId(event.dataTransfer)
    if (fileId) {
      onDropFile(folderId, fileId)
    }
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const label = getFolderLabel(item, dataRoomName)

          return (
            <Fragment key={item.id}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    {onNavigate ? (
                      <button
                        type="button"
                        className={cn(
                          dropFolderId === item.id &&
                            'rounded-md bg-primary/10 px-1 ring-2 ring-inset ring-primary/40',
                        )}
                        onClick={() => onNavigate(item.id)}
                        onDragOver={(event) =>
                          handleDragOver(event, item.id, isLast)
                        }
                        onDragLeave={() =>
                          setDropFolderId((current) =>
                            current === item.id ? null : current,
                          )
                        }
                        onDrop={(event) => handleDrop(event, item.id, isLast)}
                      >
                        {label}
                      </button>
                    ) : (
                      <Link
                        to={`/folders/${item.id}`}
                        className={cn(
                          dropFolderId === item.id &&
                            'rounded-md bg-primary/10 px-1 ring-2 ring-inset ring-primary/40',
                        )}
                        onDragOver={(event) =>
                          handleDragOver(event, item.id, isLast)
                        }
                        onDragLeave={() =>
                          setDropFolderId((current) =>
                            current === item.id ? null : current,
                          )
                        }
                        onDrop={(event) => handleDrop(event, item.id, isLast)}
                      >
                        {label}
                      </Link>
                    )}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
