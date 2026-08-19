export const STORAGE_ERRORS = {
  ENV_REQUIRED:
    'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for file storage',
  UPLOAD_FAILED: 'Could not upload file to storage',
  SIGN_FAILED: 'Could not create a file preview link',
  DELETE_FAILED: 'Could not delete file from storage',
  BUCKET_FAILED: 'Could not prepare the file storage bucket',
} as const;
