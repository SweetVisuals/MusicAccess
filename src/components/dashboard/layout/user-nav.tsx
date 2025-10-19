import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/@/ui/dropdown-menu';
import { Button } from '@/components/@/ui/button';
import {
  UserCircleIcon,
  CreditCardIcon,
  SettingsIcon,
  BellIcon,
  LogOutIcon,
  MessageSquareIcon,
  ShoppingCartIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useMessages } from '@/hooks/useMessages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/@/ui/avatar';

export function UserNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useMessages(user?.id || '');

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full border-2 border-transparent hover:border-primary/20 transition-all duration-200">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground font-semibold">
              {user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 rounded-xl border border-border/50 bg-background/95 backdrop-blur-md shadow-xl"
        sideOffset={8}
      >
        {/* User Profile Header */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-full border-2 border-primary/20 shadow-sm">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
              <AvatarFallback className="rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground font-semibold">
                {user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="truncate font-semibold text-foreground">
                  {user?.user_metadata?.username || user?.email?.split('@')[0]}
                </span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Online" />
              </div>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-2">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => navigate(`/user/${user?.user_metadata?.username || 'profile'}`)}
              className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground focus:bg-accent/50 focus:text-accent-foreground cursor-pointer"
            >
              <UserCircleIcon className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
              <span>My Profile</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => navigate('/dashboard')}
              className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground focus:bg-accent/50 focus:text-accent-foreground cursor-pointer"
            >
              <div className="mr-3 h-4 w-4 flex items-center justify-center">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-500 to-blue-600" />
              </div>
              <span>Dashboard</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => navigate('/messages')}
              className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground focus:bg-accent/50 focus:text-accent-foreground cursor-pointer"
            >
              <MessageSquareIcon className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
              <span>Messages</span>
              {unreadCount > 0 && (
                <div className="ml-auto flex items-center gap-1">
                  <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                </div>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => navigate('/orders/history')}
              className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground focus:bg-accent/50 focus:text-accent-foreground cursor-pointer"
            >
              <ShoppingCartIcon className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
              <span>Orders</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator className="my-2 bg-border/30" />
          
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => navigate('/dashboard/settings')}
              className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground focus:bg-accent/50 focus:text-accent-foreground cursor-pointer"
            >
              <SettingsIcon className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
              <span>Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
              <BellIcon className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
              <span>Notifications</span>
              <div className="ml-auto flex items-center gap-1">
                <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">3</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => navigate('/dashboard/billing')}
              className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground focus:bg-accent/50 focus:text-accent-foreground cursor-pointer"
            >
              <CreditCardIcon className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
              <span>Billing & Plans</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator className="my-2 bg-border/30" />
          
          <DropdownMenuItem
            onClick={handleSignOut}
            className="group rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
          >
            <LogOutIcon className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
