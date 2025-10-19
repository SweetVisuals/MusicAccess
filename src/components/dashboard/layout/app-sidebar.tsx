import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  BarChartIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileTextIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
  ShoppingBag,
  DollarSign,
  Wallet,
  Upload,
  PlusCircle,
  Home,
} from "lucide-react"

import { NavMain } from "@/components/dashboard/layout/nav-main"
import { NavSecondary } from "@/components/dashboard/layout/nav-secondary"
import { NavUser } from "@/components/homepage/nav-user"
import { SidebarHeader } from "@/components/sidebar/SidebarHeader"
import { SidebarContent as BaseSidebarContent } from "@/components/@/ui/sidebar"
import { SidebarFooter as BaseSidebarFooter } from "@/components/@/ui/sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/@/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/@/ui/button"
import useUserData from "@/hooks/useUserData"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
      description: "Your personal workspace"
    },
    {
      title: "My Studio",
      url: "/dashboard/studio",
      icon: Home,
      description: "Manage your projects and files"
    },
    {
      title: "Sales",
      url: "/dashboard/sales",
      icon: DollarSign,
      description: "Track your earnings"
    },
  ],
  navAccount: [
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: UsersIcon,
      description: "Manage your profile"
    },
    {
      title: "Wallet",
      url: "/dashboard/wallet",
      icon: Wallet,
      description: "View your balance"
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: ShoppingBag,
      description: "Your purchase history"
    },
    {
      title: "Messages",
      url: "/messages",
      icon: ClipboardListIcon,
      description: "Communicate with collaborators"
    },
  ],
  navTools: [
    {
      title: "Contracts",
      url: "/dashboard/contracts",
      icon: FileTextIcon,
      description: "Manage agreements"
    },
    {
      title: "Post A Service",
      url: "/dashboard/services",
      icon: DatabaseIcon,
      description: "Offer your skills"
    },
    {
      title: "Notes",
      url: "/notes",
      icon: FileTextIcon,
      description: "Organize your thoughts"
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChartIcon,
      description: "Track performance"
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: SettingsIcon,
      description: "Customize your experience"
    },
    {
      title: "Get Help",
      url: "/get-help",
      icon: HelpCircleIcon,
      description: "Support and guidance"
    },
  ],
  quickActions: [
    {
      title: "Upload Track",
      url: "/upload",
      icon: Upload,
      variant: "secondary" as const,
    },
    {
      title: "New Project",
      url: "/projects/new",
      icon: PlusCircle,
      variant: "outline" as const,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const { profile } = useUserData()
  const navigate = useNavigate()

  const handleCreateNewProject = () => {
    navigate("/dashboard/studio", { state: { showCreateDialog: true } });
  };

  // Generate profile URL based on username
  const getProfileUrl = () => {
    if (profile?.username) {
      return `/user/${profile.username}`
    }
    return "/dashboard/profile" // fallback to dashboard profile if username not available
  }

  // Update navAccount with dynamic profile URL
  const navAccount = [
    {
      title: "Profile",
      url: getProfileUrl(),
      icon: UsersIcon,
      description: "View your public profile"
    },
    {
      title: "Wallet",
      url: "/dashboard/wallet",
      icon: Wallet,
      description: "View your balance"
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: ShoppingBag,
      description: "Your purchase history"
    },
    {
      title: "Messages",
      url: "/messages",
      icon: ClipboardListIcon,
      description: "Communicate with collaborators"
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader />
      <BaseSidebarContent className="flex flex-col gap-6 py-4 sidebar-scrollbar">
        {/* Quick Actions */}
        {user && (
          <div className="px-3">
            <div className="flex flex-col gap-1.5">
              <h4 className="text-[11px] font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-2">
                Quick Actions
              </h4>
              <div className="flex flex-col gap-2">
                {data.quickActions.map((action) => {
                  if (action.title === "New Project") {
                    return (
                      <Button
                        key={action.title}
                        variant={action.variant}
                        size="sm"
                        className="w-full justify-start gap-2 h-8 text-xs font-medium transition-all duration-200 bg-background text-foreground hover:bg-accent"
                        onClick={handleCreateNewProject}
                      >
                        <action.icon className="h-3.5 w-3.5" />
                        {action.title}
                      </Button>
                    );
                  }
                  return (
                    <Button
                      key={action.title}
                      variant={action.variant}
                      size="sm"
                      className="w-full justify-start gap-2 h-8 text-xs font-medium transition-all duration-200 bg-background text-foreground hover:bg-accent"
                      asChild
                    >
                      <Link to={action.url}>
                        <action.icon className="h-3.5 w-3.5" />
                        {action.title}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <NavMain 
          items={data.navMain} 
          showQuickActions={!!user}
          title="Dashboard"
        />

        {/* Account Navigation */}
        <NavMain 
          items={navAccount} 
          showQuickActions={false}
          title="Account"
        />

        {/* Tools Navigation */}
        <NavMain 
          items={data.navTools} 
          showQuickActions={false}
          title="Tools"
        />

        {/* Secondary Navigation */}
        <NavSecondary 
          items={data.navSecondary} 
          className="mt-auto border-t border-sidebar-border/40 pt-4"
          title="Resources"
        />
      </BaseSidebarContent>
      <BaseSidebarFooter>
        <NavUser />
      </BaseSidebarFooter>
    </Sidebar>
  )
}
