-- Replace this email with the account that should become admin.
-- Run in Supabase SQL Editor after the user has signed up at least once.

UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@example.com';

SELECT id, email, full_name, role
FROM public.users
WHERE email = 'admin@example.com';
