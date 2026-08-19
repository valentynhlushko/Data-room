import type { FolderBreadcrumb } from '@/types/folder'

export function getFolderLabel(
  folder: Pick<FolderBreadcrumb, 'name' | 'isRoot'>,
  dataRoomName = 'Files',
) {
  return folder.isRoot ? dataRoomName : folder.name
}

const modifiedDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function formatFolderModifiedAt(isoDate: string) {
  return modifiedDateFormatter.format(new Date(isoDate))
}

export function formatDeletionWarning(input: {
  folderName: string
  nestedFolderCount: number
  nestedFileCount: number
}) {
  const nestedParts: string[] = []

  if (input.nestedFolderCount > 0) {
    nestedParts.push(
      `${input.nestedFolderCount} nested folder${input.nestedFolderCount === 1 ? '' : 's'}`,
    )
  }

  if (input.nestedFileCount > 0) {
    nestedParts.push(
      `${input.nestedFileCount} file${input.nestedFileCount === 1 ? '' : 's'}`,
    )
  }

  if (nestedParts.length === 0) {
    return `This will permanently delete “${input.folderName}”. This cannot be undone.`
  }

  return `This will permanently delete “${input.folderName}” and ${nestedParts.join(' and ')}. This cannot be undone.`
}
