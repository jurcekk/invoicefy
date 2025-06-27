import { supabase } from './supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

// Service response type for consistent error handling
export interface AuthResponse<T = any> {
  data: T | null;
  error: string | null;
}

/**
 * Sign up a new user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with user data and error
 */
export async function signUp(email: string, password: string): Promise<AuthResponse<User>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Sign up error:', error);
      return {
        data: null,
        error: error.message || 'Failed to sign up'
      };
    }

    return {
      data: data.user,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error during sign up:', err);
    return {
      data: null,
      error: 'An unexpected error occurred during sign up'
    };
  }
}

/**
 * Sign in an existing user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with user data and error
 */
export async function signIn(email: string, password: string): Promise<AuthResponse<User>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return {
        data: null,
        error: error.message || 'Failed to sign in'
      };
    }

    return {
      data: data.user,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error during sign in:', err);
    return {
      data: null,
      error: 'An unexpected error occurred during sign in'
    };
  }
}

/**
 * Sign out the current user
 * @returns Promise with success status and error
 */
export async function signOut(): Promise<AuthResponse<boolean>> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return {
        data: null,
        error: error.message || 'Failed to sign out'
      };
    }

    return {
      data: true,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error during sign out:', err);
    return {
      data: null,
      error: 'An unexpected error occurred during sign out'
    };
  }
}

/**
 * Get the current user session
 * @returns Promise with session data and error, or null if no session
 */
export async function getSession(): Promise<AuthResponse<Session> | null> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Get session error:', error);
      return {
        data: null,
        error: error.message || 'Failed to get session'
      };
    }

    // Return null if no session exists (user not authenticated)
    if (!data.session) {
      return null;
    }

    return {
      data: data.session,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error getting session:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while getting session'
    };
  }
}

/**
 * Get the current authenticated user
 * @returns Promise with user data and error, or null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthResponse<User> | null> {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Get user error:', error);
      return {
        data: null,
        error: error.message || 'Failed to get user'
      };
    }

    // Return null if no user exists (not authenticated)
    if (!data.user) {
      return null;
    }

    return {
      data: data.user,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error getting user:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while getting user'
    };
  }
}

/**
 * Listen for authentication state changes
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  
  // Return unsubscribe function
  return () => subscription.unsubscribe();
}

/**
 * Reset password for a user
 * @param email - User's email address
 * @returns Promise with success status and error
 */
export async function resetPassword(email: string): Promise<AuthResponse<boolean>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Reset password error:', error);
      return {
        data: null,
        error: error.message || 'Failed to send reset password email'
      };
    }

    return {
      data: true,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error during password reset:', err);
    return {
      data: null,
      error: 'An unexpected error occurred during password reset'
    };
  }
}

/**
 * Update user password
 * @param password - New password
 * @returns Promise with user data and error
 */
export async function updatePassword(password: string): Promise<AuthResponse<User>> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error('Update password error:', error);
      return {
        data: null,
        error: error.message || 'Failed to update password'
      };
    }

    return {
      data: data.user,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error updating password:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while updating password'
    };
  }
}