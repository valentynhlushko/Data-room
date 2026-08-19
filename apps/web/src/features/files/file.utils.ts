const sizeFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
})

export const FILE_DRAG_MIME = 'application/x-dataroom-file'
const FILE_DRAG_TEXT_PREFIX = 'dataroom-file:'

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${sizeFormatter.format(bytes / 1024)} KB`
  }

  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`
}

export function isPdfFile(file: File) {
  return (
    file.type === 'application/pdf' ||
    file.type === 'application/x-pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  )
}

export function isFileMoveDrag(dataTransfer: DataTransfer | null) {
  if (!dataTransfer) {
    return false
  }

  return Array.from(dataTransfer.types).includes(FILE_DRAG_MIME)
}

export function setFileMoveDrag(dataTransfer: DataTransfer, fileId: string) {
  dataTransfer.setData(FILE_DRAG_MIME, fileId)
  dataTransfer.setData('text/plain', `${FILE_DRAG_TEXT_PREFIX}${fileId}`)
  dataTransfer.effectAllowed = 'move'
}

export function getFileMoveId(dataTransfer: DataTransfer) {
  const typed = dataTransfer.getData(FILE_DRAG_MIME)
  if (typed) {
    return typed
  }

  const text = dataTransfer.getData('text/plain')
  if (text.startsWith(FILE_DRAG_TEXT_PREFIX)) {
    return text.slice(FILE_DRAG_TEXT_PREFIX.length) || null
  }

  return null
}
