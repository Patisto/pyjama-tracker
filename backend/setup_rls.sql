-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

DROP POLICY IF EXISTS "Users can view their own sales" ON sales;
DROP POLICY IF EXISTS "Users can insert their own sales" ON sales;
DROP POLICY IF EXISTS "Users can update their own sales" ON sales;
DROP POLICY IF EXISTS "Users can delete their own sales" ON sales;

-- Customers policies
CREATE POLICY "Users can view their own customers"
ON customers FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own customers"
ON customers FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own customers"
ON customers FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own customers"
ON customers FOR DELETE
USING (auth.uid() = owner_id);

-- Sales policies
CREATE POLICY "Users can view their own sales"
ON sales FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own sales"
ON sales FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own sales"
ON sales FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own sales"
ON sales FOR DELETE
USING (auth.uid() = owner_id);
