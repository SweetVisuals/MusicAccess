import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/@/ui/sidebar"

export function NavSecondary({
  items,
  title,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    description?: string
  }[]
  title?: string
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const navigate = useNavigate()

  return (
    <SidebarGroup {...props}>
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
                className="group/nav-item hover:bg-sidebar-accent/60 transition-colors duration-150 ease-out h-9 w-full"
                onClick={() => navigate(item.url)}
              >
                <item.icon className="h-3.5 w-3.5 text-sidebar-foreground/80 transition-colors duration-150 ease-out" />
                <div className="flex flex-col text-left min-w-0 flex-1">
                  <span className="text-[11px] mb-[-3px] font-medium text-sidebar-foreground transition-colors duration-150 ease-out">
                    {item.title}
                  </span>
                  {item.description && (
                    <span className="text-[9px] mb-[-1px] text-sidebar-foreground/60 truncate transition-colors duration-150 ease-out">
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
