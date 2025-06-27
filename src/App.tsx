import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { useAuth, AuthProvider } from './components/auth/AuthProvider';
import { AuthForm } from './components/auth/AuthForm';
import { Layout } from './components/shared/Layout';
import { InvoicesPage } from './pages/InvoicesPage';
import { ClientsPage } from './pages/ClientsPage';
import { Settings } from './components/settings/Settings';
import { Loader, AlertCircle } from 'lucide-react';

function AppContent() {
  const { 
    activeTab, 
    isInitialized, 
    isLoading, 
    error, 
    initializeApp, 
    clearError 
  } = useStore();
  
  const { user, loading: authLoading } = useAuth();

  // Initialize app when user is authenticated
  useEffect(() => {
    if (user && !isInitialized) {
      initializeApp();
    }
  }, [user, isInitialized, initializeApp]);

  const renderContent = () => {
    switch (activeTab) {
      case 'invoices':
        return <InvoicesPage />;
      case 'clients':
        return <ClientsPage />;
      case 'settings':
        return <Settings />;
      default:
        return <InvoicesPage />;
    }
  };

  // Show loading screen during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!user) {
    return <AuthForm />;
  }

  // Show loading screen during app initialization
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading InvoicePro</h2>
          <p className="text-gray-600">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  // Show error screen if initialization failed
  if (error && !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              clearError();
              initializeApp();
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;