import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "@/components/@/ui/sonner"
import App from "./App"
import { AuthProvider } from "./contexts/auth-context"
import { GemsBalanceProvider } from "./contexts/gems-balance-context"
import { ThemeProvider } from "./components/theme-provider"
import { CartProvider } from "./contexts/cart-context"
import { StorageProvider } from "./contexts/storage-context"; // Import StorageProvider
import { SidebarProvider } from "./components/@/ui/sidebar"; // Import SidebarProvider
import { AudioPlayerProvider } from "./contexts/audio-player-context"; // Import AudioPlayerProvider
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary"; // Import GlobalErrorBoundary
import { useEffect } from "react";
import "./styles/global.css"


function Root() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Only log if the target is not part of a ShadCN ContextMenuTrigger
      if (!(e.target as HTMLElement).closest('[data-radix-collection-item][data-state="open"]')) {
        console.log("Global right-click detected on document", e.target);
      }
      // Do NOT prevent default here, let the ContextMenu component handle it
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <GemsBalanceProvider>
            <CartProvider>
            <StorageProvider>
              <SidebarProvider>
                <AudioPlayerProvider>
                  <GlobalErrorBoundary>
                    <App />
                  </GlobalErrorBoundary>
                  <Toaster />
                </AudioPlayerProvider>
              </SidebarProvider>
            </StorageProvider>
            </CartProvider>
          </GemsBalanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
