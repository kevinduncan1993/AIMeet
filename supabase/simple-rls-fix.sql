-- Simple RLS Fix - Most Permissive (For Development)
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily to clear everything
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'businesses') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON businesses';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'business_users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON business_users';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for business_users
CREATE POLICY "business_users_all"
ON business_users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create simple, permissive policies for businesses
CREATE POLICY "businesses_all"
ON businesses
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify
SELECT tablename, policyname, cmd, permissive
FROM pg_policies
WHERE tablename IN ('businesses', 'business_users');
