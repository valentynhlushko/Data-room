import { Navigate } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { GoogleIcon } from '../components/google-icon'
import { useGoogleLogin } from '../hooks/use-google-login'
import { useSupabaseSession } from '../hooks/use-supabase-session'

export function LoginPage() {
  const { session, isLoading } = useSupabaseSession()
  const googleLogin = useGoogleLogin()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>
            Sign in to continue to Data Room
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={googleLogin.isPending}
            onClick={() => googleLogin.mutate()}
          >
            {googleLogin.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <GoogleIcon className="size-4" />
            )}
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
