-- =============================================
-- Thai Massage App - Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS (synced with Supabase Auth)
-- =============================================
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'staff', 'customer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SERVICES (บริการนวด)
-- =============================================
CREATE TABLE public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default services
INSERT INTO public.services (name, description, duration_minutes, price) VALUES
('นวดแผนไทย 60 นาที', 'นวดแผนไทยโบราณ ผ่อนคลายกล้ามเนื้อ', 60, 300),
('นวดแผนไทย 90 นาที', 'นวดแผนไทยโบราณ ผ่อนคลายกล้ามเนื้อ', 90, 400),
('นวดน้ำมันอโรมา 60 นาที', 'นวดน้ำมันหอมระเหย ผ่อนคลายจิตใจ', 60, 450),
('นวดน้ำมันอโรมา 90 นาที', 'นวดน้ำมันหอมระเหย ผ่อนคลายจิตใจ', 90, 600),
('นวดเท้า 45 นาที', 'นวดฝ่าเท้ากระตุ้นจุดสะท้อน', 45, 250),
('นวดหน้า 30 นาที', 'นวดหน้าและศีรษะ ลดความเครียด', 30, 200);

-- =============================================
-- STAFF (พนักงาน/ช่าง)
-- =============================================
CREATE TABLE public.staff (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  phone TEXT,
  specialty TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  hire_date DATE DEFAULT CURRENT_DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STAFF SCHEDULES (ตารางเวลาพนักงาน)
-- =============================================
CREATE TABLE public.staff_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  UNIQUE(staff_id, day_of_week)
);

-- =============================================
-- BOOKINGS (การจองนัด)
-- =============================================
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled')),
  total_price DECIMAL(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRANSACTIONS (รายได้/การชำระเงิน)
-- =============================================
CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash','transfer','card')),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Helper functions for role checks.
-- SECURITY DEFINER avoids recursive RLS when policies need to read public.users.
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

-- Users: ดูได้เฉพาะตัวเอง, admin ดูได้ทั้งหมด
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin can view all users" ON public.users
  FOR ALL USING (public.is_admin());

-- Services: ทุกคนดูได้, admin แก้ไขได้
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admin can manage services" ON public.services
  FOR ALL USING (public.is_admin());

-- Staff: ทุกคนดูได้, admin แก้ไขได้
CREATE POLICY "Anyone can view active staff" ON public.staff
  FOR SELECT USING (status = 'active');
CREATE POLICY "Admin can manage staff" ON public.staff
  FOR ALL USING (public.is_admin());

-- Bookings: ลูกค้าดูได้เฉพาะของตัวเอง, admin/staff ดูได้ทั้งหมด
CREATE POLICY "Customers view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admin manage all bookings" ON public.bookings
  FOR ALL USING (public.is_staff_or_admin());

-- Transactions: admin เท่านั้น
CREATE POLICY "Admin manage transactions" ON public.transactions
  FOR ALL USING (public.is_admin());

-- =============================================
-- INDEXES (ช่วยให้ query เร็วขึ้น)
-- =============================================
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_staff ON public.bookings(staff_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_transactions_booking ON public.transactions(booking_id);
