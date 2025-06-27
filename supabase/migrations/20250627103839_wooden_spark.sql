/*
  # Invoice Management System Schema

  1. New Tables
    - `freelancers`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, required, unique)
      - `address` (text, required)
      - `phone` (text, optional)
      - `website` (text, optional)
      - `created_at` (timestamp with timezone, default now())

    - `clients`
      - `id` (uuid, primary key)
      - `freelancer_id` (uuid, foreign key to freelancers)
      - `company_name` (text, required)
      - `contact_name` (text, optional)
      - `email` (text, required)
      - `address` (text, optional)
      - `phone` (text, optional)
      - `created_at` (timestamp with timezone, default now())

    - `invoices`
      - `id` (uuid, primary key)
      - `freelancer_id` (uuid, foreign key to freelancers)
      - `client_id` (uuid, foreign key to clients)
      - `invoice_number` (text, required, unique)
      - `date_issued` (date, required)
      - `due_date` (date, required)
      - `subtotal` (decimal, required)
      - `tax_rate` (decimal, default 0)
      - `tax_amount` (decimal, required)
      - `total` (decimal, required)
      - `status` (text, default 'draft')
      - `notes` (text, optional)
      - `created_at` (timestamp with timezone, default now())
      - `updated_at` (timestamp with timezone, default now())

    - `invoice_items`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key to invoices)
      - `description` (text, required)
      - `quantity` (decimal, required)
      - `rate` (decimal, required)
      - `amount` (decimal, required)
      - `created_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Freelancers can only access their own data and related clients/invoices
    - Cascade deletes for related records

  3. Indexes
    - Add indexes for frequently queried columns
    - Unique constraints where appropriate
*/

-- Create freelancers table
CREATE TABLE IF NOT EXISTS freelancers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  address text NOT NULL,
  phone text,
  website text,
  created_at timestamptz DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id uuid NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_name text,
  email text NOT NULL,
  address text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id uuid NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  date_issued date NOT NULL,
  due_date date NOT NULL,
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  tax_rate decimal(5,2) NOT NULL DEFAULT 0,
  tax_amount decimal(10,2) NOT NULL DEFAULT 0,
  total decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity decimal(10,2) NOT NULL DEFAULT 1,
  rate decimal(10,2) NOT NULL DEFAULT 0,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_freelancer_id ON clients(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_freelancer_id ON invoices(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date_issued ON invoices(date_issued);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on invoices
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for freelancers
CREATE POLICY "Freelancers can read own data"
  ON freelancers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Freelancers can insert own data"
  ON freelancers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Freelancers can update own data"
  ON freelancers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Freelancers can delete own data"
  ON freelancers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Create RLS policies for clients
CREATE POLICY "Freelancers can read own clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can insert own clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can update own clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (freelancer_id = auth.uid())
  WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can delete own clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (freelancer_id = auth.uid());

-- Create RLS policies for invoices
CREATE POLICY "Freelancers can read own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can insert own invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can update own invoices"
  ON invoices
  FOR UPDATE
  TO authenticated
  USING (freelancer_id = auth.uid())
  WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can delete own invoices"
  ON invoices
  FOR DELETE
  TO authenticated
  USING (freelancer_id = auth.uid());

-- Create RLS policies for invoice_items
CREATE POLICY "Freelancers can read own invoice items"
  ON invoice_items
  FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE freelancer_id = auth.uid()
    )
  );

CREATE POLICY "Freelancers can insert own invoice items"
  ON invoice_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE freelancer_id = auth.uid()
    )
  );

CREATE POLICY "Freelancers can update own invoice items"
  ON invoice_items
  FOR UPDATE
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE freelancer_id = auth.uid()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE freelancer_id = auth.uid()
    )
  );

CREATE POLICY "Freelancers can delete own invoice items"
  ON invoice_items
  FOR DELETE
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE freelancer_id = auth.uid()
    )
  );