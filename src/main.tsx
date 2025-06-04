import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "sonner"
import App from "./App"
import { AuthProvider } from "./contexts/auth-context"
import { ThemeProvider } from "./components/theme-provider"
import "./styles/global.css"
import "./styles/themes/light.css"
import "./styles/themes/dark.css"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <App />
          <Toaster richColors position="bottom-right" />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)