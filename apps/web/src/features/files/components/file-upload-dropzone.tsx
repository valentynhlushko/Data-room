import { useRef, type DragEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { isFileMoveDrag } from '../file.utils'

type FileUploadDropzoneProps = {
  disabled?: boolean
  onFiles: (files: File[]) => void
  children: ReactNode
}

export function FileUploadDropzone({
  disabled,
  onFiles,
  children,
}: FileUploadDropzoneProps) {
  const dragDepth = useRef(0)

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (disabled || isFileMoveDrag(event.dataTransfer)) {
      return
    }
    event.preventDefault()
    dragDepth.current += 1
    event.currentTarget.dataset.dragging = 'true'
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (disabled || isFileMoveDrag(event.dataTransfer)) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) {
      delete event.currentTarget.dataset.dragging
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    dragDepth.current = 0
    delete event.currentTarget.dataset.dragging

    if (disabled || isFileMoveDrag(event.dataTransfer)) {
      return
    }

    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) {
      onFiles(files)
    }
  }

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col',
        'data-[dragging=true]:before:pointer-events-none data-[dragging=true]:before:absolute data-[dragging=true]:before:inset-x-4 data-[dragging=true]:before:bottom-4 data-[dragging=true]:before:top-20 data-[dragging=true]:before:z-10 data-[dragging=true]:before:rounded-xl data-[dragging=true]:before:border-2 data-[dragging=true]:before:border-dashed data-[dragging=true]:before:border-primary data-[dragging=true]:before:bg-primary/5',
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  )
}
