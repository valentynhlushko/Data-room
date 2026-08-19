import { Loader2Icon, Share2Icon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { getApiErrorMessage } from '@/lib/api-error'
import type { FilePreviewTarget } from '@/types/file'
import { FILE_ERRORS } from '../constants/file.errors'
import { useFilePreviewUrl } from '../hooks/use-file-preview-url'

type FilePreviewDialogProps = {
  file: FilePreviewTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
  shareToken?: string
  onShare?: (file: FilePreviewTarget) => void
}

export function FilePreviewDialog({
  file,
  open,
  onOpenChange,
  shareToken,
  onShare,
}: FilePreviewDialogProps) {
  const preview = useFilePreviewUrl(
    file?.id,
    open && Boolean(file),
    shareToken,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-0 left-1/2 flex h-svh max-h-svh w-full max-w-[calc(100%-2rem)] -translate-x-1/2 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-4xl">
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b px-4 py-3 pr-12">
          <div className="min-w-0">
            <DialogTitle className="truncate">{file?.name ?? 'PDF'}</DialogTitle>
            <DialogDescription className="sr-only">
              PDF preview
            </DialogDescription>
          </div>
          {onShare && file ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onShare(file)}
            >
              <Share2Icon />
              Share
            </Button>
          ) : null}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden bg-muted/30">
          {preview.isPending ? (
            <div className="flex h-full items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : preview.isError ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
              {getApiErrorMessage(preview.error, FILE_ERRORS.PREVIEW_FAILED)}
            </div>
          ) : preview.data ? (
            <iframe
              title={file?.name ?? 'PDF preview'}
              src={preview.data.url}
              className="h-full w-full border-0"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
