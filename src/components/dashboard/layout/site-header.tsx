import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/@/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/@/ui/sheet';
import { MenuIcon } from 'lucide-react';
import { SidebarTrigger } from '@/components/@/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNav } from '@/components/dashboard/layout/user-nav';

export function DashboardSiteHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pl-14">
      <SidebarTrigger className="sm:hidden" />
      <div className="relative ml-auto flex items-center gap-2 md:grow-0">
        {/* Search or other dashboard specific elements can go here */}
      </div>
      <ThemeToggle />
      <UserNav />
    </header>
  );
}
