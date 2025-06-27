import { vi } from 'vitest';

// Mock data for testing
export const mockFreelancer = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Jane Dev',
  email: 'jane@janedev.com',
  address: '123 Freelance Ln, Tech City, TC 12345',
  phone: '+1 (555) 123-4567',
  website: 'https://janedev.com',
  created_at: '2024-01-01T00:00:00.000Z'
};

export const mockClient = {
  id: '22222222-2222-2222-2222-222222222222',
  freelancer_id: '11111111-1111-1111-1111-111111111111',
  company_name: 'Acme Inc',
  contact_name: 'John Smith',
  email: 'john@acme.com',
  address: '456 Business Ave, Commerce City, CC 67890',
  phone: '+1 (555) 987-6543',
  created_at: '2024-01-01T00:00:00.000Z'
};

export const mockInvoice = {
  id: '44444444-4444-4444-4444-444444444444',
  freelancer_id: '11111111-1111-1111-1111-111111111111',
  client_id: '22222222-2222-2222-2222-222222222222',
  invoice_number: 'INV-001',
  date_issued: '2024-01-15',
  due_date: '2024-02-14',
  subtotal: 2500.00,
  tax_rate: 20.00,
  tax_amount: 500.00,
  total: 3000.00,
  status: 'sent',
  notes: 'Payment terms: Net 30 days. Thank you for your business!',
  created_at: '2024-01-15T00:00:00.000Z',
  updated_at: '2024-01-15T00:00:00.000Z'
};

export const mockInvoiceItems = [
  {
    id: '55555555-5555-5555-5555-555555555555',
    invoice_id: '44444444-4444-4444-4444-444444444444',
    description: 'Website Development - Custom React Application',
    quantity: 1.00,
    rate: 2000.00,
    amount: 2000.00,
    created_at: '2024-01-15T00:00:00.000Z'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    invoice_id: '44444444-4444-4444-4444-444444444444',
    description: 'Technical Consultation - Project Planning & Architecture',
    quantity: 5.00,
    rate: 100.00,
    amount: 500.00,
    created_at: '2024-01-15T00:00:00.000Z'
  }
];

// Create a mock Supabase client
export const createMockSupabaseClient = () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();
  const mockOrder = vi.fn();

  // Chain methods for fluent API
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });

  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
  });

  mockInsert.mockReturnValue({
    select: mockSelect,
  });

  mockUpdate.mockReturnValue({
    eq: mockEq,
  });

  mockDelete.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
    order: mockOrder,
    select: mockSelect,
  });

  mockOrder.mockReturnValue({
    single: mockSingle,
  });

  // Default successful responses
  mockSingle.mockResolvedValue({ data: null, error: null });

  const mockClient = {
    from: mockFrom,
    // Expose mocks for testing
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      order: mockOrder,
    }
  };

  return mockClient;
};

// Helper to setup successful responses
export const setupSuccessfulResponse = (mockClient: any, data: any) => {
  mockClient._mocks.single.mockResolvedValueOnce({ data, error: null });
  return mockClient;
};

// Helper to setup error responses
export const setupErrorResponse = (mockClient: any, error: any) => {
  mockClient._mocks.single.mockResolvedValueOnce({ data: null, error });
  return mockClient;
};

// Helper to setup count responses
export const setupCountResponse = (mockClient: any, count: number) => {
  mockClient._mocks.select.mockReturnValueOnce({
    eq: vi.fn().mockResolvedValueOnce({ count, error: null })
  });
  return mockClient;
};