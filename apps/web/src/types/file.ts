export type FileItem = {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  folderId: string
  dataRoomId: string
  uploadedById: string
  createdAt: string
  updatedAt: string
}

export type FilePreviewUrl = {
  url: string
  expiresIn: number
}

export type FilePreviewTarget = Pick<FileItem, 'id' | 'name'>
