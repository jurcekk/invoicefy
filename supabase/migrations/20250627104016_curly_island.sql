/*
  # Update RLS Policies to Permissive for MVP

  1. Security Changes
    - Drop existing restrictive policies
    - Create new permissive policies allowing all operations
    - Use `true` condition for SELECT/INSERT/UPDATE operations
    - Keep RLS enabled but make it permissive for development

  2. Tables Updated
    - `freelancers` - Allow all CRUD operations
    - `clients` - Allow all CRUD operations  
    - `invoices` - Allow all CRUD operations
    - `invoice_items` - Allow all CRUD operations

  Note: These permissive policies should be updated later to use proper auth.uid() checks for production.
*/

-- Drop existing restrictive policies for freelancers
DROP POLICY IF EXISTS "Freelancers can read own data" ON freelancers;
DROP POLICY IF EXISTS "Freelancers can insert own data" ON freelancers;
DROP POLICY IF EXISTS "Freelancers can update own data" ON freelancers;
DROP POLICY IF EXISTS "Freelancers can delete own data" ON freelancers;

-- Drop existing restrictive policies for clients
DROP POLICY IF EXISTS "Freelancers can read own clients" ON clients;
DROP POLICY IF EXISTS "Freelancers can insert own clients" ON clients;
DROP POLICY IF EXISTS "Freelancers can update own clients" ON clients;
DROP POLICY IF EXISTS "Freelancers can delete own clients" ON clients;

-- Drop existing restrictive policies for invoices
DROP POLICY IF EXISTS "Freelancers can read own invoices" ON invoices;
DROP POLICY IF EXISTS "Freelancers can insert own invoices" ON invoices;
DROP POLICY IF EXISTS "Freelancers can update own invoices" ON invoices;
DROP POLICY IF EXISTS "Freelancers can delete own invoices" ON invoices;

-- Drop existing restrictive policies for invoice_items
DROP POLICY IF EXISTS "Freelancers can read own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Freelancers can insert own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Freelancers can update own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Freelancers can delete own invoice items" ON invoice_items;

-- Create permissive policies for freelancers (MVP)
CREATE POLICY "Allow all operations on freelancers"
  ON freelancers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for clients (MVP)
CREATE POLICY "Allow all operations on clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for invoices (MVP)
CREATE POLICY "Allow all operations on invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for invoice_items (MVP)
CREATE POLICY "Allow all operations on invoice_items"
  ON invoice_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);