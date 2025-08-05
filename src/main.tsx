import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "sonner"
import App from "./App"
import { AuthProvider } from "./contexts/auth-context"
import { ThemeProvider } from "./components/theme-provider"
import { CartProvider } from "./contexts/cart-context"
import { useEffect } from "react";
import "./styles/global.css"

// 1. Import the toolbar
import { initToolbar } from '@stagewise/toolbar';

// 2. Define your toolbar configuration
const stagewiseConfig = {
  plugins: [],
};

// 3. Initialize the toolbar when your app starts
// Framework-agnostic approach - call this when your app initializes
function setupStagewise() {
  // Only initialize once and only in development mode
  if (process.env.NODE_ENV === 'development') {
    initToolbar(stagewiseConfig);
  }
}

// Call the setup function when appropriate for your framework
setupStagewise();

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
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <AuthProvider>
            <CartProvider>
              <App />
              <Toaster richColors position="bottom-right" />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
