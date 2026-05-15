-- Optional tighter staff booking policy.
-- Run after fix-rls-recursion.sql if you want staff users to view bookings assigned to their own staff profile.

CREATE OR REPLACE FUNCTION public.current_staff_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id
  FROM public.staff
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

DROP POLICY IF EXISTS "Staff can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff can view and update bookings" ON public.bookings;

CREATE POLICY "Staff can view own bookings" ON public.bookings
  FOR SELECT USING (staff_id = public.current_staff_id());
