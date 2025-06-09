import * as React from "react"
import { useState, useEffect } from "react"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  CameraIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  ShoppingBag,
  DollarSign,
  Wallet,
} from "lucide-react"

import { NavMain } from "@/components/dashboard/layout/nav-main"
import { NavSecondary } from "@/components/dashboard/layout/nav-secondary"
import { NavUser } from "@/components/dashboard/nav-user"
import { Progress } from "@/components/@/ui/progress"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/@/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

const data = {
  navMain: [
    {
      title: "Overview",
      url: "/user/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Sales",
      url: "/dashboard/sales",
      icon: DollarSign,
    },
    {
      title: "Post A Service",
      url: "/dashboard/services",
      icon: DatabaseIcon,
    },
    {
      title: "Contracts",
      url: "/dashboard/contracts",
      icon: FileTextIcon,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChartIcon,
    },
    {
      title: "Wallet",
      url: "/dashboard/wallet",
      icon: Wallet,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircleIcon,
    },
    {
      title: "Search",
      url: "#",
      icon: SearchIcon,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: DatabaseIcon,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardListIcon,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: FileIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, storageUsed, totalStorage } = useAuth();

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const storagePercentage = totalStorage > 0 ? (storageUsed / totalStorage) * 100 : 0;

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
        <NavSecondary items={data.navSecondary} className="mt-auto" />
        
        {/* Storage Progress Bar */}
        {user && (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-sidebar-foreground/70">
                Storage
              </span>
              <span className="text-xs font-medium text-sidebar-foreground/70">
                {formatStorage(storageUsed)} / {formatStorage(totalStorage)}
              </span>
            </div>
            <Progress 
              value={storagePercentage} 
              className="h-2 bg-sidebar-accent [&>div]:bg-sidebar-primary"
            />
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
