-- Fix RLS policies for business creation
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert businesses" ON businesses;
DROP POLICY IF EXISTS "Owners can manage business_users" ON business_users;

-- Create more permissive policies for business creation
CREATE POLICY "Authenticated users can create businesses" ON businesses
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can insert their own business_user records" ON business_users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their business_user records" ON business_users
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow business_user management for owners
CREATE POLICY "Owners can manage their business users" ON business_users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = business_users.business_id
      AND bu.user_id = auth.uid()
      AND bu.role = 'owner'
    )
  );
