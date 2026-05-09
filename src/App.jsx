import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SimulatorNfcPanel from '@/components/simulator/SimulatorNfcPanel';
import { isSimulatorMode } from '@/lib/simulator/runtime';
// Add page imports here
import Home from './pages/Home';
import ConsumerPage from './pages/ConsumerPage';
import ShopPage from './pages/ShopPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import KeychainSellPage from './pages/KeychainSellPage';
import KeychainOnboardingPage from './pages/KeychainOnboardingPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/consumer" element={<ConsumerPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/keychains" element={<KeychainSellPage />} />
      <Route path="/keychains/success" element={<KeychainOnboardingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
          {isSimulatorMode && <SimulatorNfcPanel />}
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
