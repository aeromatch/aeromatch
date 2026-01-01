-- FIX: Add INSERT policy for billing_customers
-- Run this in Supabase SQL Editor

-- Allow users to insert their own billing customer record
CREATE POLICY "Users can insert own billing customer" ON billing_customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own billing customer record
CREATE POLICY "Users can update own billing customer" ON billing_customers
  FOR UPDATE USING (auth.uid() = user_id);

