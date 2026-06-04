-- Run in Supabase SQL editor. Safe to re-run (IF NOT EXISTS).
-- Speeds filters by company_id / client_id used on most list queries.

CREATE INDEX IF NOT EXISTS idx_import_rules_client_id
  ON public.import_rules (client_id);

CREATE INDEX IF NOT EXISTS idx_bank_entries_company_id
  ON public.bank_entries (company_id);

CREATE INDEX IF NOT EXISTS idx_bank_entries_company_status
  ON public.bank_entries (company_id, status);

CREATE INDEX IF NOT EXISTS idx_quickbooks_clients_active
  ON public.quickbooks_clients (is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles (role);
