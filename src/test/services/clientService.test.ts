import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient, getClientsForFreelancer, getClientById, updateClient, deleteClient } from '../../services/clientService';
import { TestDataFactory } from '../helpers/testData';
import { createMockSupabaseClient, setupSuccessfulResponse, setupErrorResponse } from '../mocks/supabase';

// Mock the supabase client
vi.mock('../../lib/supabaseClient', () => ({
  supabase: createMockSupabaseClient()
}));

describe('ClientService', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    const { supabase } = await import('../../lib/supabaseClient');
    mockSupabase = supabase;
    vi.clearAllMocks();
  });

  describe('createClient', () => {
    it('should create a client successfully with all fields', async () => {
      const clientData = {
        freelancer_id: '11111111-1111-1111-1111-111111111111',
        company_name: 'Acme Inc',
        email: 'john@acme.com',
        contact_name: 'John Smith',
        address: '456 Business Ave, Commerce City, CC 67890',
        phone: '+1 (555) 987-6543'
      };

      const expectedClient = TestDataFactory.createClient(clientData);
      setupSuccessfulResponse(mockSupabase, expectedClient);

      const result = await createClient(clientData);

      expect(result.data).toEqual(expectedClient);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
      expect(mockSupabase._mocks.insert).toHaveBeenCalledWith({
        freelancer_id: clientData.freelancer_id,
        company_name: clientData.company_name,
        email: clientData.email.toLowerCase(),
        contact_name: clientData.contact_name,
        address: clientData.address,
        phone: clientData.phone,
      });
    });

    it('should create a client with minimal required fields', async () => {
      const clientData = {
        freelancer_id: '11111111-1111-1111-1111-111111111111',
        company_name: 'Minimal Corp',
        email: 'contact@minimal.com'
      };

      const expectedClient = TestDataFactory.createClient({
        ...clientData,
        contact_name: null,
        address: null,
        phone: null
      });
      setupSuccessfulResponse(mockSupabase, expectedClient);

      const result = await createClient(clientData);

      expect(result.data).toEqual(expectedClient);
      expect(result.error).toBeNull();
      expect(mockSupabase._mocks.insert).toHaveBeenCalledWith({
        freelancer_id: clientData.freelancer_id,
        company_name: clientData.company_name,
        email: clientData.email.toLowerCase(),
        contact_name: null,
        address: null,
        phone: null,
      });
    });

    it('should return error for invalid freelancer UUID format', async () => {
      const clientData = {
        freelancer_id: 'invalid-uuid',
        company_name: 'Acme Inc',
        email: 'john@acme.com'
      };

      const result = await createClient(clientData);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid freelancer ID format');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should return error for empty company name', async () => {
      const clientData = {
        freelancer_id: '11111111-1111-1111-1111-111111111111',
        company_name: '   ',
        email: 'john@acme.com'
      };

      const result = await createClient(clientData);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Company name is required');
    });

    it('should return error for invalid email format', async () => {
      const clientData = {
        freelancer_id: '11111111-1111-1111-1111-111111111111',
        company_name: 'Acme Inc',
        email: 'invalid-email'
      };

      const result = await createClient(clientData);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid email format');
    });

    it('should handle foreign key constraint violation', async () => {
      const clientData = {
        freelancer_id: '11111111-1111-1111-1111-111111111111',
        company_name: 'Acme Inc',
        email: 'john@acme.com'
      };

      const dbError = { message: 'Foreign key violation', code: '23503' };
      setupErrorResponse(mockSupabase, dbError);

      const result = await createClient(clientData);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid freelancer ID - freelancer does not exist');
    });

    it('should handle unique constraint violation for email', async () => {
      const clientData = {
        freelancer_id: '11111111-1111-1111-1111-111111111111',
        company_name: 'Acme Inc',
        email: 'john@acme.com'
      };

      const dbError = { message: 'Unique constraint violation', code: '23505' };
      setupErrorResponse(mockSupabase, dbError);

      const result = await createClient(clientData);

      expect(result.data).toBeNull();
      expect(result.error).toBe('A client with this email already exists');
    });
  });

  describe('getClientsForFreelancer', () => {
    it('should retrieve all clients for a freelancer', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      const expectedClients = [
        TestDataFactory.createClient({ freelancer_id: freelancerId }),
        TestDataFactory.createClient({
          id: '33333333-3333-3333-3333-333333333333',
          freelancer_id: freelancerId,
          company_name: 'Globex Corp',
          email: 'sarah@globex.com'
        })
      ];

      mockSupabase._mocks.order.mockResolvedValueOnce({
        data: expectedClients,
        error: null
      });

      const result = await getClientsForFreelancer(freelancerId);

      expect(result.data).toEqual(expectedClients);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('freelancer_id', freelancerId);
      expect(mockSupabase._mocks.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return error for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const result = await getClientsForFreelancer(invalidId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid freelancer ID format');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should return empty array when no clients exist', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';

      mockSupabase._mocks.order.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const result = await getClientsForFreelancer(freelancerId);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('getClientById', () => {
    it('should retrieve a client by valid UUID', async () => {
      const clientId = '22222222-2222-2222-2222-222222222222';
      const expectedClient = TestDataFactory.createClient({ id: clientId });
      setupSuccessfulResponse(mockSupabase, expectedClient);

      const result = await getClientById(clientId);

      expect(result.data).toEqual(expectedClient);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('id', clientId);
    });

    it('should return error for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const result = await getClientById(invalidId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid UUID format');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle client not found', async () => {
      const clientId = '22222222-2222-2222-2222-222222222222';
      const dbError = { message: 'No rows returned', code: 'PGRST116' };
      setupErrorResponse(mockSupabase, dbError);

      const result = await getClientById(clientId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Client not found');
    });
  });

  describe('updateClient', () => {
    it('should update client successfully', async () => {
      const clientId = '22222222-2222-2222-2222-222222222222';
      const updates = {
        company_name: 'Updated Corp',
        phone: '+1 (555) 999-8888'
      };
      const updatedClient = TestDataFactory.createClient({
        id: clientId,
        ...updates
      });

      setupSuccessfulResponse(mockSupabase, updatedClient);

      const result = await updateClient(clientId, updates);

      expect(result.data).toEqual(updatedClient);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
      expect(mockSupabase._mocks.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('id', clientId);
    });

    it('should validate and normalize email updates', async () => {
      const clientId = '22222222-2222-2222-2222-222222222222';
      const updates = {
        email: '  JOHN@ACME.COM  '
      };
      const normalizedUpdates = {
        email: 'john@acme.com'
      };
      const updatedClient = TestDataFactory.createClient({
        id: clientId,
        email: 'john@acme.com'
      });

      setupSuccessfulResponse(mockSupabase, updatedClient);

      const result = await updateClient(clientId, updates);

      expect(result.data).toEqual(updatedClient);
      expect(result.error).toBeNull();
      expect(mockSupabase._mocks.update).toHaveBeenCalledWith(normalizedUpdates);
    });

    it('should return error for invalid email format', async () => {
      const clientId = '22222222-2222-2222-2222-222222222222';
      const updates = {
        email: 'invalid-email'
      };

      const result = await updateClient(clientId, updates);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid email format');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('deleteClient', () => {
    it('should delete client successfully', async () => {
      const clientId = '22222222-2222-2222-2222-222222222222';
      
      mockSupabase._mocks.eq.mockResolvedValueOnce({ error: null });

      const result = await deleteClient(clientId);

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
      expect(mockSupabase._mocks.delete).toHaveBeenCalled();
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('id', clientId);
    });

    it('should return error for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const result = await deleteClient(invalidId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid UUID format');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      const clientId = '22222222-2222-2222-2222-222222222222';
      const dbError = { message: 'Foreign key constraint violation', code: '23503' };
      
      mockSupabase._mocks.eq.mockResolvedValueOnce({ error: dbError });

      const result = await deleteClient(clientId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Foreign key constraint violation');
    });
  });
});