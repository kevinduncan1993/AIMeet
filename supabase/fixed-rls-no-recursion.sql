-- Fixed RLS Policies - NO RECURSION
-- Run this in Supabase SQL Editor

-- =====================================================
-- DROP ALL EXISTING POLICIES (Clean Slate)
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
-- BUSINESS_USERS TABLE - Simple, Non-Recursive Policies
-- =====================================================

-- Allow authenticated users to insert records where they are the user
CREATE POLICY "business_users_insert_own"
ON business_users FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to view their own records (no recursion - direct check)
CREATE POLICY "business_users_select_own"
ON business_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to update/delete their own records
CREATE POLICY "business_users_update_own"
ON business_users FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "business_users_delete_own"
ON business_users FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- BUSINESSES TABLE - Can reference business_users safely
-- =====================================================

-- Allow any authenticated user to create a business
CREATE POLICY "businesses_insert_authenticated"
ON businesses FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view businesses they're members of
CREATE POLICY "businesses_select_member"
ON businesses FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT business_id
    FROM business_users
    WHERE user_id = auth.uid()
  )
);

-- Allow users to update businesses they're members of
CREATE POLICY "businesses_update_member"
ON businesses FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT business_id
    FROM business_users
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'manager')
  )
);

-- Allow users to delete businesses they own
CREATE POLICY "businesses_delete_owner"
ON businesses FOR DELETE
TO authenticated
USING (
  id IN (
    SELECT business_id
    FROM business_users
    WHERE user_id = auth.uid()
    AND role = 'owner'
  )
);

-- =====================================================
-- VERIFY POLICIES
-- =====================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command
FROM pg_policies
WHERE tablename IN ('businesses', 'business_users')
ORDER BY tablename, policyname;
