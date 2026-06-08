-- ==========================================================
-- MIGRATION: Fix QBO user-isolation (RLS + user_id column)
-- Run this in Supabase SQL Editor to patch the live database.
-- ==========================================================

-- STEP 1: Ensure user_id column exists on quickbooks_clients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quickbooks_clients' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.quickbooks_clients
        ADD COLUMN user_id uuid REFERENCES auth.users(id);
    END IF;
END
$$;

-- STEP 2: Drop old open-access RLS policies
DROP POLICY IF EXISTS "Allow all authenticated users to access QBO connections" ON public.quickbooks_clients;
DROP POLICY IF EXISTS "Users can only access their own connections" ON public.quickbooks_clients;
DROP POLICY IF EXISTS "Users can only access their own QBO connections" ON public.quickbooks_clients;

-- STEP 3: Create strict per-user RLS policy
CREATE POLICY "Users can only access their own QBO connections"
  ON public.quickbooks_clients
  FOR ALL
  USING (auth.uid() = user_id);

-- STEP 4: Ensure RLS is enabled
ALTER TABLE public.quickbooks_clients ENABLE ROW LEVEL SECURITY;
