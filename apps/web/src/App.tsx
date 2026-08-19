import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/shared/layout/app-layout'
import { ProtectedRoute } from '@/features/auth/components/protected-route'
import { AuthCallbackPage } from '@/features/auth/pages/auth-callback-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { FolderPage } from '@/features/folders/pages/folder-page'
import { ShareLinkPage } from '@/features/shares/pages/share-link-page'
import { SharedWithMePage } from '@/features/shares/pages/shared-with-me-page'
import { HomePage } from '@/pages/home-page'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route element={<AppLayout />}>
          <Route path="/share/:token" element={<ShareLinkPage />} />
          <Route
            path="/share/:token/folders/:folderId"
            element={<ShareLinkPage />}
          />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/folders/:folderId" element={<FolderPage />} />
            <Route path="/shared" element={<SharedWithMePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
