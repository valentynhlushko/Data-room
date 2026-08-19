import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AUTH_ERRORS } from '../constants/auth.errors'
import { signInWithGoogle } from '../auth.service'

export function useGoogleLogin() {
  return useMutation({
    mutationFn: signInWithGoogle,
    onError: (error: Error) => {
      toast.error(error.message || AUTH_ERRORS.GOOGLE_SIGN_IN_FAILED)
    },
  })
}
