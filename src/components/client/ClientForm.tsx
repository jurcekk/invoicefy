import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Save, Plus, AlertCircle } from 'lucide-react';

interface ClientFormProps {
  onSave?: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ onSave }) => {
  const { 
    addClient, 
    isLoadingClients, 
    clientError, 
    clearClientError 
  } = useStore();
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    address: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addClient({
      companyName: formData.companyName,
      contactName: formData.contactName || undefined,
      email: formData.email,
      address: formData.address || undefined,
      phone: formData.phone || undefined,
    });

    // Check if there was an error
    if (!clientError) {
      // Reset form on success
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        address: '',
        phone: '',
      });

      onSave?.();
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (clientError) {
      clearClientError();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Add New Client</h3>
      </div>

      {/* Error Message */}
      {clientError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{clientError}</p>
            <button
              onClick={clearClientError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name
            </label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Street address, city, state, zip code"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoadingClients}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingClients ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};