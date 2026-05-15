-- Fix RLS recursion caused by policies that query public.users from public.users policies.
-- Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.current_user_role() = 'admin'
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.current_user_role() IN ('admin', 'staff')
$$;

DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can manage services" ON public.services;
DROP POLICY IF EXISTS "Admin can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Admin manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin manage transactions" ON public.transactions;

CREATE POLICY "Admin can view all users" ON public.users
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admin can manage services" ON public.services
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admin can manage staff" ON public.staff
  FOR ALL USING (public.is_admin());

CREATE POLICY "Staff can view and update bookings" ON public.bookings
  FOR ALL USING (public.is_staff_or_admin());

CREATE POLICY "Admin manage transactions" ON public.transactions
  FOR ALL USING (public.is_admin());
