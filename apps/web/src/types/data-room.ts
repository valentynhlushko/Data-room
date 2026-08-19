import type { Folder } from '@/types/folder'

export type DataRoom = {
  id: string
  name: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export type CurrentDataRoom = {
  dataRoom: DataRoom
  rootFolder: Folder
}
