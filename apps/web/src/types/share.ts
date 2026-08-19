import type { FileItem } from '@/types/file'
import type { Folder } from '@/types/folder'

export const SHARE_RESOURCE_TYPE = {
  DATA_ROOM: 'DATA_ROOM',
  FOLDER: 'FOLDER',
  FILE: 'FILE',
} as const

export type ShareResourceType =
  (typeof SHARE_RESOURCE_TYPE)[keyof typeof SHARE_RESOURCE_TYPE]

export const SHARE_ROLE = {
  VIEWER: 'VIEWER',
  EDITOR: 'EDITOR',
} as const

export type ShareRole = (typeof SHARE_ROLE)[keyof typeof SHARE_ROLE]

export const SHARE_KIND = {
  PUBLIC_LINK: 'PUBLIC_LINK',
  USER: 'USER',
} as const

export type ShareKind = (typeof SHARE_KIND)[keyof typeof SHARE_KIND]

export type ShareUser = {
  id: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
  role: ShareRole
  createdAt: string
}

export type SharePublicLink = {
  enabled: boolean
  token: string | null
  createdAt: string | null
}

export type ResourceShares = {
  publicLink: SharePublicLink
  users: ShareUser[]
}

export type ShareInboxItem = {
  id: string
  resourceType: ShareResourceType
  resourceId: string
  dataRoomId: string
  role: ShareRole
  name: string
  openFolderId: string | null
  fileId: string | null
  createdAt: string
}

export type ShareLinkResolve = {
  share: {
    id: string
    resourceType: ShareResourceType
    resourceId: string
    role: ShareRole
    kind: ShareKind
  }
  dataRoom: { id: string; name: string }
  folder: Omit<Folder, 'createdById'> | null
  file: FileItem | null
  rootFolderId: string | null
}

export type ShareTarget = {
  resourceType: ShareResourceType
  resourceId: string
  name: string
}
