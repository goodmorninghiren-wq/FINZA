-- ============================================================
-- FINZA - COMPLETE DATABASE SCHEMA
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. COMPANIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  n8n_webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. PROFILES TABLE (User roles & firm info)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coworker')),
  firm_name TEXT,
  admin_email_display TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. QUICKBOOKS CLIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quickbooks_clients (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_in INT NOT NULL,
  x_refresh_token_expires_in INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  client_email TEXT,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. IMPORT RULES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.import_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.quickbooks_clients(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'AND',
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. MASTER RULES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.master_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'AND',
  conditions JSONB NOT NULL DEFAULT '[]',
  rule_type TEXT NOT NULL,
  actions JSONB NOT NULL DEFAULT '{}',
  applied_client_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. BANK ENTRIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bank_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  debit_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  credit_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  source TEXT NOT NULL DEFAULT 'manual',
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  bank_statement_ref TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected')) DEFAULT 'pending'
);

-- ============================================================
-- 7. INDUSTRY TEMPLATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.industry_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 8. INDUSTRY COA TEMPLATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.industry_coa_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID REFERENCES public.industry_templates(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  detail_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 9. API KEYS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. TRIGGER: Auto-create profile on new user signup
-- The FIRST user becomes 'admin', all others become 'coworker'
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN is_first_user THEN 'admin' ELSE 'coworker' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_coa_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Companies: any authenticated user can read/write their company
DROP POLICY IF EXISTS "Authenticated users can manage companies" ON public.companies;
CREATE POLICY "Authenticated users can manage companies" ON public.companies
  FOR ALL USING (auth.role() = 'authenticated');

-- Profiles: users can view all profiles, only admins can update
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- QuickBooks Clients: any authenticated user
DROP POLICY IF EXISTS "Allow all authenticated users to access QBO connections" ON public.quickbooks_clients;
CREATE POLICY "Allow all authenticated users to access QBO connections" ON public.quickbooks_clients
  FOR ALL USING (auth.role() = 'authenticated');

-- Import Rules: user-scoped
DROP POLICY IF EXISTS "Users can only manage their own import rules" ON public.import_rules;
CREATE POLICY "Users can only manage their own import rules" ON public.import_rules
  FOR ALL USING (auth.uid() = user_id);

-- Master Rules: user-scoped
DROP POLICY IF EXISTS "Users can only manage their own master rules" ON public.master_rules;
CREATE POLICY "Users can only manage their own master rules" ON public.master_rules
  FOR ALL USING (auth.uid() = user_id);

-- Bank Entries: user-scoped
DROP POLICY IF EXISTS "Users can manage their own bank entries" ON public.bank_entries;
CREATE POLICY "Users can manage their own bank entries" ON public.bank_entries
  FOR ALL USING (auth.uid() = user_id);

-- Industry Templates: readable by all authenticated
DROP POLICY IF EXISTS "Allow all to view industry templates" ON public.industry_templates;
CREATE POLICY "Allow all to view industry templates" ON public.industry_templates FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Authenticated users can manage industry templates" ON public.industry_templates;
CREATE POLICY "Authenticated users can manage industry templates" ON public.industry_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Industry COA Templates: readable by all authenticated
DROP POLICY IF EXISTS "Allow all to view COA templates" ON public.industry_coa_templates;
CREATE POLICY "Allow all to view COA templates" ON public.industry_coa_templates FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Authenticated users can manage COA templates" ON public.industry_coa_templates;
CREATE POLICY "Authenticated users can manage COA templates" ON public.industry_coa_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- API Keys: accessible by authenticated users for their company
DROP POLICY IF EXISTS "Authenticated users can manage api keys" ON public.api_keys;
CREATE POLICY "Authenticated users can manage api keys" ON public.api_keys
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 12. SEED DATA: Industry Templates
-- ============================================================
INSERT INTO public.industry_templates (name) VALUES
  ('Retail'),
  ('Professional Services'),
  ('Real Estate'),
  ('Manufacturing')
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
  retail_id UUID;
  services_id UUID;
BEGIN
  SELECT id INTO retail_id FROM public.industry_templates WHERE name = 'Retail';
  SELECT id INTO services_id FROM public.industry_templates WHERE name = 'Professional Services';

  IF retail_id IS NOT NULL THEN
    INSERT INTO public.industry_coa_templates (industry_id, account_name, account_type, detail_type, description) VALUES
      (retail_id, 'Inventory Asset', 'Other Current Asset', 'Inventory', 'Stock of goods for resale'),
      (retail_id, 'Sales of Product Income', 'Income', 'SalesOfProductIncome', 'Revenue from selling goods'),
      (retail_id, 'Cost of Goods Sold', 'Cost of Goods Sold', 'SuppliesMaterialsCogs', 'Cost of items sold'),
      (retail_id, 'Store Supplies', 'Expense', 'SuppliesMaterials', 'Operating supplies for the store')
    ON CONFLICT DO NOTHING;
  END IF;

  IF services_id IS NOT NULL THEN
    INSERT INTO public.industry_coa_templates (industry_id, account_name, account_type, detail_type, description) VALUES
      (services_id, 'Service Income', 'Income', 'ServiceFeeIncome', 'Revenue from consulting/services'),
      (services_id, 'Professional Fees', 'Expense', 'LegalProfessionalFees', 'Legal and accounting fees'),
      (services_id, 'Software Subscriptions', 'Expense', 'OtherBusinessExpenses', 'Monthly SaaS costs'),
      (services_id, 'Travel Expense', 'Expense', 'Travel', 'Business related travel')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- 13. REGISTER ADMIN USER PROFILE (admin@finza.com)
-- ============================================================
INSERT INTO public.profiles (id, email, role)
VALUES ('32e93a77-dca8-4201-990c-a2d01e2db3fa', 'admin@finza.com', 'admin')
ON CONFLICT (id) DO NOTHING;
