import React from 'react';
import { useLocation } from 'react-router-dom';
import { TransitionWrapper } from "./TransitionWrapper";
import { MainContentArea } from "./MainContentArea";
import { debugLog } from "@/lib/debug";

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const location = useLocation();
  debugLog('PageLayout rendered', { componentName: 'PageLayout' });
  
  // Skip transition for profile pages to avoid navigation issues
  const isProfilePage = location.pathname.startsWith('/user/');
  
  return (
    <MainContentArea>
      {isProfilePage ? (
        <div className="flex-1 flex flex-col">{children}</div>
      ) : (
        <TransitionWrapper pathname={location.pathname}>
          <div className="flex-1 flex flex-col">{children}</div>
        </TransitionWrapper>
      )}
    </MainContentArea>
  );
}
