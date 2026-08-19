import type { ShareResourceType } from '@/types/share'

const sharesRoot = ['shares'] as const

export const shareQueryKeys = {
  all: sharesRoot,
  resource: (resourceType: ShareResourceType, resourceId: string) =>
    [...sharesRoot, resourceType, resourceId] as const,
  inbox: [...sharesRoot, 'inbox'] as const,
  link: (token: string) => ['share-links', token] as const,
  linkContents: (token: string, folderId: string) =>
    ['share-links', token, 'contents', folderId] as const,
  filePreview: (token: string, fileId: string) =>
    ['share-links', token, 'files', fileId, 'preview-url'] as const,
}
