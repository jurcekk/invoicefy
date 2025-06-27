/*
  # Seed Test Data

  1. Test Data
    - One freelancer: Jane Dev
    - Two clients: Acme Inc and Globex Corp  
    - One invoice for Acme Inc with two items

  2. Static UUIDs
    - Uses consistent UUIDs for testing
    - All foreign keys properly linked

  3. Sample Invoice Items
    - Web development service
    - Consultation hours
*/

-- Insert freelancer
INSERT INTO freelancers (id, name, email, address, phone, website) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Jane Dev',
  'jane@janedev.com',
  '123 Freelance Ln, Tech City, TC 12345',
  '+1 (555) 123-4567',
  'https://janedev.com'
);

-- Insert clients
INSERT INTO clients (id, freelancer_id, company_name, contact_name, email, address, phone) VALUES 
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Acme Inc',
  'John Smith',
  'john@acme.com',
  '456 Business Ave, Commerce City, CC 67890',
  '+1 (555) 987-6543'
),
(
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Globex Corp',
  'Sarah Johnson',
  'sarah@globex.com',
  '789 Corporate Blvd, Enterprise Town, ET 54321',
  '+1 (555) 456-7890'
);

-- Insert invoice for Acme Inc
INSERT INTO invoices (
  id, 
  freelancer_id, 
  client_id, 
  invoice_number, 
  date_issued, 
  due_date, 
  subtotal, 
  tax_rate, 
  tax_amount, 
  total, 
  status, 
  notes
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'INV-0001',
  '2024-01-15',
  '2024-02-14',
  2500.00,
  20.00,
  500.00,
  3000.00,
  'sent',
  'Payment terms: Net 30 days. Thank you for your business!'
);

-- Insert invoice items
INSERT INTO invoice_items (id, invoice_id, description, quantity, rate, amount) VALUES 
(
  '55555555-5555-5555-5555-555555555555',
  '44444444-4444-4444-4444-444444444444',
  'Website Development - Custom React Application',
  1.00,
  2000.00,
  2000.00
),
(
  '66666666-6666-6666-6666-666666666666',
  '44444444-4444-4444-4444-444444444444',
  'Technical Consultation - Project Planning & Architecture',
  5.00,
  100.00,
  500.00
);