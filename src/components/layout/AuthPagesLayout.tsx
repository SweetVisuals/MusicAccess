import React from 'react';
import { useLocation } from 'react-router-dom';
import { SiteHeader } from "@/components/homepage/site-header";
import { AppSidebar } from "@/components/homepage/app-sidebar";
import { SidebarProvider } from "@/components/@/ui/sidebar";
import { TransitionWrapper } from "./TransitionWrapper";
import { MainContentArea } from "./MainContentArea";
import { debugLog } from "@/lib/debug";

interface AuthPagesLayoutProps {
  children: React.ReactNode;
}

export function AuthPagesLayout({ children }: AuthPagesLayoutProps) {
  const location = useLocation();
  debugLog('AuthPagesLayout rendered', { componentName: 'AuthPagesLayout' });
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-screen overflow-x-hidden">
        <AppSidebar variant="inset" />
        <div className="flex-1 flex flex-col w-full">
          <SiteHeader className="w-full mb-20" />
          <MainContentArea className="w-full mt-20">
            <TransitionWrapper pathname={location.pathname}>
              <div className="w-full max-w-screen-md mx-auto px-4">
                {children}
              </div>
            </TransitionWrapper>
          </MainContentArea>
        </div>
      </div>
    </SidebarProvider>
  );
}
