import { useEffect } from 'react'
import { CheckCircle2Icon, CircleAlertIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import type { FileUploadItem } from '../hooks/use-file-uploads'

const UPLOAD_TOAST_ID = 'file-uploads'

type FileUploadPanelProps = {
  uploads: FileUploadItem[]
  onDismiss: (id: string) => void
  onClearFinished: () => void
}

export function FileUploadPanel({
  uploads,
  onDismiss,
  onClearFinished,
}: FileUploadPanelProps) {
  const activeCount = uploads.filter((item) => item.status === 'uploading').length
  const canClear = uploads.some((item) => item.status !== 'uploading')

  useEffect(() => {
    if (uploads.length === 0) {
      toast.dismiss(UPLOAD_TOAST_ID)
      return
    }

    toast.custom(
      () => (
        <UploadCard
          uploads={uploads}
          activeCount={activeCount}
          canClear={canClear}
          onDismiss={onDismiss}
          onClearFinished={onClearFinished}
        />
      ),
      {
        id: UPLOAD_TOAST_ID,
        duration: Infinity,
        closeButton: false,
        unstyled: true,
        className: 'border-0 bg-transparent p-0 shadow-none',
      },
    )
  }, [uploads, activeCount, canClear, onDismiss, onClearFinished])

  useEffect(() => {
    return () => {
      toast.dismiss(UPLOAD_TOAST_ID)
    }
  }, [])

  return null
}

function UploadCard({
  uploads,
  activeCount,
  canClear,
  onDismiss,
  onClearFinished,
}: {
  uploads: FileUploadItem[]
  activeCount: number
  canClear: boolean
  onDismiss: (id: string) => void
  onClearFinished: () => void
}) {
  return (
    <div className="w-[356px] rounded-xl border bg-popover p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {activeCount > 0
            ? `Uploading ${activeCount} file${activeCount === 1 ? '' : 's'}`
            : 'Uploads'}
        </p>
        {canClear ? (
          <Button type="button" variant="ghost" size="xs" onClick={onClearFinished}>
            Clear
          </Button>
        ) : null}
      </div>
      <ul className="max-h-64 space-y-2 overflow-y-auto">
        {uploads.map((item) => (
          <li key={item.id} className="rounded-lg bg-muted/60 p-2">
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 truncate text-sm">{item.name}</p>
              {item.status === 'success' ? (
                <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" />
              ) : item.status === 'error' ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Dismiss"
                  onClick={() => onDismiss(item.id)}
                >
                  <XIcon />
                </Button>
              ) : null}
            </div>
            {item.status === 'uploading' ? (
              <Progress className="mt-2" value={item.progress} />
            ) : null}
            {item.status === 'error' ? (
              <p className="mt-1 flex items-start gap-1 text-xs text-destructive">
                <CircleAlertIcon className="mt-0.5 size-3 shrink-0" />
                <span>{item.error}</span>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
