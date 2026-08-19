import { Navigate, Outlet } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'
import { useSupabaseSession } from '../hooks/use-supabase-session'

export function ProtectedRoute() {
  const { session, isLoading } = useSupabaseSession()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
