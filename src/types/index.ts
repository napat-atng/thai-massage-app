export type UserRole = 'admin' | 'staff' | 'customer'
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'transfer' | 'card'

export interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
  is_active: boolean
  created_at: string
}

export interface Staff {
  id: string
  user_id: string | null
  name: string
  nickname: string | null
  phone: string | null
  specialty: string[]
  status: 'active' | 'inactive'
  hire_date: string
  avatar_url: string | null
  created_at: string
}

export interface StaffSchedule {
  id: string
  staff_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export interface Booking {
  id: string
  customer_id: string
  staff_id: string
  service_id: string
  booking_date: string
  start_time: string
  end_time: string
  status: BookingStatus
  total_price: number
  note: string | null
  created_at: string
  updated_at: string
  // Relations
  customer?: User
  staff?: Staff
  service?: Service
}

export interface Transaction {
  id: string
  booking_id: string
  amount: number
  payment_method: PaymentMethod
  paid_at: string
  created_by: string
  note: string | null
  created_at: string
  booking?: Booking
}

// Dashboard stats
export interface DashboardStats {
  todayBookings: number
  todayRevenue: number
  monthlyRevenue: number
  totalCustomers: number
  pendingBookings: number
}
