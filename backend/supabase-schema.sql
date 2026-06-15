-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

-- ============ TABLES ============

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  item text not null,          -- e.g. "PJ Set", "Dress", "Shorts"
  size text,                    -- Small / Medium / Large / XL etc.
  colour text,
  quantity int default 1,
  unit_price numeric,
  amount numeric,
  sale_date date default current_date,
  created_at timestamptz default now()
);

-- ============ INDEXES ============

create index if not exists idx_customers_owner on customers(owner_id);
create index if not exists idx_customers_phone on customers(phone);
create index if not exists idx_sales_owner on sales(owner_id);
create index if not exists idx_sales_customer on sales(customer_id);
create index if not exists idx_sales_date on sales(sale_date);

-- ============ ROW LEVEL SECURITY ============
-- The backend uses the service role key (bypasses RLS), but RLS is enabled
-- as defense-in-depth in case the anon key is ever used directly.

alter table customers enable row level security;
alter table sales enable row level security;

create policy "Users can view their own customers"
  on customers for select
  using (auth.uid() = owner_id);

create policy "Users can insert their own customers"
  on customers for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own customers"
  on customers for update
  using (auth.uid() = owner_id);

create policy "Users can view their own sales"
  on sales for select
  using (auth.uid() = owner_id);

create policy "Users can insert their own sales"
  on sales for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own sales"
  on sales for update
  using (auth.uid() = owner_id);
