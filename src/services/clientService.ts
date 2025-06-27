import { supabase } from '../lib/supabaseClient';
import { getSession } from './authService';
import type { Database } from '../lib/database.types';

// Type definitions for better TypeScript support
type ClientRow = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];

// Service response types
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Creates a new client in the database
 * @param clientData - Object containing freelancer_id, company_name, and email
 * @returns Promise with data and error
 */
export async function createClient(clientData: {
  freelancer_id: string;
  company_name: string;
  email: string;
  contact_name?: string;
  address?: string;
  phone?: string;
}): Promise<ServiceResponse<ClientRow>> {
  try {
    // Get current user session
    const sessionResult = await getSession();
    if (!sessionResult || !sessionResult.data) {
      return {
        data: null,
        error: 'Authentication required'
      };
    }

    const userId = sessionResult.data.user.id;

    // Validate UUID format for freelancer_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientData.freelancer_id)) {
      return {
        data: null,
        error: 'Invalid freelancer ID format'
      };
    }

    // Validate required fields
    if (!clientData.company_name.trim()) {
      return {
        data: null,
        error: 'Company name is required'
      };
    }

    if (!clientData.email.trim()) {
      return {
        data: null,
        error: 'Email is required'
      };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email)) {
      return {
        data: null,
        error: 'Invalid email format'
      };
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        freelancer_id: clientData.freelancer_id,
        company_name: clientData.company_name.trim(),
        email: clientData.email.trim().toLowerCase(),
        contact_name: clientData.contact_name?.trim() || null,
        address: clientData.address?.trim() || null,
        phone: clientData.phone?.trim() || null,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      
      // Handle specific error cases
      if (error.code === '23503') {
        return {
          data: null,
          error: 'Invalid freelancer ID - freelancer does not exist'
        };
      }
      
      if (error.code === '23505') {
        return {
          data: null,
          error: 'A client with this email already exists'
        };
      }
      
      return {
        data: null,
        error: error.message || 'Failed to create client'
      };
    }

    return {
      data,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error creating client:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the client'
    };
  }
}

/**
 * Retrieves all clients for a specific freelancer
 * @param freelancer_id - The UUID of the freelancer
 * @returns Promise with array of clients and error
 */
export async function getClientsForFreelancer(freelancer_id: string): Promise<ServiceResponse<ClientRow[]>> {
  try {
    // Get current user session
    const sessionResult = await getSession();
    if (!sessionResult || !sessionResult.data) {
      return {
        data: null,
        error: 'Authentication required'
      };
    }

    const userId = sessionResult.data.user.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(freelancer_id)) {
      return {
        data: null,
        error: 'Invalid freelancer ID format'
      };
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('freelancer_id', freelancer_id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch clients'
      };
    }

    return {
      data: data || [],
      error: null
    };
  } catch (err) {
    console.error('Unexpected error fetching clients:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching clients'
    };
  }
}

/**
 * Retrieves a single client by their UUID
 * @param id - The UUID of the client
 * @returns Promise with client data and error
 */
export async function getClientById(id: string): Promise<ServiceResponse<ClientRow>> {
  try {
    // Get current user session
    const sessionResult = await getSession();
    if (!sessionResult || !sessionResult.data) {
      return {
        data: null,
        error: 'Authentication required'
      };
    }

    const userId = sessionResult.data.user.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        data: null,
        error: 'Invalid UUID format'
      };
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching client:', error);
      
      if (error.code === 'PGRST116') {
        return {
          data: null,
          error: 'Client not found'
        };
      }
      
      return {
        data: null,
        error: error.message || 'Failed to fetch client'
      };
    }

    return {
      data,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error fetching client:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the client'
    };
  }
}

/**
 * Updates a client's information
 * @param id - The UUID of the client
 * @param updates - Object containing fields to update
 * @returns Promise with updated data and error
 */
export async function updateClient(
  id: string,
  updates: Partial<Omit<ClientInsert, 'id' | 'created_at' | 'freelancer_id' | 'user_id'>>
): Promise<ServiceResponse<ClientRow>> {
  try {
    // Get current user session
    const sessionResult = await getSession();
    if (!sessionResult || !sessionResult.data) {
      return {
        data: null,
        error: 'Authentication required'
      };
    }

    const userId = sessionResult.data.user.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        data: null,
        error: 'Invalid UUID format'
      };
    }

    // Validate email if provided
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return {
          data: null,
          error: 'Invalid email format'
        };
      }
      updates.email = updates.email.trim().toLowerCase();
    }

    // Trim string fields
    if (updates.company_name) {
      updates.company_name = updates.company_name.trim();
    }
    if (updates.contact_name) {
      updates.contact_name = updates.contact_name.trim();
    }
    if (updates.address) {
      updates.address = updates.address.trim();
    }
    if (updates.phone) {
      updates.phone = updates.phone.trim();
    }

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      
      if (error.code === 'PGRST116') {
        return {
          data: null,
          error: 'Client not found'
        };
      }
      
      if (error.code === '23505') {
        return {
          data: null,
          error: 'A client with this email already exists'
        };
      }
      
      return {
        data: null,
        error: error.message || 'Failed to update client'
      };
    }

    return {
      data,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error updating client:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the client'
    };
  }
}

/**
 * Deletes a client by their UUID
 * @param id - The UUID of the client
 * @returns Promise with success status and error
 */
export async function deleteClient(id: string): Promise<ServiceResponse<boolean>> {
  try {
    // Get current user session
    const sessionResult = await getSession();
    if (!sessionResult || !sessionResult.data) {
      return {
        data: null,
        error: 'Authentication required'
      };
    }

    const userId = sessionResult.data.user.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        data: null,
        error: 'Invalid UUID format'
      };
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting client:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete client'
      };
    }

    return {
      data: true,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error deleting client:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the client'
    };
  }
}

/**
 * Gets clients with their associated freelancer information
 * @param freelancer_id - The UUID of the freelancer
 * @returns Promise with clients including freelancer data and error
 */
export async function getClientsWithFreelancer(freelancer_id: string): Promise<ServiceResponse<(ClientRow & { freelancer: any })[]>> {
  try {
    // Get current user session
    const sessionResult = await getSession();
    if (!sessionResult || !sessionResult.data) {
      return {
        data: null,
        error: 'Authentication required'
      };
    }

    const userId = sessionResult.data.user.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(freelancer_id)) {
      return {
        data: null,
        error: 'Invalid freelancer ID format'
      };
    }

    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        freelancer:freelancers(*)
      `)
      .eq('freelancer_id', freelancer_id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients with freelancer:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch clients with freelancer information'
      };
    }

    return {
      data: data || [],
      error: null
    };
  } catch (err) {
    console.error('Unexpected error fetching clients with freelancer:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching clients with freelancer information'
    };
  }
}