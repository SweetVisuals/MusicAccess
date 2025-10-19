import { useEffect } from "react"
import { LogInIcon, UserPlusIcon } from "lucide-react"
import {
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
  SettingsIcon,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/@/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/@/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/@/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { Progress } from "@/components/@/ui/progress"
import useUserData from "@/hooks/useUserData"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user: authUser, isLoading: isAuthLoading, signOut } = useAuth()
  const navigate = useNavigate()
  const {
    storageUsed,
    storageLimit,
    loadingStorage,
    profile,
  } = useUserData()

  if (isAuthLoading || !authUser || !profile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="lg" variant="outline" className="gap-2">
            <LogInIcon className="h-4 w-4" />
            <span>Login / Signup</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuItem asChild>
            <Link to="/auth/login" className="w-full">
              <LogInIcon className="mr-2 h-4 w-4" />
              <span>Login</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/auth/signup" className="w-full">
              <UserPlusIcon className="mr-2 h-4 w-4" />
              <span>Sign Up</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Calculate storage percentage
  const storagePercentage = Math.min(Math.round((storageUsed / storageLimit) * 100), 100)
  
  // Format storage display
  const formatStorage = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <SidebarMenu>
      {/* Storage Progress Bar */}
      {authUser && !loadingStorage && ( // Only show if authUser exists and not loading storage
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-sidebar-foreground/70">
              Storage
            </span>
            <span className="text-xs font-medium text-sidebar-foreground/70">
              {formatStorage(storageUsed)} / {formatStorage(storageLimit)}
            </span>
          </div>
          <Progress 
            value={storagePercentage} 
            className="h-2 bg-sidebar-accent [&>div]:bg-sidebar-primary"
          />
        </div>
      )}

      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full bg-gray-300">
                <AvatarImage src={profile.profile_url || ''} alt={profile.username || ''} />
                <AvatarFallback className="rounded-full bg-gray-300">
                  {profile.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {profile.username || authUser.email?.split('@')[0]}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {profile.email || authUser.email}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl border border-sidebar-border/50 bg-sidebar-background/95 backdrop-blur-md shadow-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            {/* User Profile Header */}
            <div className="p-4 border-b border-sidebar-border/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-full border-2 border-sidebar-primary/20 shadow-sm">
                  <AvatarImage src={profile.profile_url || ''} alt={profile.username || ''} />
                  <AvatarFallback className="rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-sidebar-foreground font-semibold">
                    {profile.username?.charAt(0).toUpperCase() || authUser.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="truncate font-semibold text-sidebar-foreground">
                      {profile.username || authUser.email?.split('@')[0]}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Online" />
                  </div>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {profile.email || authUser.email}
                  </span>
                </div>
              </div>
              
              {/* Storage Progress */}
              {!loadingStorage && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-sidebar-foreground/70">Storage</span>
                    <span className="font-medium text-sidebar-foreground">
                      {formatStorage(storageUsed)} / {formatStorage(storageLimit)}
                    </span>
                  </div>
                  <Progress
                    value={storagePercentage}
                    className="h-1.5 bg-sidebar-accent/30 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/70"
                  />
                </div>
              )}
            </div>

            {/* Navigation Menu */}
            <div className="p-2">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  asChild
                  className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground focus:bg-sidebar-accent/50 focus:text-sidebar-foreground"
                >
                  <Link to={`/user/${profile.username}`} className="w-full flex items-center">
                    <UserCircleIcon className="mr-3 h-4 w-4 text-sidebar-foreground/70 group-hover:text-sidebar-foreground transition-colors" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  asChild
                  className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground focus:bg-sidebar-accent/50 focus:text-sidebar-foreground"
                >
                  <Link to="/dashboard" className="w-full flex items-center">
                    <div className="mr-3 h-4 w-4 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-500 to-blue-600" />
                    </div>
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  asChild
                  className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground focus:bg-sidebar-accent/50 focus:text-sidebar-foreground"
                >
                  <Link to="/dashboard/billing" className="w-full flex items-center">
                    <CreditCardIcon className="mr-3 h-4 w-4 text-sidebar-foreground/70 group-hover:text-sidebar-foreground transition-colors" />
                    <span>Billing & Plans</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  asChild
                  className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground focus:bg-sidebar-accent/50 focus:text-sidebar-foreground"
                >
                  <Link to="/dashboard/settings" className="w-full flex items-center">
                    <SettingsIcon className="mr-3 h-4 w-4 text-sidebar-foreground/70 group-hover:text-sidebar-foreground transition-colors" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator className="my-2 bg-sidebar-border/30" />
              
              <DropdownMenuGroup>
                <DropdownMenuItem className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground focus:bg-sidebar-accent/50 focus:text-sidebar-foreground">
                  <BellIcon className="mr-3 h-4 w-4 text-sidebar-foreground/70 group-hover:text-sidebar-foreground transition-colors" />
                  <span>Notifications</span>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">3</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground focus:bg-sidebar-accent/50 focus:text-sidebar-foreground">
                  <div className="mr-3 h-4 w-4 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-purple-500 to-purple-600" />
                  </div>
                  <span>Messages</span>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">12</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator className="my-2 bg-sidebar-border/30" />
              
              <DropdownMenuItem
                onClick={() => signOut()}
                className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOutIcon className="mr-3 h-4 w-4 text-sidebar-foreground/70 group-hover:text-destructive transition-colors" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
