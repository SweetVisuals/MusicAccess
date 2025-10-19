import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Dashboard from "@/app/dashboard/dashboard"
import Homepage from "@/app/home/homepage"
import LoginPage from "@/app/auth/login"
import SignupPage from "@/app/auth/signup"
import AuthCallback from "@/app/auth/callback"
import UserProfileDynamicPage from "@/app/user/[username]/page"
import ServicesPage from "@/app/dashboard/services"
import BillingPage from "@/app/dashboard/billing"
import AnalyticsPage from "@/app/dashboard/analytics"
import ProjectsPage from "@/app/dashboard/projects"
import ContractsPage from "@/app/dashboard/contracts"
import OrdersPage from "@/app/dashboard/orders"
import SalesPage from "@/app/dashboard/sales"
import WalletPage from "@/app/dashboard/wallet"
import SettingsPage from "@/app/dashboard/settings"
import FindTalentPage from "@/app/home/find-talent"
import BrowseTalentPage from "@/app/browse/page"
import TutorialsPage from "@/app/home/tutorials"
import MarketingPage from "@/app/home/marketing"
import CollaboratePage from "@/app/home/collaborate"
import BeatsInstrumentalsPage from "@/app/home/beats-instrumentals"
import VocalProductionPage from "@/app/home/vocal-production"
import MixingMasteringPage from "@/app/home/mixing-mastering"
import SoundPacksPage from "@/app/home/sound-packs"
import LibraryPage from "@/app/home/library"
import CheckoutPage from "@/app/checkout/checkout"
import OrderHistoryPage from "@/app/orders/order-history"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { UploadDialog } from "@/components/profile/UploadDialog"
import UploadWizard from "@/app/upload/upload-wizard"
import FilesPage from "@/app/files/files"
import MessagesPage from "@/app/messages/messages"
import ViewPage from "@/app/view/[projectId]/page"
import SearchPage from "@/app/search/page"
import GetHelpPage from "@/app/get-help/page"
import NotesPage from "@/app/notes/page" // Import NotesPage
import StudioPage from "@/app/dashboard/studio/page" // Import StudioPage
import { HomeLayout } from "@/components/layout/HomeLayout"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { RootLayout } from "@/components/layout/RootLayout";
import { TransitionWrapper } from "@/components/layout/TransitionWrapper";
import { GemsDialogProvider } from "@/contexts/gems-dialog-context";
import { MessagingProvider } from "@/contexts/messaging-context";
import { NotesProvider } from "@/contexts/notes-context";

function App() {
   const { user } = useAuth();
   const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
   const location = useLocation();

  // Add global error handler for unhandled errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[App] Global error caught:', event.error);
      console.error('[App] Error stack:', event.error?.stack);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[App] Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <GemsDialogProvider>
      <MessagingProvider>
        <NotesProvider>
          <RootLayout>
        <UploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onUpload={async (files) => {
          }}
        />
        <Routes location={location} key={location.key}>
        <Route path="/" element={<Homepage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing"
            element={
              <ProtectedRoute>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/analytics"
            element={
              <DashboardLayout>
                <AnalyticsPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/dashboard/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/contracts"
            element={
              <ProtectedRoute>
                <ContractsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/history"
            element={<OrderHistoryPage />}
          />
          <Route
            path="/dashboard/sales"
            element={
              <ProtectedRoute>
                <SalesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/wallet"
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth/login"
            element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route
            path="/auth/signup"
            element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />}
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/user/:username"
            element={<UserProfileDynamicPage />}
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <FilesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/services"
            element={
              <ProtectedRoute>
                <ServicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <NotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/studio"
            element={
              <ProtectedRoute>
                <StudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/studio"
            element={
              <ProtectedRoute>
                <StudioPage />
              </ProtectedRoute>
            }
          />
          <Route path="/browse" element={<BrowseTalentPage />} />
          <Route path="/tutorials" element={<TutorialsPage />} />
          <Route path="/marketing" element={<MarketingPage />} />
          <Route path="/collaborate" element={<CollaboratePage />} />
          <Route path="/home/beats-instrumentals" element={<BeatsInstrumentalsPage />} />
          <Route path="/home/vocal-production" element={<VocalProductionPage />} />
          <Route path="/home/mixing-mastering" element={<MixingMasteringPage />} />
          <Route path="/home/sound-packs" element={<SoundPacksPage />} />
          <Route path="/home/library" element={<LibraryPage />} />
          <Route path="/following" element={<CollaboratePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/view/:projectId" element={<ViewPage />} />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/get-help"
            element={
              <ProtectedRoute>
                <GetHelpPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </RootLayout>
        </NotesProvider>
      </MessagingProvider>
    </GemsDialogProvider>
  );
}

export default App;
