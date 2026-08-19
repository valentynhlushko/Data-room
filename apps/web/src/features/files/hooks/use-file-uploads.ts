import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { uploadFile } from '@/api/file.api'
import { getApiErrorMessage } from '@/lib/api-error'
import { folderQueryKeys } from '@/features/folders/folder-query-keys'
import { queryClient } from '@/lib/query-client'
import { FILE_ERRORS } from '../constants/file.errors'
import { isPdfFile } from '../file.utils'

export type FileUploadItem = {
  id: string
  name: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

const CONCURRENT_UPLOADS = 3

export function useFileUploads(folderId: string) {
  const [uploads, setUploads] = useState<FileUploadItem[]>([])

  const updateUpload = useCallback(
    (id: string, patch: Partial<FileUploadItem>) => {
      setUploads((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      )
    },
    [],
  )

  const startUploads = useCallback(
    async (files: File[]) => {
      const pdfs = files.filter(isPdfFile)
      const skipped = files.length - pdfs.length

      if (skipped > 0) {
        toast.error(
          skipped === 1
            ? FILE_ERRORS.PDF_REQUIRED
            : `${skipped} files were skipped. Only PDFs can be uploaded.`,
        )
      }

      if (pdfs.length === 0) {
        return
      }

      const queued: FileUploadItem[] = pdfs.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        progress: 0,
        status: 'uploading',
      }))

      setUploads((current) => [...queued, ...current])

      let cursor = 0
      let successCount = 0

      async function runNext() {
        while (cursor < pdfs.length) {
          const index = cursor
          cursor += 1
          const file = pdfs[index]
          const item = queued[index]

          try {
            await uploadFile(folderId, file, (percent) => {
              updateUpload(item.id, { progress: percent })
            })
            updateUpload(item.id, { progress: 100, status: 'success' })
            successCount += 1
          } catch (error) {
            updateUpload(item.id, {
              status: 'error',
              error: getApiErrorMessage(error, FILE_ERRORS.UPLOAD_FAILED),
            })
          }
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENT_UPLOADS, pdfs.length) }, () =>
          runNext(),
        ),
      )

      if (successCount > 0) {
        await queryClient.invalidateQueries({
          queryKey: folderQueryKeys.contents(folderId),
        })
        toast.success(
          successCount === 1 ? 'PDF uploaded' : `${successCount} PDFs uploaded`,
        )
      }
    },
    [folderId, updateUpload],
  )

  const dismissUpload = useCallback((id: string) => {
    setUploads((current) => current.filter((item) => item.id !== id))
  }, [])

  const clearFinished = useCallback(() => {
    setUploads((current) =>
      current.filter((item) => item.status === 'uploading'),
    )
  }, [])

  return { uploads, startUploads, dismissUpload, clearFinished }
}
