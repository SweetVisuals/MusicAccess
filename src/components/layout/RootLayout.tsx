import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HomeLayout } from "@/components/layout/HomeLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ThemeToggle } from "@/components/theme-toggle";
import { AudioPlayer } from "@/components/audio/audio-player";
import { GemClaimPopup } from "@/components/GemClaimPopup";
import { GemsDialogWrapper } from "@/components/GemsDialogWrapper";
import MessagingPopup from "@/components/MessagingPopup";
import NotesPopup from "@/components/NotesPopup";
import { NotesMessagesToolbar } from "@/components/homepage/NotesMessagesToolbar";
import { useDailyGems } from "@/hooks/useDailyGems";
import { useAuth } from "@/contexts/auth-context";

interface RootLayoutProps {
  children: React.ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  const { canClaim } = useDailyGems();
  const [showGemPopup, setShowGemPopup] = useState(false);
  const [dismissedToday, setDismissedToday] = useState(false);

  useEffect(() => {
    if (user && canClaim && !showGemPopup && !dismissedToday) {
      // Show popup when user is logged in and can claim gems and hasn't dismissed today
      setShowGemPopup(true);
    }
  }, [user, canClaim, showGemPopup, dismissedToday]);

  // Define routes that should use the HomeLayout (public pages)
  const homeLayoutRoutes = [
    '/',
    '/find-talent',
    '/tutorials',
    '/marketing',
    '/collaborate',
    '/home/beats-instrumentals',
    '/home/vocal-production',
    '/home/mixing-mastering',
    '/following',
    '/checkout',
    '/search',
  ];

  // Define routes that should use the DashboardLayout (protected pages)
  const dashboardLayoutRoutes = [
    '/dashboard',
    '/user/dashboard',
    '/dashboard/billing',
    '/dashboard/analytics',
    '/dashboard/projects',
    '/dashboard/contracts',
    '/dashboard/orders',
    '/dashboard/sales',
    '/dashboard/wallet',
    '/dashboard/settings',
    '/files',
    '/dashboard/services',
    '/messages',
    '/notes',
    '/orders/history',
    '/upload',
    '/studio',
  ];

  // Routes that should have no layout (e.g., auth pages)
  const noLayoutRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
  ];

  // Dynamic routes with specific logic
  const isUserProfileRoute = /^\/user\/[^/]+$/.test(currentPath);
  const isProjectViewRoute = /^\/view\/[^/]+$/.test(currentPath);

  // Determine which layout to use
  let contentToRender = children;

  if (noLayoutRoutes.includes(currentPath)) {
    // No layout for auth pages
    contentToRender = children;
  } else if (dashboardLayoutRoutes.includes(currentPath)) {
    // Dashboard layout for protected pages
    contentToRender = <DashboardLayout>{children}</DashboardLayout>;
  } else if (homeLayoutRoutes.includes(currentPath) || isUserProfileRoute || isProjectViewRoute) {
    // Home layout for public pages, user profiles, and project views
    contentToRender = <HomeLayout>{children}</HomeLayout>;
  } else {
    // Fallback to no layout for unknown routes
    contentToRender = children;
  }

  return (
    <>
      {contentToRender}
      <div className="fixed bottom-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <AudioPlayer />
      <GemClaimPopup
        open={showGemPopup}
        onOpenChange={setShowGemPopup}
        onDismiss={() => setDismissedToday(true)}
      />
      <GemsDialogWrapper />
      <MessagingPopup />
      <NotesPopup />
      <NotesMessagesToolbar />
    </>
  );
}
