import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { MessageSquare, Bell, User, type LucideIcon, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from "@/components/@/ui/sidebar"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/@/ui/avatar"
import { Button } from "@/components/@/ui/button"
import { Badge } from "@/components/@/ui/badge"
import { Skeleton } from "@/components/@/ui/skeleton"
import { toast } from "sonner"
import { useFollowingStore } from "@/hooks/useFollowing"
import { Profile } from "@/lib/types"

interface FollowingUser extends Profile {
  has_unread_messages?: boolean
  has_notifications?: boolean
}

export function NavDocuments() {
  const { user } = useAuth()
  const { following: followingUsers, fetchFollowing } = useFollowingStore()
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetchFollowing(user.id).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user, fetchFollowing]);

  const handleMessage = (userId: string, username: string) => {
    toast.info(`Messaging ${username}`);
    navigate(`/messages/${userId}`);
  };

  const handleNotification = (userId: string, username: string) => {
    toast.info(`Viewing notifications for ${username}`);
    navigate(`/notifications/${userId}`);
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between px-3 mb-2.5">
        <SidebarGroupLabel className="text-[11px] font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
          Following
        </SidebarGroupLabel>
        {user && followingUsers.length > 0 && (
          <span className="text-xs font-medium text-sidebar-primary bg-sidebar-primary/10 px-1.5 py-0.5 rounded-full">
            {followingUsers.length}
          </span>
        )}
      </div>
      <SidebarMenu>
        {isLoading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, i) => (
            <SidebarMenuItem key={`skeleton-${i}`}>
              <div className="flex items-center gap-3 p-2 w-full animate-pulse">
                <Skeleton className="h-8 w-8 rounded-full bg-sidebar-accent/50" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-3/4 bg-sidebar-accent/50" />
                  <Skeleton className="h-2 w-1/2 bg-sidebar-accent/50" />
                </div>
              </div>
            </SidebarMenuItem>
          ))
        ) : followingUsers.length === 0 ? (
          <SidebarMenuItem>
            <div className="p-4 text-center border border-sidebar-border/50 rounded-lg bg-sidebar-accent/20">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-sidebar-accent/30 flex items-center justify-center border border-sidebar-border/50">
                  <User className="h-6 w-6 text-sidebar-foreground/50" />
                </div>
              </div>
              <p className="text-sm font-medium text-sidebar-foreground mb-2">
                {user ? "Not following anyone" : "Join to follow"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 mb-4">
                {user ? "Find creators to follow" : "Sign in to follow creators"}
              </p>
              {user && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-8 border-sidebar-border/50 hover:bg-sidebar-accent/50"
                  onClick={() => navigate('/find-talent')}
                >
                  Find Creators
                </Button>
              )}
            </div>
          </SidebarMenuItem>
        ) : (
          followingUsers.map((followingUser) => (
            <SidebarMenuItem key={followingUser.id}>
              <div className="flex items-center justify-between w-full rounded-lg hover:bg-sidebar-accent/60 group/user transition-colors duration-150 ease-out p-2">
                <Link to={`/user/${followingUser.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 border border-sidebar-border/50 group-hover/user:border-sidebar-primary/60 transition-colors duration-150 ease-out">
                    <AvatarImage src={followingUser.avatarUrl || ''} />
                    <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground font-semibold text-sm group-hover/user:bg-sidebar-primary/20 transition-colors duration-150 ease-out">
                      {followingUser.full_name?.[0]?.toUpperCase() || followingUser.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-sidebar-foreground truncate group-hover/user:text-sidebar-primary transition-colors duration-150 ease-out">
                        {followingUser.full_name || followingUser.username}
                      </span>
                      {followingUser.has_notifications && (
                        <Badge variant="default" className="h-2 w-2 rounded-full p-0 bg-red-500 border border-sidebar-background" />
                      )}
                    </div>
                    {followingUser.full_name && followingUser.username && (
                      <span className="text-[10px] text-sidebar-foreground/50 truncate block font-normal">
                        @{followingUser.username}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-1 opacity-0 group-hover/user:opacity-100 transition-opacity duration-150 ease-out">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent/70 transition-colors duration-150 ease-out"
                    onClick={() => handleMessage(followingUser.id, followingUser.username)}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {followingUser.has_unread_messages && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full border border-sidebar-background" />
                    )}
                  </Button>
                </div>
              </div>
            </SidebarMenuItem>
          ))
        )}
        
        {user && followingUsers.length > 0 && (
          <SidebarMenuButton asChild className="text-sidebar-primary text-xs font-medium hover:bg-sidebar-accent/60 transition-colors duration-150 ease-out p-2 flex items-center justify-between border-t border-sidebar-border/50" style={{ marginBottom: '2px' }}>
            <Link to="/following" className="flex items-center justify-between w-full">
              <span>View all followed creators</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </SidebarMenuButton>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
