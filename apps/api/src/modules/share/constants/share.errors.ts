export const SHARE_ERRORS = {
  NOT_FOUND: 'Share not found',
  LINK_UNAVAILABLE: 'This link is no longer available',
  FORBIDDEN: 'You do not have access to this item',
  USER_NOT_FOUND: (emails: string[]) =>
    emails.length === 1
      ? `No account found for ${emails[0]}. They need to sign in first, or use a public link.`
      : `No account found for ${emails.join(', ')}. They need to sign in first, or use a public link.`,
} as const;

export const SHARE_RESOURCE_TYPE = {
  DATA_ROOM: 'DATA_ROOM',
  FOLDER: 'FOLDER',
  FILE: 'FILE',
} as const;

export const SHARE_KIND = {
  PUBLIC_LINK: 'PUBLIC_LINK',
  USER: 'USER',
} as const;

export const SHARE_ROLE = {
  VIEWER: 'VIEWER',
  EDITOR: 'EDITOR',
} as const;

export type ShareResourceType =
  (typeof SHARE_RESOURCE_TYPE)[keyof typeof SHARE_RESOURCE_TYPE];
export type ShareKind = (typeof SHARE_KIND)[keyof typeof SHARE_KIND];
export type ShareRole = (typeof SHARE_ROLE)[keyof typeof SHARE_ROLE];
