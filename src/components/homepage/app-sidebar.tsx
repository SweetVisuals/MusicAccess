import * as React from "react"
import { ArrowUpCircleIcon } from "lucide-react"

import { NavMain } from "@/components/homepage/nav-main"
import { NavUser } from "@/components/homepage/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/@/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Home",
      url: "/",
    },
    {
      title: "Find Talent",
      url: "/find-talent",
    },
    {
      title: "Tutorials",
      url: "/tutorials",
    },
    {
      title: "Marketing",
      url: "/marketing",
    },
    {
      title: "Collaborate",
      url: "/collaborate",
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
    },
    {
      title: "Get Help",
      url: "#",
    },
    {
      title: "Search",
      url: "#",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Music Access.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}