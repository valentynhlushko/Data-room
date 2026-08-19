import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { AUTH_ERRORS } from '../constants/auth.errors'
import { currentUserQueryKey } from './use-current-user'

function getOAuthCallbackError() {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  return search.get('error') ?? hash.get('error')
}

export function useAuthCallback() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    let isSettled = false
    let timeout: number

    const goToLogin = (showError = false) => {
      if (isSettled) {
        return
      }

      isSettled = true
      window.clearTimeout(timeout)

      if (showError) {
        toast.error(AUTH_ERRORS.GOOGLE_SIGN_IN_FAILED)
      }

      void navigate('/login', { replace: true })
    }

    const complete = (session: Session | null) => {
      if (!session || isSettled) {
        return
      }

      isSettled = true
      window.clearTimeout(timeout)
      void queryClient.invalidateQueries({ queryKey: currentUserQueryKey })
      void navigate('/', { replace: true })
    }

    const oauthError = getOAuthCallbackError()

    if (oauthError) {
      goToLogin(oauthError !== 'access_denied')
      return
    }

    timeout = window.setTimeout(() => {
      goToLogin()
    }, 8000)

    void (async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!error) {
          complete(data.session)
          return
        }
      }

      const { data } = await supabase.auth.getSession()
      complete(data.session)
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      complete(session)
    })

    return () => {
      window.clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [navigate, queryClient])
}
