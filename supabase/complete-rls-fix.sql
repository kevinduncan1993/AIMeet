-- Complete RLS Fix - Run this in Supabase SQL Editor
-- This removes all policies and recreates them correctly

-- =====================================================
-- DROP ALL EXISTING POLICIES
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on businesses table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'businesses') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON businesses';
    END LOOP;

    -- Drop all policies on business_users table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'business_users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON business_users';
    END LOOP;
END $$;

-- =====================================================
-- BUSINESSES TABLE POLICIES
-- =====================================================

-- Allow authenticated users to create businesses
CREATE POLICY "businesses_insert_policy"
ON businesses FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view their own businesses
CREATE POLICY "businesses_select_policy"
ON businesses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM business_users
    WHERE business_users.business_id = businesses.id
    AND business_users.user_id = auth.uid()
  )
);

-- Allow owners and managers to update their businesses
CREATE POLICY "businesses_update_policy"
ON businesses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM business_users
    WHERE business_users.business_id = businesses.id
    AND business_users.user_id = auth.uid()
    AND business_users.role IN ('owner', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM business_users
    WHERE business_users.business_id = businesses.id
    AND business_users.user_id = auth.uid()
    AND business_users.role IN ('owner', 'manager')
  )
);

-- =====================================================
-- BUSINESS_USERS TABLE POLICIES
-- =====================================================

-- Allow authenticated users to insert their own business_user records
CREATE POLICY "business_users_insert_policy"
ON business_users FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to view their own business_user records
CREATE POLICY "business_users_select_policy"
ON business_users FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM business_users bu
    WHERE bu.business_id = business_users.business_id
    AND bu.user_id = auth.uid()
  )
);

-- Allow owners to manage all business_user records for their business
CREATE POLICY "business_users_update_delete_policy"
ON business_users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM business_users bu
    WHERE bu.business_id = business_users.business_id
    AND bu.user_id = auth.uid()
    AND bu.role = 'owner'
  )
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('businesses', 'business_users')
ORDER BY tablename, policyname;
