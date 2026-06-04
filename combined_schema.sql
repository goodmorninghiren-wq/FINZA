-- ==========================================================
-- FILE: supabase_schema.sql
-- ==========================================================

-- 1. Create tables if they don't exist
create table if not exists public.quickbooks_clients (
  id text not null primary key, -- realmId
  name text not null,
  access_token text not null,
  refresh_token text not null,
  expires_in int not null,
  x_refresh_token_expires_in int not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  client_email text
) tablespace pg_default;

create table if not exists public.import_rules (
  id uuid not null default gen_random_uuid () primary key,
  client_id text not null references public.quickbooks_clients (id) on delete cascade,
  rule_name text not null,
  rule_type text not null,
  match_type text not null default 'AND'::text,
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
) tablespace pg_default;

create table if not exists public.master_rules (
  id uuid not null default gen_random_uuid () primary key,
  rule_name text not null,
  match_type text not null default 'AND'::text,
  conditions jsonb not null default '[]'::jsonb,
  rule_type text not null,
  actions jsonb not null default '{}'::jsonb,
  applied_client_ids text[] default array[]::text[],
  created_at timestamp with time zone not null default now()
) tablespace pg_default;

-- 2. Profiles Table for Role Management
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null check (role in ('admin', 'coworker')),
  firm_name text,
  admin_email_display text,
  created_at timestamp with time zone not null default now()
) tablespace pg_default;

-- 3. Add user_id columns for Multi-Tenancy
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='quickbooks_clients' and column_name='user_id') then
        alter table public.quickbooks_clients add column user_id uuid references auth.users(id) default auth.uid();
    end if;

    if not exists (select 1 from information_schema.columns where table_name='import_rules' and column_name='user_id') then
        alter table public.import_rules add column user_id uuid references auth.users(id) default auth.uid();
    end if;

    if not exists (select 1 from information_schema.columns where table_name='master_rules' and column_name='user_id') then
        alter table public.master_rules add column user_id uuid references auth.users(id) default auth.uid();
    end if;
end $$;

