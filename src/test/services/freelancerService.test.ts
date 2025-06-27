import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFreelancer, getFreelancerById, getAllFreelancers, updateFreelancer, deleteFreelancer } from '../../services/freelancerService';
import { TestDataFactory } from '../helpers/testData';
import { createMockSupabaseClient, setupSuccessfulResponse, setupErrorResponse } from '../mocks/supabase';

// Mock the supabase client
vi.mock('../../lib/supabaseClient', () => ({
  supabase: createMockSupabaseClient()
}));

describe('FreelancerService', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    // Get the mocked supabase client
    const { supabase } = await import('../../lib/supabaseClient');
    mockSupabase = supabase;
    vi.clearAllMocks();
  });

  describe('createFreelancer', () => {
    it('should create a freelancer successfully', async () => {
      const freelancerData = {
        name: 'Jane Dev',
        email: 'jane@janedev.com',
        address: '123 Freelance Ln, Tech City, TC 12345',
        phone: '+1 (555) 123-4567',
        website: 'https://janedev.com'
      };

      const expectedFreelancer = TestDataFactory.createFreelancer(freelancerData);
      setupSuccessfulResponse(mockSupabase, expectedFreelancer);

      const result = await createFreelancer(freelancerData);

      expect(result.data).toEqual(expectedFreelancer);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('freelancers');
      expect(mockSupabase._mocks.insert).toHaveBeenCalledWith({
        name: freelancerData.name,
        address: freelancerData.address,
        email: freelancerData.email,
        phone: freelancerData.phone,
        website: freelancerData.website,
      });
    });

    it('should create a freelancer with minimal data', async () => {
      const freelancerData = {
        name: 'John Doe',
        email: 'john@example.com',
        address: '456 Main St, City, State 12345'
      };

      const expectedFreelancer = TestDataFactory.createFreelancer({
        ...freelancerData,
        phone: null,
        website: null
      });
      setupSuccessfulResponse(mockSupabase, expectedFreelancer);

      const result = await createFreelancer(freelancerData);

      expect(result.data).toEqual(expectedFreelancer);
      expect(result.error).toBeNull();
      expect(mockSupabase._mocks.insert).toHaveBeenCalledWith({
        name: freelancerData.name,
        address: freelancerData.address,
        email: freelancerData.email,
        phone: null,
        website: null,
      });
    });

    it('should handle database errors', async () => {
      const freelancerData = {
        name: 'Jane Dev',
        email: 'jane@janedev.com',
        address: '123 Freelance Ln, Tech City, TC 12345'
      };

      const dbError = { message: 'Database connection failed', code: '08000' };
      setupErrorResponse(mockSupabase, dbError);

      const result = await createFreelancer(freelancerData);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database connection failed');
    });

    it('should handle unique constraint violations', async () => {
      const freelancerData = {
        name: 'Jane Dev',
        email: 'jane@janedev.com',
        address: '123 Freelance Ln, Tech City, TC 12345'
      };

      const dbError = { message: 'duplicate key value violates unique constraint', code: '23505' };
      setupErrorResponse(mockSupabase, dbError);

      const result = await createFreelancer(freelancerData);

      expect(result.data).toBeNull();
      expect(result.error).toBe('duplicate key value violates unique constraint');
    });
  });

  describe('getFreelancerById', () => {
    it('should retrieve a freelancer by valid UUID', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      const expectedFreelancer = TestDataFactory.createFreelancer({ id: freelancerId });
      setupSuccessfulResponse(mockSupabase, expectedFreelancer);

      const result = await getFreelancerById(freelancerId);

      expect(result.data).toEqual(expectedFreelancer);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('freelancers');
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('id', freelancerId);
    });

    it('should return error for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const result = await getFreelancerById(invalidId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid UUID format');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle freelancer not found', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      const dbError = { message: 'No rows returned', code: 'PGRST116' };
      setupErrorResponse(mockSupabase, dbError);

      const result = await getFreelancerById(freelancerId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Freelancer not found');
    });

    it('should handle database errors', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      const dbError = { message: 'Database connection failed', code: '08000' };
      setupErrorResponse(mockSupabase, dbError);

      const result = await getFreelancerById(freelancerId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('getAllFreelancers', () => {
    it('should retrieve all freelancers', async () => {
      const expectedFreelancers = [
        TestDataFactory.createFreelancer(),
        TestDataFactory.createFreelancer({
          id: '22222222-2222-2222-2222-222222222222',
          name: 'John Smith',
          email: 'john@example.com'
        })
      ];

      // Mock the order method to return the data
      mockSupabase._mocks.order.mockResolvedValueOnce({ 
        data: expectedFreelancers, 
        error: null 
      });

      const result = await getAllFreelancers();

      expect(result.data).toEqual(expectedFreelancers);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('freelancers');
      expect(mockSupabase._mocks.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when no freelancers exist', async () => {
      mockSupabase._mocks.order.mockResolvedValueOnce({ 
        data: [], 
        error: null 
      });

      const result = await getAllFreelancers();

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = { message: 'Database connection failed', code: '08000' };
      mockSupabase._mocks.order.mockResolvedValueOnce({ 
        data: null, 
        error: dbError 
      });

      const result = await getAllFreelancers();

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('updateFreelancer', () => {
    it('should update freelancer successfully', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      const updates = {
        name: 'Jane Smith',
        phone: '+1 (555) 999-8888'
      };
      const updatedFreelancer = TestDataFactory.createFreelancer({
        id: freelancerId,
        ...updates
      });

      setupSuccessfulResponse(mockSupabase, updatedFreelancer);

      const result = await updateFreelancer(freelancerId, updates);

      expect(result.data).toEqual(updatedFreelancer);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('freelancers');
      expect(mockSupabase._mocks.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('id', freelancerId);
    });

    it('should return error for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';
      const updates = { name: 'Jane Smith' };

      const result = await updateFreelancer(invalidId, updates);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid UUID format');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle freelancer not found', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      const updates = { name: 'Jane Smith' };
      const dbError = { message: 'No rows returned', code: 'PGRST116' };
      setupErrorResponse(mockSupabase, dbError);

      const result = await updateFreelancer(freelancerId, updates);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Freelancer not found');
    });
  });

  describe('deleteFreelancer', () => {
    it('should delete freelancer successfully', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      
      // Mock delete operation
      mockSupabase._mocks.eq.mockResolvedValueOnce({ error: null });

      const result = await deleteFreelancer(freelancerId);

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('freelancers');
      expect(mockSupabase._mocks.delete).toHaveBeenCalled();
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('id', freelancerId);
    });

    it('should return error for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const result = await deleteFreelancer(invalidId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid UUID format');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      const dbError = { message: 'Foreign key constraint violation', code: '23503' };
      
      mockSupabase._mocks.eq.mockResolvedValueOnce({ error: dbError });

      const result = await deleteFreelancer(freelancerId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Foreign key constraint violation');
    });
  });
});