import React from 'react';
import { useLocation } from 'react-router-dom';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar";
import { DashboardSiteHeader } from "@/components/dashboard/layout/site-header"; // Import the new dashboard header
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  show_header?: boolean;
}

export function DashboardLayout({ children, show_header = true }: DashboardLayoutProps) {
  const location = useLocation();
  const nodeRef = React.useRef(null);
  
  // Apply different layout when header is hidden
  if (!show_header) {
    return (
      <div className="flex h-screen w-screen">
        <AppSidebar variant="inset" style={{ flexShrink: 0 }} />
        <div className="flex-1 flex flex-col" style={{ width: 'calc(100vw - 80px)', maxWidth: 'none' }}>
          <main className="flex-1 w-full" style={{ maxWidth: 'none' }}>
            <SwitchTransition mode="out-in">
              <CSSTransition
                key={location.pathname}
                nodeRef={nodeRef}
                classNames="page-transition"
                timeout={300}
                unmountOnExit
              >
                <div ref={nodeRef} className="w-full" style={{ maxWidth: 'none' }}>
                  {children}
                </div>
              </CSSTransition>
            </SwitchTransition>
          </main>
        </div>
      </div>
    );
  }
  
  // Default layout with header
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen pt-6">
        <AppSidebar variant="inset" style={{ flexShrink: 0 }} />
        <div className="flex-1 flex flex-col" style={{ width: 'calc(100vw - 80px)', maxWidth: 'none' }}>
          <DashboardSiteHeader />
          <main className="flex-1 w-full" style={{ maxWidth: 'none' }}>
            <SwitchTransition mode="out-in">
              <CSSTransition
                key={location.pathname}
                nodeRef={nodeRef}
                classNames="page-transition"
                timeout={300}
                unmountOnExit
              >
                <div ref={nodeRef} className="w-full" style={{ maxWidth: 'none' }}>
                  {children}
                </div>
              </CSSTransition>
            </SwitchTransition>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
