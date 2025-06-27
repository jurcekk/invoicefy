/*
  # Update RLS policies for freelancer application

  1. Security Changes
    - Update freelancers table policy to allow anonymous users to perform all operations
    - Update clients table policy to allow anonymous users to perform all operations  
    - Update invoices table policy to allow anonymous users to perform all operations
    - Update invoice_items table policy to allow anonymous users to perform all operations

  This change is needed because the application is designed as a single-user freelancer tool
  without authentication, so anonymous users need full access to manage their data.
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow all operations on freelancers" ON freelancers;
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
DROP POLICY IF EXISTS "Allow all operations on invoices" ON invoices;
DROP POLICY IF EXISTS "Allow all operations on invoice_items" ON invoice_items;

-- Create new policies that allow anonymous users full access
CREATE POLICY "Allow anonymous access to freelancers"
  ON freelancers
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated access to freelancers"
  ON freelancers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to clients"
  ON clients
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated access to clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to invoices"
  ON invoices
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated access to invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to invoice_items"
  ON invoice_items
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated access to invoice_items"
  ON invoice_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);