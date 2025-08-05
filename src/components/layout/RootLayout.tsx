import React from 'react';
import { useLocation } from 'react-router-dom';
import { StorageProvider } from "@/contexts/storage-context";
import { SidebarProvider } from "@/components/@/ui/sidebar";
import { HomeLayout } from "@/components/layout/HomeLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ThemeToggle } from "@/components/theme-toggle"; // Import ThemeToggle

interface RootLayoutProps {
  children: React.ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  const location = useLocation();

  // Define routes that should use the HomeLayout
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
    '/view/:projectId', // Public project view
    '/search',
    '/user/:username', // Public user profile view
  ];

  // Define routes that should use the DashboardLayout
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
    '/orders/history', // Protected order history
  ];

  // Routes that should have no layout (e.g., auth pages)
  const noLayoutRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
  ];

  const currentPath = location.pathname;

  const shouldUseHomeLayout = homeLayoutRoutes.some(path => {
    if (path.includes(':')) {
      const regex = new RegExp(`^${path.replace(/:\w+/g, '[^/]+')}$`);
      return regex.test(currentPath);
    }
    return currentPath === path;
  });

  const shouldUseDashboardLayout = dashboardLayoutRoutes.some(path => {
    if (path.includes(':')) {
      const regex = new RegExp(`^${path.replace(/:\w+/g, '[^/]+')}$`);
      return regex.test(currentPath);
    }
    return currentPath === path;
  });

  const shouldUseNoLayout = noLayoutRoutes.includes(currentPath);

  let contentToRender = children;

  if (shouldUseDashboardLayout) {
    console.log(`RootLayout: Applying DashboardLayout for path: ${currentPath}`);
    contentToRender = <DashboardLayout>{children}</DashboardLayout>;
  } else if (shouldUseHomeLayout) {
    console.log(`RootLayout: Applying HomeLayout for path: ${currentPath}`);
    contentToRender = <HomeLayout>{children}</HomeLayout>;
  } else if (shouldUseNoLayout) {
    console.log(`RootLayout: Applying NoLayout for path: ${currentPath}`);
    contentToRender = children; // Render children directly without any layout
  } else {
    // Fallback for any routes not explicitly defined, or if there's a mismatch.
    // For now, render children directly.
    console.warn(`RootLayout: No specific layout defined for path: ${currentPath}. Rendering children directly.`);
    contentToRender = children;
  }

  return (
    <StorageProvider>
      <SidebarProvider>
        {contentToRender}
        <div className="fixed bottom-4 right-4 z-50">
          <ThemeToggle />
        </div>
      </SidebarProvider>
    </StorageProvider>
  );
}
