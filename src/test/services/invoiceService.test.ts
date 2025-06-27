import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createInvoice, 
  getInvoicesForFreelancer, 
  getInvoiceWithItems, 
  getNextInvoiceNumber,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats
} from '../../services/invoiceService';
import { TestDataFactory } from '../helpers/testData';
import { createMockSupabaseClient, setupSuccessfulResponse, setupErrorResponse, setupCountResponse } from '../mocks/supabase';

// Mock the supabase client
vi.mock('../../lib/supabaseClient', () => ({
  supabase: createMockSupabaseClient()
}));

describe('InvoiceService', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    const { supabase } = await import('../../lib/supabaseClient');
    mockSupabase = supabase;
    vi.clearAllMocks();
  });

  describe('getNextInvoiceNumber', () => {
    it('should generate first invoice number for new freelancer', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      
      setupCountResponse(mockSupabase, 0);

      const result = await getNextInvoiceNumber(freelancerId);

      expect(result.data).toBe('INV-001');
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('invoices');
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('freelancer_id', freelancerId);
    });

    it('should generate sequential invoice numbers', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      
      setupCountResponse(mockSupabase, 5);

      const result = await getNextInvoiceNumber(freelancerId);

      expect(result.data).toBe('INV-006');
      expect(result.error).toBeNull();
    });

    it('should return error for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const result = await getNextInvoiceNumber(invalidId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid freelancer ID format');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      const dbError = { message: 'Database connection failed', code: '08000' };
      
      mockSupabase._mocks.eq.mockResolvedValueOnce({ count: null, error: dbError });

      const result = await getNextInvoiceNumber(freelancerId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('createInvoice', () => {
    it('should create invoice with auto-generated number', async () => {
      const invoiceData = {
        freelancer_id: '11111111-1111-1111-1111-111111111111',
        client_id: '22222222-2222-2222-2222-222222222222',
        date_issued: '2024-01-15',
        due_date: '2024-02-14',
        subtotal: 2500.00,
        tax_rate: 20.00,
        tax_amount: 500.00,
        total: 3000.00,
        status: 'draft' as const,
        notes: 'Test invoice'
      };

      const items = [
        {
          description: 'Web Development',
          quantity: 1,
          rate: 2500.00,
          amount: 2500.00
        }
      ];

      // Mock invoice number generation
      setupCountResponse(mockSupabase, 0);
      
      // Mock freelancer and client validation
      const mockFreelancer = TestDataFactory.createFreelancer();
      const mockClient = TestDataFactory.createClient();
      
      // Setup multiple mock responses for validation queries
      mockSupabase._mocks.single
        .mockResolvedValueOnce({ data: mockFreelancer, error: null }) // freelancer check
        .mockResolvedValueOnce({ data: mockClient, error: null }); // client check

      // Mock invoice creation
      const createdInvoice = TestDataFactory.createInvoice({
        ...invoiceData,
        invoice_number: 'INV-001'
      });
      
      mockSupabase._mocks.single.mockResolvedValueOnce({ 
        data: createdInvoice, 
        error: null 
      });

      // Mock items creation
      const createdItems = items.map((item, index) => 
        TestDataFactory.createInvoiceItem({
          id: `item-${index}`,
          invoice_id: createdInvoice.id,
          ...item
        })
      );
      
      mockSupabase._mocks.select.mockResolvedValueOnce({ 
        data: createdItems, 
        error: null 
      });

      const result = await createInvoice(invoiceData, items);

      expect(result.data).toEqual({
        ...createdInvoice,
        items: createdItems
      });
      expect(result.error).toBeNull();
    });

    it('should create invoice with provided invoice number', async () => {
      const invoiceData = {
        freelancer_id: '11111111-1111-1111-1111-111111111111',
        client_id: '22222222-2222-2222-2222-222222222222',
        invoice_number: 'CUSTOM-001',
        date_issued: '2024-01-15',
        due_date: '2024-02-14',
        subtotal: 2500.00,
        tax_rate: 20.00,
        tax_amount: 500.00,
        total: 3000.00
      };

      const items = [
        {
          description: 'Web Development',
          quantity: 1,
          rate: 2500.00,
          amount: 2500.00
        }
      ];

      // Mock validation
      const mockFreelancer = TestDataFactory.createFreelancer();
      const mockClient = TestDataFactory.createClient();
      
      mockSupabase._mocks.single
        .mockResolvedValueOnce({ data: mockFreelancer, error: null })
        .mockResolvedValueOnce({ data: mockClient, error: null });

      // Mock invoice creation
      const createdInvoice = TestDataFactory.createInvoice(invoiceData);
      mockSupabase._mocks.single.mockResolvedValueOnce({ 
        data: createdInvoice, 
        error: null 
      });

      // Mock items creation
      const createdItems = [TestDataFactory.createInvoiceItem()];
      mockSupabase._mocks.select.mockResolvedValueOnce({ 
        data: createdItems, 
        error: null 
      });

      const result = await createInvoice(invoiceData, items);

      expect(result.data?.invoice_number).toBe('CUSTOM-001');
      expect(result.error).toBeNull();
    });

    it('should validate invoice totals and relationships', async () => {
      const invoiceData = {
        freelancer_id: '11111111-1111-1111-1111-111111111111',
        client_id: '22222222-2222-2222-2222-222222222222',
        date_issued: '2024-01-15',
        due_date: '2024-02-14',
        subtotal: 2500.00,
        tax_rate: 20.00,
        tax_amount: 500.00,
        total: 3000.00
      };

      const items = [
        {
          description: 'Web Development',
          quantity: 1,
          rate: 2500.00,
          amount: 2500.00
        }
      ];

      // Mock number generation
      setupCountResponse(mockSupabase, 0);

      // Mock validation - freelancer exists but client doesn't belong to freelancer
      const mockFreelancer = TestDataFactory.createFreelancer();
      const mockClient = TestDataFactory.createClient({
        freelancer_id: '99999999-9999-9999-9999-999999999999' // Different freelancer
      });
      
      mockSupabase._mocks.single
        .mockResolvedValueOnce({ data: mockFreelancer, error: null })
        .mockResolvedValueOnce({ data: mockClient, error: null });

      const result = await createInvoice(invoiceData, items);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Client does not belong to the specified freelancer');
    });

    it('should handle invalid input validation', async () => {
      const invalidInvoiceData = {
        freelancer_id: 'invalid-uuid',
        client_id: '22222222-2222-2222-2222-222222222222',
        date_issued: '2024-01-15',
        due_date: '2024-02-14',
        subtotal: -100, // Invalid negative amount
        tax_rate: 20.00,
        tax_amount: 500.00,
        total: 3000.00
      };

      const items = [
        {
          description: 'Web Development',
          quantity: 1,
          rate: 2500.00,
          amount: 2500.00
        }
      ];

      const result = await createInvoice(invalidInvoiceData, items);

      expect(result.data).toBeNull();
      expect(result.error).toContain('Invalid freelancer_id format');
    });

    it('should handle empty items array', async () => {
      const invoiceData = {
        freelancer_id: '11111111-1111-1111-1111-111111111111',
        client_id: '22222222-2222-2222-2222-222222222222',
        date_issued: '2024-01-15',
        due_date: '2024-02-14',
        subtotal: 2500.00,
        tax_rate: 20.00,
        tax_amount: 500.00,
        total: 3000.00
      };

      const result = await createInvoice(invoiceData, []);

      expect(result.data).toBeNull();
      expect(result.error).toBe('At least one invoice item is required');
    });

    it('should rollback invoice creation if items fail', async () => {
      const invoiceData = {
        freelancer_id: '11111111-1111-1111-1111-111111111111',
        client_id: '22222222-2222-2222-2222-222222222222',
        date_issued: '2024-01-15',
        due_date: '2024-02-14',
        subtotal: 2500.00,
        tax_rate: 20.00,
        tax_amount: 500.00,
        total: 3000.00
      };

      const items = [
        {
          description: 'Web Development',
          quantity: 1,
          rate: 2500.00,
          amount: 2500.00
        }
      ];

      // Mock successful validation and invoice creation
      setupCountResponse(mockSupabase, 0);
      
      const mockFreelancer = TestDataFactory.createFreelancer();
      const mockClient = TestDataFactory.createClient();
      const createdInvoice = TestDataFactory.createInvoice();
      
      mockSupabase._mocks.single
        .mockResolvedValueOnce({ data: mockFreelancer, error: null })
        .mockResolvedValueOnce({ data: mockClient, error: null })
        .mockResolvedValueOnce({ data: createdInvoice, error: null });

      // Mock items creation failure
      const itemsError = { message: 'Items creation failed', code: '23503' };
      mockSupabase._mocks.select.mockResolvedValueOnce({ 
        data: null, 
        error: itemsError 
      });

      // Mock rollback deletion
      mockSupabase._mocks.eq.mockResolvedValueOnce({ error: null });

      const result = await createInvoice(invoiceData, items);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Items creation failed');
      
      // Verify rollback was attempted
      expect(mockSupabase._mocks.delete).toHaveBeenCalled();
    });
  });

  describe('getInvoicesForFreelancer', () => {
    it('should retrieve invoices without relations', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      const expectedInvoices = [
        TestDataFactory.createInvoice({ freelancer_id: freelancerId }),
        TestDataFactory.createInvoice({
          id: '55555555-5555-5555-5555-555555555555',
          freelancer_id: freelancerId,
          invoice_number: 'INV-002'
        })
      ];

      mockSupabase._mocks.order.mockResolvedValueOnce({
        data: expectedInvoices,
        error: null
      });

      const result = await getInvoicesForFreelancer(freelancerId, false);

      expect(result.data).toEqual(expectedInvoices);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('invoices');
      expect(mockSupabase._mocks.select).toHaveBeenCalledWith('*');
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('freelancer_id', freelancerId);
    });

    it('should retrieve invoices with relations', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      const expectedInvoices = [
        {
          ...TestDataFactory.createInvoice({ freelancer_id: freelancerId }),
          client: TestDataFactory.createClient(),
          freelancer: TestDataFactory.createFreelancer(),
          items: TestDataFactory.createInvoiceItems()
        }
      ];

      mockSupabase._mocks.order.mockResolvedValueOnce({
        data: expectedInvoices,
        error: null
      });

      const result = await getInvoicesForFreelancer(freelancerId, true);

      expect(result.data).toEqual(expectedInvoices);
      expect(result.error).toBeNull();
      expect(mockSupabase._mocks.select).toHaveBeenCalledWith(`
        *,
        client:clients(*),
        freelancer:freelancers(*),
        items:invoice_items(*)
      `);
    });

    it('should return error for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const result = await getInvoicesForFreelancer(invalidId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid freelancer ID format');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('getInvoiceWithItems', () => {
    it('should retrieve invoice with all relations', async () => {
      const invoiceId = '44444444-4444-4444-4444-444444444444';
      const expectedInvoice = {
        ...TestDataFactory.createInvoice({ id: invoiceId }),
        client: TestDataFactory.createClient(),
        freelancer: TestDataFactory.createFreelancer(),
        items: TestDataFactory.createInvoiceItems()
      };

      setupSuccessfulResponse(mockSupabase, expectedInvoice);

      const result = await getInvoiceWithItems(invoiceId);

      expect(result.data).toEqual(expectedInvoice);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('invoices');
      expect(mockSupabase._mocks.select).toHaveBeenCalledWith(`
        *,
        client:clients(*),
        freelancer:freelancers(*),
        items:invoice_items(*)
      `);
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('id', invoiceId);
    });

    it('should return error for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const result = await getInvoiceWithItems(invalidId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid invoice ID format');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle invoice not found', async () => {
      const invoiceId = '44444444-4444-4444-4444-444444444444';
      const dbError = { message: 'No rows returned', code: 'PGRST116' };
      setupErrorResponse(mockSupabase, dbError);

      const result = await getInvoiceWithItems(invoiceId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invoice not found');
    });
  });

  describe('updateInvoice', () => {
    it('should update invoice successfully', async () => {
      const invoiceId = '44444444-4444-4444-4444-444444444444';
      const updates = {
        status: 'paid' as const,
        notes: 'Payment received'
      };
      const updatedInvoice = TestDataFactory.createInvoice({
        id: invoiceId,
        ...updates
      });

      setupSuccessfulResponse(mockSupabase, updatedInvoice);

      const result = await updateInvoice(invoiceId, updates);

      expect(result.data).toEqual(updatedInvoice);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('invoices');
      expect(mockSupabase._mocks.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('id', invoiceId);
    });

    it('should validate status updates', async () => {
      const invoiceId = '44444444-4444-4444-4444-444444444444';
      const updates = {
        status: 'invalid-status' as any
      };

      const result = await updateInvoice(invoiceId, updates);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid status. Must be one of: draft, sent, paid, overdue');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should validate date formats', async () => {
      const invoiceId = '44444444-4444-4444-4444-444444444444';
      const updates = {
        date_issued: 'invalid-date'
      };

      const result = await updateInvoice(invoiceId, updates);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid date_issued format. Use YYYY-MM-DD');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('deleteInvoice', () => {
    it('should delete invoice successfully', async () => {
      const invoiceId = '44444444-4444-4444-4444-444444444444';
      
      mockSupabase._mocks.eq.mockResolvedValueOnce({ error: null });

      const result = await deleteInvoice(invoiceId);

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('invoices');
      expect(mockSupabase._mocks.delete).toHaveBeenCalled();
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('id', invoiceId);
    });

    it('should return error for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const result = await deleteInvoice(invalidId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid invoice ID format');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('getInvoiceStats', () => {
    it('should calculate invoice statistics correctly', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';
      const mockInvoices = [
        { total: 1000, status: 'paid' },
        { total: 2000, status: 'sent' },
        { total: 1500, status: 'overdue' },
        { total: 500, status: 'draft' }
      ];

      mockSupabase._mocks.eq.mockResolvedValueOnce({
        data: mockInvoices,
        error: null
      });

      const result = await getInvoiceStats(freelancerId);

      expect(result.data).toEqual({
        total_invoices: 4,
        total_amount: 5000,
        paid_amount: 1000,
        pending_amount: 2000,
        overdue_amount: 1500
      });
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('invoices');
      expect(mockSupabase._mocks.select).toHaveBeenCalledWith('total, status');
      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('freelancer_id', freelancerId);
    });

    it('should handle empty invoice list', async () => {
      const freelancerId = '11111111-1111-1111-1111-111111111111';

      mockSupabase._mocks.eq.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const result = await getInvoiceStats(freelancerId);

      expect(result.data).toEqual({
        total_invoices: 0,
        total_amount: 0,
        paid_amount: 0,
        pending_amount: 0,
        overdue_amount: 0
      });
      expect(result.error).toBeNull();
    });

    it('should return error for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const result = await getInvoiceStats(invalidId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid freelancer ID format');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});