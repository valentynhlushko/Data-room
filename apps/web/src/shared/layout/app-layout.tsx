import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { AppSearch } from '@/features/search/components/app-search'
import { AppSidebar } from './app-sidebar'

export function AppLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppSearch />
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
