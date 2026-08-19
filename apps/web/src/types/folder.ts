import type { FileItem } from '@/types/file'

export type Folder = {
  id: string
  name: string
  isRoot: boolean
  dataRoomId: string
  parentId: string | null
  createdById: string
  createdAt: string
  updatedAt: string
}

export type FolderBreadcrumb = {
  id: string
  name: string
  isRoot: boolean
}

export type FolderContents = {
  folder: Folder
  breadcrumbs: FolderBreadcrumb[]
  folders: Folder[]
  files: FileItem[]
  nextFileCursor: string | null
  dataRoom?: {
    id: string
    name: string
    ownerId: string
  }
}

export type FolderDeletionPreview = {
  folder: {
    id: string
    name: string
  }
  nestedFolderCount: number
  nestedFileCount: number
}
