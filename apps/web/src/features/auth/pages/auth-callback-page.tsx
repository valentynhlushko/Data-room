import { Loader2Icon } from 'lucide-react'
import { useAuthCallback } from '../hooks/use-auth-callback'

export function AuthCallbackPage() {
  useAuthCallback()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-2">
      <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  )
}
