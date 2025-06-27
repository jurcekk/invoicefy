import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useAuth } from '../auth/AuthProvider';
import { FreelancerInfo } from '../../types';
import { Save, User, AlertCircle, Loader } from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    freelancer, 
    setFreelancer, 
    isLoading, 
    error, 
    clearError 
  } = useStore();
  
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    website: '',
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(true);
  
  // Track the current user to detect user changes
  const previousUserRef = useRef<string | null>(null);

  // Load freelancer data into form when component mounts or freelancer changes
  useEffect(() => {
    if (freelancer) {
      setFormData({
        name: freelancer.name || '',
        email: freelancer.email || '',
        address: freelancer.address || '',
        phone: freelancer.phone || '',
        website: freelancer.website || '',
      });
      setIsFormLoading(false);
    } else {
      // If no freelancer data, still show empty form
      setFormData({
        name: '',
        email: '',
        address: '',
        phone: '',
        website: '',
      });
      setIsFormLoading(false);
    }
  }, [freelancer]);

  // Handle user switching (different from initial load)
  useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = previousUserRef.current;
    
    // Only reset if this is a user switch (not initial load)
    if (previousUserId && previousUserId !== currentUserId) {
      // User has changed - reset form and clear states
      setIsFormLoading(true);
      setFormData({
        name: '',
        email: '',
        address: '',
        phone: '',
        website: '',
      });
      setShowSuccess(false);
      clearError();
    }
    
    // Update the ref to track current user
    previousUserRef.current = currentUserId;
  }, [user?.id, clearError]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const freelancerData: FreelancerInfo = {
      id: freelancer?.id || '',
      name: formData.name,
      email: formData.email,
      address: formData.address,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
    };

    await setFreelancer(freelancerData);
    
    // Show success message if no error
    if (!error) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
    // Clear success message when user starts editing
    if (showSuccess) {
      setShowSuccess(false);
    }
  };

  // Show loading state while form data is being loaded
  if (isFormLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Loader className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <User className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Freelancer Information</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            This information will appear on your invoices
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-5 h-5 text-green-600 mr-2">✓</div>
              <p className="text-green-800">Settings saved successfully!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
              <button
                onClick={clearError}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Profile Status */}
        {!freelancer && (
          <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <p className="text-blue-800">
                Complete your profile to start creating invoices
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your full name"
                required
              />
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
                placeholder="Enter your email address"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Street address, city, state, zip code"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {freelancer ? 'Update Profile' : 'Create Profile'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Profile Preview */}
      {freelancer && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Profile Preview</h3>
            <p className="text-sm text-gray-600 mt-1">
              This is how your information will appear on invoices
            </p>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{freelancer.name}</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{freelancer.email}</p>
                <p className="whitespace-pre-line">{freelancer.address}</p>
                {freelancer.phone && <p>{freelancer.phone}</p>}
                {freelancer.website && (
                  <p>
                    <a 
                      href={freelancer.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {freelancer.website}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};