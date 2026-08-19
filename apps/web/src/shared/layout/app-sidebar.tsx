import { FolderIcon, UsersIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/shared/ui/sidebar'
import { SidebarUser } from '@/features/auth/components/sidebar-user'

export function AppSidebar() {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  function closeMobileSidebar() {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
              A
            </div>
            <div className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate font-medium">Data Room</span>
              <span className="truncate text-xs text-muted-foreground">
                Workspace
              </span>
            </div>
            <SidebarTrigger className="-mr-1" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/' || pathname.startsWith('/folders')}
                  >
                    <Link to="/" onClick={closeMobileSidebar}>
                      <FolderIcon />
                      <span>Files</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/shared'}>
                    <Link to="/shared" onClick={closeMobileSidebar}>
                      <UsersIcon />
                      <span>Shared with me</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
      <CollapsedSidebarTrigger />
    </>
  )
}

function CollapsedSidebarTrigger() {
  const { isMobile, openMobile, state } = useSidebar()
  const isHidden = isMobile ? openMobile : state === 'expanded'

  if (isHidden) {
    return null
  }

  return <SidebarTrigger className="fixed top-3 left-2 z-20" />
}
