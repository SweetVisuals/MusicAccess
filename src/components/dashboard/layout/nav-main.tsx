import { type LucideIcon } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/@/ui/sidebar"

export function NavMain({
  items,
  showQuickActions = true,
  title
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    description?: string
  }[]
  showQuickActions?: boolean
  title?: string
}) {
  const location = useLocation()
  const navigate = useNavigate()

  // Function to check if a menu item is active
  const isActive = (url: string) => {
    // Check if the current path matches the item URL
    // For dashboard, we need to check both /dashboard and /user/dashboard
    if (url === '/user/dashboard') {
      return location.pathname === '/user/dashboard' || location.pathname === '/dashboard'
    }

    // For other pages, check if the path starts with the URL
    // This handles nested routes like /dashboard/analytics
    return location.pathname.startsWith(url)
  }


  return (
    <SidebarGroup>
      {title && (
        <h4 className="mb-3 px-3 text-[11px] font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
          {title}
        </h4>
      )}
      <SidebarGroupContent className="flex flex-col gap-0.5">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.description || item.title}
                isActive={isActive(item.url)}
                className="group/nav-item hover:bg-sidebar-accent/60 transition-colors duration-150 ease-out h-9 w-full"
                onClick={() => navigate(item.url)}
              >
                {item.icon && (
                  <item.icon className="h-3.5 w-3.5 text-sidebar-foreground/80 group-data-[active=true]/menu-button:text-sidebar-primary transition-colors duration-150 ease-out" />
                )}
                <div className="flex flex-col text-left min-w-0 flex-1">
                  <span className="text-[11px] mb-[-3px] font-medium text-sidebar-foreground group-data-[active=true]/menu-button:text-sidebar-primary transition-colors duration-150 ease-out">
                    {item.title}
                  </span>
                  {item.description && (
                    <span className="text-[10px] mb-[-1px] text-sidebar-foreground/60 truncate group-data-[active=true]/menu-button:text-sidebar-primary/70 transition-colors duration-150 ease-out">
                      {item.description}
                    </span>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
