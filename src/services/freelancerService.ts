import { supabase } from '../lib/supabaseClient';
import { getSession } from './authService';
import type { Database } from '../lib/database.types';

// Type definitions for better TypeScript support
type FreelancerRow = Database['public']['Tables']['freelancers']['Row'];
type FreelancerInsert = Database['public']['Tables']['freelancers']['Insert'];

// Service response types
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Creates a new freelancer in the database
 * @param freelancerData - Object containing name and address
 * @returns Promise with data and error
 */
export async function createFreelancer(freelancerData: {
  name: string;
  address: string;
  email: string;
  phone?: string;
  website?: string;
}): Promise<ServiceResponse<FreelancerRow>> {
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

    const { data, error } = await supabase
      .from('freelancers')
      .insert({
        name: freelancerData.name,
        address: freelancerData.address,
        email: freelancerData.email,
        phone: freelancerData.phone || null,
        website: freelancerData.website || null,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating freelancer:', error);
      return {
        data: null,
        error: error.message || 'Failed to create freelancer'
      };
    }

    return {
      data,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error creating freelancer:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the freelancer'
    };
  }
}

/**
 * Retrieves a freelancer by their UUID
 * @param id - The UUID of the freelancer
 * @returns Promise with data and error
 */
export async function getFreelancerById(id: string): Promise<ServiceResponse<FreelancerRow>> {
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
      .from('freelancers')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching freelancer:', error);
      
      // Handle specific error cases
      if (error.code === 'PGRST116') {
        return {
          data: null,
          error: 'Freelancer not found'
        };
      }
      
      return {
        data: null,
        error: error.message || 'Failed to fetch freelancer'
      };
    }

    return {
      data,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error fetching freelancer:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the freelancer'
    };
  }
}

/**
 * Gets all freelancers for the current user
 * @returns Promise with array of freelancers and error
 */
export async function getAllFreelancers(): Promise<ServiceResponse<FreelancerRow[]>> {
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

    const { data, error } = await supabase
      .from('freelancers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching freelancers:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch freelancers'
      };
    }

    return {
      data: data || [],
      error: null
    };
  } catch (err) {
    console.error('Unexpected error fetching freelancers:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching freelancers'
    };
  }
}

/**
 * Updates a freelancer's information
 * @param id - The UUID of the freelancer
 * @param updates - Object containing fields to update
 * @returns Promise with updated data and error
 */
export async function updateFreelancer(
  id: string,
  updates: Partial<Omit<FreelancerInsert, 'id' | 'created_at' | 'user_id'>>
): Promise<ServiceResponse<FreelancerRow>> {
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
      .from('freelancers')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating freelancer:', error);
      
      if (error.code === 'PGRST116') {
        return {
          data: null,
          error: 'Freelancer not found'
        };
      }
      
      return {
        data: null,
        error: error.message || 'Failed to update freelancer'
      };
    }

    return {
      data,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error updating freelancer:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the freelancer'
    };
  }
}

/**
 * Deletes a freelancer by their UUID
 * @param id - The UUID of the freelancer
 * @returns Promise with success status and error
 */
export async function deleteFreelancer(id: string): Promise<ServiceResponse<boolean>> {
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
      .from('freelancers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting freelancer:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete freelancer'
      };
    }

    return {
      data: true,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error deleting freelancer:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the freelancer'
    };
  }
}