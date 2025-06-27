import React, { useState } from 'react';
import { ClientForm } from '../components/client/ClientForm';
import { ClientList } from '../components/client/ClientList';
import { Plus, List } from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'list' | 'create'>('list');

  return (
    <div>
      {/* View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveView('list')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeView === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4 mr-2" />
            All Clients
          </button>
          <button
            onClick={() => setActiveView('create')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeView === 'create'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'list' ? (
        <ClientList />
      ) : (
        <ClientForm onSave={() => setActiveView('list')} />
      )}
    </div>
  );
};