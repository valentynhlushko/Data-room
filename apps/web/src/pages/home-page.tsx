import { Navigate } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'
import { FOLDER_ERRORS } from '@/features/folders/constants/folder.errors'
import { useCurrentDataRoom } from '@/features/folders/hooks/use-current-data-room'

export function HomePage() {
  const { data, isPending, isError, error, refetch } = useCurrentDataRoom()

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {getApiErrorMessage(error, FOLDER_ERRORS.DATA_ROOM_FAILED)}
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  return <Navigate to={`/folders/${data.rootFolder.id}`} replace />
}
