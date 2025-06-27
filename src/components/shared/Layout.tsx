import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useAuth } from '../auth/AuthProvider';
import { FileText, Users, Settings, Download, Upload, LogOut } from 'lucide-react';
import { storageService } from '../../services/storage';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { 
    activeTab, 
    setActiveTab, 
    freelancer, 
    initializeApp,
    isInitialized 
  } = useStore();
  
  const { user, signOut } = useAuth();

  // Load data when freelancer is set and app is initialized
  useEffect(() => {
    if (freelancer && isInitialized && user) {
      // Load clients and invoices for the current freelancer
      const store = useStore.getState();
      store.loadClients(freelancer.id);
      store.loadInvoices(freelancer.id);
    }
  }, [freelancer, isInitialized, user]);

  const tabs = [
    { id: 'invoices' as const, label: 'Invoices', icon: FileText },
    { id: 'clients' as const, label: 'Clients', icon: Users },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  const handleExport = () => {
    const data = storageService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target?.result as string;
          if (storageService.importData(data)) {
            // Reinitialize the app after import
            initializeApp();
          } else {
            alert('Error importing data. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">InvoicePro</h1>
              </div>
              {freelancer && (
                <span className="text-sm text-gray-600">Welcome, {freelancer.name}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {user && (
                <span className="text-sm text-gray-600 mr-4">{user.email}</span>
              )}
              
              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export
              </button>
              <button
                onClick={handleImport}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <Upload className="w-4 h-4 mr-1.5" />
                Import
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};