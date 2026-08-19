import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AUTH_ERRORS } from '../constants/auth.errors'
import { signOut } from '../auth.service'
import { currentUserQueryKey } from './use-current-user'

export function useSignOut() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: currentUserQueryKey })
      await navigate('/login', { replace: true })
    },
    onError: (error: Error) => {
      toast.error(error.message || AUTH_ERRORS.SIGN_OUT_FAILED)
    },
  })
}
