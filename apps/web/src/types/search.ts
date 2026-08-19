import type { FolderBreadcrumb } from '@/types/folder'

export type SearchFolderHit = {
  id: string
  name: string
  dataRoomName: string
  path: FolderBreadcrumb[]
}

export type SearchFileHit = {
  id: string
  name: string
  folderId: string
  dataRoomName: string
  path: FolderBreadcrumb[]
}

export type SearchResults = {
  folders: SearchFolderHit[]
  files: SearchFileHit[]
}
