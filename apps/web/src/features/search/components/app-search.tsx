import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileIcon, FolderIcon, Loader2Icon, SearchIcon } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { useSidebar } from '@/shared/ui/sidebar'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { getFolderLabel } from '@/features/folders/folder.utils'
import { useSupabaseSession } from '@/features/auth/hooks/use-supabase-session'
import type { SearchFileHit, SearchFolderHit } from '@/types/search'
import { useSearch } from '../hooks/use-search'

const SEARCH_DEBOUNCE_MS = 400

export function AppSearch() {
  const { session } = useSupabaseSession()
  const { isMobile, openMobile, state } = useSidebar()
  const isSidebarClosed = isMobile ? !openMobile : state === 'collapsed'
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const debounced = useDebouncedValue(value.trim(), SEARCH_DEBOUNCE_MS)
  const results = useSearch(debounced)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  if (!session) {
    return null
  }

  const folders = results.data?.folders ?? []
  const files = results.data?.files ?? []
  const query = value.trim()
  const isDebouncing = query.length > 0 && query !== debounced
  const isSearching = isDebouncing || (debounced.length > 0 && results.isFetching)
  const isEmpty =
    !isSearching &&
    debounced.length > 0 &&
    folders.length === 0 &&
    files.length === 0
  const showPanel = open && query.length > 0

  function openFolder(folder: SearchFolderHit) {
    setOpen(false)
    setValue('')
    navigate(`/folders/${folder.id}`)
  }

  function openFile(file: SearchFileHit) {
    setOpen(false)
    setValue('')
    navigate(`/folders/${file.folderId}`, {
      state: { highlightFileId: file.id },
    })
  }

  return (
    <div
      className={cn(
        'flex items-center border-b py-2 pr-6',
        isSidebarClosed ? 'pl-12' : 'pl-4',
      )}
    >
      <div ref={rootRef} className="relative w-full max-w-md">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false)
                event.currentTarget.blur()
              }
            }}
            placeholder="Search files and folders"
            className="pl-8"
          />
        </div>
        {showPanel ? (
          <div className="absolute top-[calc(100%+0.25rem)] z-30 w-full overflow-hidden rounded-xl border bg-popover shadow-md">
            {isSearching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : isEmpty ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                No matching files or folders
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {folders.map((folder) => (
                  <li key={`folder-${folder.id}`}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-muted/60"
                      onClick={() => openFolder(folder)}
                    >
                      <FolderIcon className="mt-0.5 size-4 shrink-0 fill-amber-400/90 text-amber-500" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {folder.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {formatPath(folder.path, folder.dataRoomName)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
                {files.map((file) => (
                  <li key={`file-${file.id}`}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-muted/60"
                      onClick={() => openFile(file)}
                    >
                      <FileIcon className="mt-0.5 size-4 shrink-0 text-red-500" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {file.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {formatPath(file.path, file.dataRoomName)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function formatPath(path: SearchFolderHit['path'], dataRoomName: string) {
  if (path.length === 0) {
    return dataRoomName
  }

  return path.map((item) => getFolderLabel(item, dataRoomName)).join(' / ')
}