-- 4. Automatic Role Assignment Trigger
-- The FIRST user to sign up will be 'admin'. Everyone else is 'coworker'.
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  is_first_user boolean;
begin
  select not exists (select 1 from public.profiles) into is_first_user;
  
  insert into public.profiles (id, email, role)
  values (
    new.id, 
    new.email, 
    case when is_first_user then 'admin' else 'coworker' end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Re-create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.quickbooks_clients enable row level security;
alter table public.import_rules enable row level security;
alter table public.master_rules enable row level security;

-- Profiles: Users can view all profiles in their instance (for the user list)
drop policy if exists "Users can view all profiles" on public.profiles;
create policy "Users can view all profiles" on public.profiles for select using (true);
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Data isolation policies
drop policy if exists "Users can only access their own connections" on public.quickbooks_clients;
create policy "Allow all authenticated users to access QBO connections" on public.quickbooks_clients 
  for all using (auth.role() = 'authenticated');

drop policy if exists "Users can only manage their own import rules" on public.import_rules;
create policy "Users can only manage their own import rules" on public.import_rules 
  for all using (auth.uid() = user_id);

drop policy if exists "Users can only manage their own master rules" on public.master_rules;
create policy "Users can only manage their own master rules" on public.master_rules 
  for all using (auth.uid() = user_id);


-- ==========================================================
-- FILE: supabase_migration_bank_entries.sql
-- ==========================================================

-- Migration to create bank_entries table
create table if not exists public.bank_entries (
  id uuid not null default gen_random_uuid () primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  transaction_date date not null,
  description text not null,
  debit_amount decimal(10,2) not null default 0.00,
  credit_amount decimal(10,2) not null default 0.00,
  balance decimal(10,2) not null default 0.00,
  source text not null check (source in ('manual', 'import')),
  imported_at timestamp with time zone not null default now(),
  bank_statement_ref text,
  status text not null check (status in ('pending', 'confirmed', 'rejected')) default 'pending'
) tablespace pg_default;

-- Enable RLS
alter table public.bank_entries enable row level security;

-- Policies
drop policy if exists "Users can manage their own bank entries" on public.bank_entries;
create policy "Users can manage their own bank entries" on public.bank_entries 
  for all using (auth.uid() = user_id);


-- ==========================================================
-- FILE: setup_company_schema.sql
-- ==========================================================

-- 1. Create Industry Templates Table
CREATE TABLE IF NOT EXISTS public.industry_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Industry COA Templates Table
CREATE TABLE IF NOT EXISTS public.industry_coa_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_id UUID REFERENCES public.industry_templates(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    detail_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.industry_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_coa_templates ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Allow all authenticated users to read)
DROP POLICY IF EXISTS "Allow all to view industry templates" ON public.industry_templates;
CREATE POLICY "Allow all to view industry templates" ON public.industry_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all to view COA templates" ON public.industry_coa_templates;
CREATE POLICY "Allow all to view COA templates" ON public.industry_coa_templates FOR SELECT USING (true);

-- 5. Data Seeding
-- Seed Industries
INSERT INTO public.industry_templates (name) VALUES 
('Retail'), 
('Professional Services'), 
('Real Estate'),
('Manufacturing')
ON CONFLICT (name) DO NOTHING;

-- Seed COA Templates for Retail (Example)
DO $$ 
DECLARE 
    retail_id UUID;
    services_id UUID;
BEGIN
    SELECT id INTO retail_id FROM public.industry_templates WHERE name = 'Retail';
    SELECT id INTO services_id FROM public.industry_templates WHERE name = 'Professional Services';

    -- Retail Accounts
    IF retail_id IS NOT NULL THEN
        INSERT INTO public.industry_coa_templates (industry_id, account_name, account_type, detail_type, description) VALUES
        (retail_id, 'Inventory Asset', 'Other Current Asset', 'Inventory', 'Stock of goods for resale'),
        (retail_id, 'Sales of Product Income', 'Income', 'SalesOfProductIncome', 'Revenue from selling goods'),
        (retail_id, 'Cost of Goods Sold', 'Cost of Goods Sold', 'SuppliesMaterialsCogs', 'Cost of items sold'),
        (retail_id, 'Store Supplies', 'Expense', 'SuppliesMaterials', 'Operating supplies for the store');
    END IF;

    -- Professional Services Accounts
    IF services_id IS NOT NULL THEN
        INSERT INTO public.industry_coa_templates (industry_id, account_name, account_type, detail_type, description) VALUES
        (services_id, 'Service Income', 'Income', 'ServiceFeeIncome', 'Revenue from consulting/services'),
        (services_id, 'Professional Fees', 'Expense', 'LegalProfessionalFees', 'Legal and accounting fees'),
        (services_id, 'Software Subscriptions', 'Expense', 'OtherBusinessExpenses', 'Monthly SaaS costs'),
        (services_id, 'Travel Expense', 'Expense', 'Travel', 'Business related travel');
    END IF;
END $$;

-- ==========================================================
-- FILE: qbo_settings_schema.sql (per-user Intuit Developer credentials)
-- ==========================================================

create table if not exists public.qbo_settings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade unique,
    client_id text not null,
    client_secret text not null,
    environment text not null default 'sandbox',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

alter table public.qbo_settings enable row level security;

drop policy if exists "Users can manage their own qbo settings" on public.qbo_settings;
drop policy if exists "qbo_settings_select_own" on public.qbo_settings;
drop policy if exists "qbo_settings_insert_own" on public.qbo_settings;
drop policy if exists "qbo_settings_update_own" on public.qbo_settings;
drop policy if exists "qbo_settings_delete_own" on public.qbo_settings;

create policy "qbo_settings_select_own" on public.qbo_settings
    for select using (auth.uid() = user_id);

create policy "qbo_settings_insert_own" on public.qbo_settings
    for insert with check (auth.uid() = user_id);

create policy "qbo_settings_update_own" on public.qbo_settings
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "qbo_settings_delete_own" on public.qbo_settings
    for delete using (auth.uid() = user_id);


