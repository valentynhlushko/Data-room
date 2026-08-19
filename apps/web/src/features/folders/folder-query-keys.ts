export const dataRoomQueryKeys = {
  current: ['data-rooms', 'current'] as const,
}

export const folderQueryKeys = {
  all: ['folders'] as const,
  contents: (folderId: string) =>
    [...folderQueryKeys.all, folderId, 'contents'] as const,
  deletionPreview: (folderId: string) =>
    [...folderQueryKeys.all, folderId, 'deletion-preview'] as const,
}
