export const FOLDER_ERRORS = {
  NOT_FOUND: 'Folder not found',
  NAME_REQUIRED: 'Folder name is required',
  NAME_CONFLICT: 'A folder with this name already exists here',
  CANNOT_DELETE_ROOT: 'The root folder cannot be deleted',
  CANNOT_RENAME_ROOT: 'The root folder cannot be renamed',
  FORBIDDEN: 'You do not have access to this folder',
} as const;
