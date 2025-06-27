import React from 'react';
import { useStore } from './store/useStore';
import { Layout } from './components/shared/Layout';
import { InvoicesPage } from './pages/InvoicesPage';
import { ClientsPage } from './pages/ClientsPage';
import { Settings } from './components/settings/Settings';

function App() {
  const { activeTab } = useStore();

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

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
}

export default App;