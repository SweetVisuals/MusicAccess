import React from 'react';
import { useLocation } from 'react-router-dom';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { SiteHeader } from "@/components/homepage/site-header";
import { AppSidebar } from "@/components/homepage/app-sidebar";
import { SidebarInset } from "@/components/@/ui/sidebar";

interface HomeLayoutProps {
  children: React.ReactNode;
}

export function HomeLayout({ children }: HomeLayoutProps) {
  const location = useLocation();
  console.log('HomeLayout rendered'); // Diagnostic log
  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="@container/main flex flex-1 flex-col pt-5">
          <SiteHeader />
          <SwitchTransition mode="out-in">
            <CSSTransition
              key={location.pathname}
              classNames="page-transition"
              timeout={300}
            >
              <div>{children}</div>
            </CSSTransition>
          </SwitchTransition>
        </div>
      </SidebarInset>
    </>
  );
}
