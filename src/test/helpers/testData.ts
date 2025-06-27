import type { Database } from '../../lib/database.types';

// Type aliases for cleaner code
type FreelancerRow = Database['public']['Tables']['freelancers']['Row'];
type ClientRow = Database['public']['Tables']['clients']['Row'];
type InvoiceRow = Database['public']['Tables']['invoices']['Row'];
type InvoiceItemRow = Database['public']['Tables']['invoice_items']['Row'];

/**
 * Test data factory for creating consistent test data
 */
export class TestDataFactory {
  static createFreelancer(overrides: Partial<FreelancerRow> = {}): FreelancerRow {
    return {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Jane Dev',
      email: 'jane@janedev.com',
      address: '123 Freelance Ln, Tech City, TC 12345',
      phone: '+1 (555) 123-4567',
      website: 'https://janedev.com',
      created_at: '2024-01-01T00:00:00.000Z',
      ...overrides
    };
  }

  static createClient(overrides: Partial<ClientRow> = {}): ClientRow {
    return {
      id: '22222222-2222-2222-2222-222222222222',
      freelancer_id: '11111111-1111-1111-1111-111111111111',
      company_name: 'Acme Inc',
      contact_name: 'John Smith',
      email: 'john@acme.com',
      address: '456 Business Ave, Commerce City, CC 67890',
      phone: '+1 (555) 987-6543',
      created_at: '2024-01-01T00:00:00.000Z',
      ...overrides
    };
  }

  static createInvoice(overrides: Partial<InvoiceRow> = {}): InvoiceRow {
    return {
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
      updated_at: '2024-01-15T00:00:00.000Z',
      ...overrides
    };
  }

  static createInvoiceItem(overrides: Partial<InvoiceItemRow> = {}): InvoiceItemRow {
    return {
      id: '55555555-5555-5555-5555-555555555555',
      invoice_id: '44444444-4444-4444-4444-444444444444',
      description: 'Website Development - Custom React Application',
      quantity: 1.00,
      rate: 2000.00,
      amount: 2000.00,
      created_at: '2024-01-15T00:00:00.000Z',
      ...overrides
    };
  }

  static createInvoiceItems(): InvoiceItemRow[] {
    return [
      this.createInvoiceItem({
        id: '55555555-5555-5555-5555-555555555555',
        description: 'Website Development - Custom React Application',
        quantity: 1.00,
        rate: 2000.00,
        amount: 2000.00,
      }),
      this.createInvoiceItem({
        id: '66666666-6666-6666-6666-666666666666',
        description: 'Technical Consultation - Project Planning & Architecture',
        quantity: 5.00,
        rate: 100.00,
        amount: 500.00,
      })
    ];
  }

  /**
   * Creates a complete invoice with items and relations
   */
  static createInvoiceWithRelations() {
    const freelancer = this.createFreelancer();
    const client = this.createClient();
    const invoice = this.createInvoice();
    const items = this.createInvoiceItems();

    return {
      ...invoice,
      freelancer,
      client,
      items
    };
  }

  /**
   * Generate valid UUIDs for testing
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate invalid UUIDs for testing error cases
   */
  static generateInvalidUUID(): string {
    return 'invalid-uuid-format';
  }

  /**
   * Generate test email addresses
   */
  static generateEmail(prefix: string = 'test'): string {
    return `${prefix}${Math.random().toString(36).substr(2, 5)}@example.com`;
  }

  /**
   * Generate test dates in YYYY-MM-DD format
   */
  static generateDate(daysFromNow: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }
}