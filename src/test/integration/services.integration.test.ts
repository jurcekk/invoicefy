import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createFreelancer, getFreelancerById } from '../../services/freelancerService';
import { createClient, getClientsForFreelancer } from '../../services/clientService';
import { createInvoice, getInvoiceWithItems, getNextInvoiceNumber } from '../../services/invoiceService';
import { TestDataFactory } from '../helpers/testData';

/**
 * Integration tests for service layer
 * 
 * These tests can be run against:
 * 1. A local Supabase instance (using @supabase/cli)
 * 2. A test database
 * 
 * To run against local Supabase:
 * 1. Install Supabase CLI: npm install -g @supabase/cli
 * 2. Start local instance: supabase start
 * 3. Update .env with local URLs
 * 4. Run tests: npm run test:integration
 * 
 * Note: These tests are skipped by default to avoid requiring a database setup
 * Remove .skip to enable them when you have a test database available
 */

describe.skip('Services Integration Tests', () => {
  let testFreelancerId: string;
  let testClientId: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    // Setup test data
    console.log('Setting up integration test data...');
  });

  afterAll(async () => {
    // Cleanup test data
    console.log('Cleaning up integration test data...');
  });

  beforeEach(() => {
    // Reset test state
  });

  describe('Freelancer Service Integration', () => {
    it('should create and retrieve a freelancer', async () => {
      const freelancerData = {
        name: 'Integration Test Freelancer',
        email: TestDataFactory.generateEmail('integration'),
        address: '123 Test St, Test City, TC 12345',
        phone: '+1 (555) 123-4567',
        website: 'https://test.example.com'
      };

      // Create freelancer
      const createResult = await createFreelancer(freelancerData);
      expect(createResult.error).toBeNull();
      expect(createResult.data).toBeTruthy();
      expect(createResult.data?.name).toBe(freelancerData.name);
      expect(createResult.data?.email).toBe(freelancerData.email);

      testFreelancerId = createResult.data!.id;

      // Retrieve freelancer
      const getResult = await getFreelancerById(testFreelancerId);
      expect(getResult.error).toBeNull();
      expect(getResult.data).toBeTruthy();
      expect(getResult.data?.id).toBe(testFreelancerId);
      expect(getResult.data?.name).toBe(freelancerData.name);
    });
  });

  describe('Client Service Integration', () => {
    it('should create and retrieve clients for a freelancer', async () => {
      // First ensure we have a freelancer
      if (!testFreelancerId) {
        const freelancerResult = await createFreelancer({
          name: 'Test Freelancer for Clients',
          email: TestDataFactory.generateEmail('freelancer'),
          address: '123 Freelancer St, Test City, TC 12345'
        });
        testFreelancerId = freelancerResult.data!.id;
      }

      const clientData = {
        freelancer_id: testFreelancerId,
        company_name: 'Integration Test Corp',
        email: TestDataFactory.generateEmail('client'),
        contact_name: 'John Test',
        address: '456 Client Ave, Test City, TC 67890',
        phone: '+1 (555) 987-6543'
      };

      // Create client
      const createResult = await createClient(clientData);
      expect(createResult.error).toBeNull();
      expect(createResult.data).toBeTruthy();
      expect(createResult.data?.company_name).toBe(clientData.company_name);
      expect(createResult.data?.freelancer_id).toBe(testFreelancerId);

      testClientId = createResult.data!.id;

      // Retrieve clients for freelancer
      const getResult = await getClientsForFreelancer(testFreelancerId);
      expect(getResult.error).toBeNull();
      expect(getResult.data).toBeTruthy();
      expect(getResult.data!.length).toBeGreaterThan(0);
      
      const createdClient = getResult.data!.find(c => c.id === testClientId);
      expect(createdClient).toBeTruthy();
      expect(createdClient?.company_name).toBe(clientData.company_name);
    });
  });

  describe('Invoice Service Integration', () => {
    it('should generate sequential invoice numbers', async () => {
      // Ensure we have a freelancer
      if (!testFreelancerId) {
        const freelancerResult = await createFreelancer({
          name: 'Test Freelancer for Invoices',
          email: TestDataFactory.generateEmail('invoice-freelancer'),
          address: '123 Invoice St, Test City, TC 12345'
        });
        testFreelancerId = freelancerResult.data!.id;
      }

      // Get first invoice number
      const firstNumberResult = await getNextInvoiceNumber(testFreelancerId);
      expect(firstNumberResult.error).toBeNull();
      expect(firstNumberResult.data).toMatch(/^INV-\d{3}$/);

      // Get second invoice number (should be sequential)
      const secondNumberResult = await getNextInvoiceNumber(testFreelancerId);
      expect(secondNumberResult.error).toBeNull();
      expect(secondNumberResult.data).toMatch(/^INV-\d{3}$/);

      // Extract numbers and verify they're sequential
      const firstNum = parseInt(firstNumberResult.data!.split('-')[1]);
      const secondNum = parseInt(secondNumberResult.data!.split('-')[1]);
      expect(secondNum).toBe(firstNum + 1);
    });

    it('should create invoice with items and correct totals', async () => {
      // Ensure we have freelancer and client
      if (!testFreelancerId) {
        const freelancerResult = await createFreelancer({
          name: 'Test Freelancer for Invoice Creation',
          email: TestDataFactory.generateEmail('invoice-create'),
          address: '123 Create St, Test City, TC 12345'
        });
        testFreelancerId = freelancerResult.data!.id;
      }

      if (!testClientId) {
        const clientResult = await createClient({
          freelancer_id: testFreelancerId,
          company_name: 'Test Client for Invoice',
          email: TestDataFactory.generateEmail('invoice-client')
        });
        testClientId = clientResult.data!.id;
      }

      const invoiceData = {
        freelancer_id: testFreelancerId,
        client_id: testClientId,
        date_issued: TestDataFactory.generateDate(0),
        due_date: TestDataFactory.generateDate(30),
        subtotal: 2500.00,
        tax_rate: 20.00,
        tax_amount: 500.00,
        total: 3000.00,
        status: 'draft' as const,
        notes: 'Integration test invoice'
      };

      const items = [
        {
          description: 'Web Development Services',
          quantity: 1,
          rate: 2000.00,
          amount: 2000.00
        },
        {
          description: 'Consultation Hours',
          quantity: 5,
          rate: 100.00,
          amount: 500.00
        }
      ];

      // Create invoice
      const createResult = await createInvoice(invoiceData, items);
      expect(createResult.error).toBeNull();
      expect(createResult.data).toBeTruthy();
      expect(createResult.data?.freelancer_id).toBe(testFreelancerId);
      expect(createResult.data?.client_id).toBe(testClientId);
      expect(createResult.data?.total).toBe(3000.00);
      expect(createResult.data?.items).toHaveLength(2);

      testInvoiceId = createResult.data!.id;

      // Verify totals calculation
      const itemsTotal = createResult.data!.items.reduce((sum, item) => sum + item.amount, 0);
      expect(itemsTotal).toBe(invoiceData.subtotal);
      expect(createResult.data!.tax_amount).toBe(invoiceData.tax_amount);
      expect(createResult.data!.total).toBe(invoiceData.total);
    });

    it('should retrieve invoice with all relations', async () => {
      // Ensure we have a test invoice
      if (!testInvoiceId) {
        // Create minimal test data
        const freelancerResult = await createFreelancer({
          name: 'Test Freelancer for Retrieval',
          email: TestDataFactory.generateEmail('retrieve'),
          address: '123 Retrieve St, Test City, TC 12345'
        });
        const clientResult = await createClient({
          freelancer_id: freelancerResult.data!.id,
          company_name: 'Test Client for Retrieval',
          email: TestDataFactory.generateEmail('retrieve-client')
        });
        const invoiceResult = await createInvoice({
          freelancer_id: freelancerResult.data!.id,
          client_id: clientResult.data!.id,
          date_issued: TestDataFactory.generateDate(0),
          due_date: TestDataFactory.generateDate(30),
          subtotal: 1000.00,
          tax_rate: 10.00,
          tax_amount: 100.00,
          total: 1100.00
        }, [{
          description: 'Test Service',
          quantity: 1,
          rate: 1000.00,
          amount: 1000.00
        }]);
        testInvoiceId = invoiceResult.data!.id;
      }

      // Retrieve invoice with relations
      const result = await getInvoiceWithItems(testInvoiceId);
      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      
      // Verify all relations are loaded
      expect(result.data?.freelancer).toBeTruthy();
      expect(result.data?.client).toBeTruthy();
      expect(result.data?.items).toBeTruthy();
      expect(result.data?.items.length).toBeGreaterThan(0);
      
      // Verify foreign key relationships
      expect(result.data?.freelancer_id).toBe(result.data?.freelancer.id);
      expect(result.data?.client_id).toBe(result.data?.client.id);
      expect(result.data?.client.freelancer_id).toBe(result.data?.freelancer.id);
      
      // Verify all items belong to the invoice
      result.data?.items.forEach(item => {
        expect(item.invoice_id).toBe(testInvoiceId);
      });
    });
  });

  describe('Cross-Service Data Integrity', () => {
    it('should maintain referential integrity across services', async () => {
      // Create a complete workflow: freelancer -> client -> invoice
      const freelancerData = {
        name: 'Integrity Test Freelancer',
        email: TestDataFactory.generateEmail('integrity'),
        address: '123 Integrity St, Test City, TC 12345'
      };

      const freelancerResult = await createFreelancer(freelancerData);
      expect(freelancerResult.error).toBeNull();
      const freelancerId = freelancerResult.data!.id;

      const clientData = {
        freelancer_id: freelancerId,
        company_name: 'Integrity Test Corp',
        email: TestDataFactory.generateEmail('integrity-client')
      };

      const clientResult = await createClient(clientData);
      expect(clientResult.error).toBeNull();
      const clientId = clientResult.data!.id;

      const invoiceData = {
        freelancer_id: freelancerId,
        client_id: clientId,
        date_issued: TestDataFactory.generateDate(0),
        due_date: TestDataFactory.generateDate(30),
        subtotal: 1500.00,
        tax_rate: 15.00,
        tax_amount: 225.00,
        total: 1725.00
      };

      const items = [{
        description: 'Integrity Test Service',
        quantity: 1,
        rate: 1500.00,
        amount: 1500.00
      }];

      const invoiceResult = await createInvoice(invoiceData, items);
      expect(invoiceResult.error).toBeNull();

      // Verify all relationships are correct
      const fullInvoice = await getInvoiceWithItems(invoiceResult.data!.id);
      expect(fullInvoice.error).toBeNull();
      expect(fullInvoice.data?.freelancer.id).toBe(freelancerId);
      expect(fullInvoice.data?.client.id).toBe(clientId);
      expect(fullInvoice.data?.client.freelancer_id).toBe(freelancerId);
    });
  });
});