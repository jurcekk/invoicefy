/*
  # Add Authentication Support

  1. Schema Changes
    - Add user_id columns to all tables with foreign key constraints
    - Create indexes for performance
    - Add triggers to automatically set user_id on INSERT

  2. Security Updates
    - Drop all existing policies
    - Create new RLS policies based on user_id
    - Support legacy records with fallback logic

  3. Backward Compatibility
    - user_id columns are nullable for existing records
    - Policies handle both new authenticated users and legacy data
*/

-- Add user_id columns to all tables
DO $$
BEGIN
  -- Add user_id to freelancers if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'freelancers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE freelancers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    COMMENT ON COLUMN freelancers.user_id IS 'References auth.users.id - nullable for legacy records';
  END IF;

  -- Add user_id to clients if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    COMMENT ON COLUMN clients.user_id IS 'References auth.users.id - nullable for legacy records';
  END IF;

  -- Add user_id to invoices if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    COMMENT ON COLUMN invoices.user_id IS 'References auth.users.id - nullable for legacy records';
  END IF;
END $$;

-- Create indexes for user_id columns
CREATE INDEX IF NOT EXISTS idx_freelancers_user_id ON freelancers(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);

-- Create function to automatically set user_id on INSERT
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to auto-set user_id on INSERT
DROP TRIGGER IF EXISTS set_user_id_freelancers ON freelancers;
CREATE TRIGGER set_user_id_freelancers
  BEFORE INSERT ON freelancers
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_clients ON clients;
CREATE TRIGGER set_user_id_clients
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_invoices ON invoices;
CREATE TRIGGER set_user_id_invoices
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Drop ALL existing policies for all tables
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies for freelancers table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'freelancers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON freelancers';
    END LOOP;
    
    -- Drop all policies for clients table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'clients') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON clients';
    END LOOP;
    
    -- Drop all policies for invoices table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'invoices') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON invoices';
    END LOOP;
    
    -- Drop all policies for invoice_items table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'invoice_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON invoice_items';
    END LOOP;
END $$;

-- Create new RLS policies based on user_id

-- Freelancers policies
CREATE POLICY "Users can read own freelancer profile"
  ON freelancers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (user_id IS NULL AND auth.uid() = id));

CREATE POLICY "Users can insert own freelancer profile"
  ON freelancers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own freelancer profile"
  ON freelancers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR (user_id IS NULL AND auth.uid() = id))
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own freelancer profile"
  ON freelancers
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR (user_id IS NULL AND auth.uid() = id));

-- Clients policies
CREATE POLICY "Users can read own clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND freelancer_id = auth.uid()) OR
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND freelancer_id = auth.uid()) OR
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  )
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND freelancer_id = auth.uid()) OR
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

-- Invoices policies
CREATE POLICY "Users can read own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND freelancer_id = auth.uid()) OR
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own invoices"
  ON invoices
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND freelancer_id = auth.uid()) OR
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  )
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own invoices"
  ON invoices
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND freelancer_id = auth.uid()) OR
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

-- Invoice items policies
CREATE POLICY "Users can read own invoice items"
  ON invoice_items
  FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE user_id = auth.uid() OR 
            (user_id IS NULL AND freelancer_id = auth.uid()) OR
            freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own invoice items"
  ON invoice_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE user_id = auth.uid() OR
            freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own invoice items"
  ON invoice_items
  FOR UPDATE
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE user_id = auth.uid() OR 
            (user_id IS NULL AND freelancer_id = auth.uid()) OR
            freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE user_id = auth.uid() OR
            freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete own invoice items"
  ON invoice_items
  FOR DELETE
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE user_id = auth.uid() OR 
            (user_id IS NULL AND freelancer_id = auth.uid()) OR
            freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
    )
  );