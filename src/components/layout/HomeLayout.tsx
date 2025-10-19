import React from 'react';
import { useLocation } from 'react-router-dom';
import { SiteHeader } from "@/components/homepage/site-header";
import { AppSidebar } from "@/components/homepage/app-sidebar";
import { MainContentArea } from "./MainContentArea";
import { debugLog } from "@/lib/debug";
import { SidebarInset } from "@/components/@/ui/sidebar";

interface HomeLayoutProps {
  children: React.ReactNode;
}

export function HomeLayout({ children }: HomeLayoutProps) {
  const location = useLocation();
  
  return (
    <div className="flex min-h-screen w-full mt-1">
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <SiteHeader />
          <MainContentArea>
            <div className="flex-1 flex flex-col animate-fade-in">
              {children}
            </div>
          </MainContentArea>
        </div>
      </SidebarInset>
    </div>
  );
}
