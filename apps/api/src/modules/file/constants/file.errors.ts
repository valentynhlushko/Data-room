export const FILE_ERRORS = {
  NOT_FOUND: 'File not found',
  FORBIDDEN: 'You do not have access to this file',
  NAME_REQUIRED: 'File name is required',
  NAME_CONFLICT: 'A file with this name already exists here',
  PDF_REQUIRED: 'Only PDF files can be uploaded',
  FILE_REQUIRED: 'A file is required',
  TOO_LARGE: 'File is too large. Maximum size is 50 MB',
  EMPTY: 'The file is empty',
} as const;

export const FILE_MAX_BYTES = 50 * 1024 * 1024;
export const PDF_MIME_TYPE = 'application/pdf';
export const FILE_LIST_DEFAULT_LIMIT = 50;
export const FILE_LIST_MAX_LIMIT = 100;
