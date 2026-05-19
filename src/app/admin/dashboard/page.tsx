import Link from 'next/link'
import { AdminNav } from '@/app/admin/admin-nav'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  await requireAdmin()

  const supabase = createClient()
  const [
    { count: servicesCount },
    { count: staffCount },
    { count: usersCount },
    { count: bookingsCount },
    { count: pendingBookingsCount },
  ] = await Promise.all([
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('staff').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const cards = [
    { label: 'บริการทั้งหมด', value: servicesCount ?? 0, href: '/admin/services' },
    { label: 'หมอนวดทั้งหมด', value: staffCount ?? 0, href: '/admin/staff' },
    { label: 'ผู้ใช้ทั้งหมด', value: usersCount ?? 0, href: '/admin/users' },
    { label: 'การจองทั้งหมด', value: bookingsCount ?? 0, href: '/admin/bookings' },
    { label: 'รอยืนยัน', value: pendingBookingsCount ?? 0, href: '/admin/bookings' },
  ]

  return (
    <main className="min-h-screen">
      <div className="page-shell">
        <h1 className="mb-2 text-2xl font-bold text-stone-800">แดชบอร์ดผู้ดูแล</h1>
        <p className="mb-6 text-sm text-stone-500">จัดการข้อมูลหลังบ้านและสถานะการจอง</p>
        <AdminNav />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <Link key={card.label} href={card.href} className="card block transition-shadow hover:shadow-md">
              <p className="text-sm text-stone-500">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-stone-800">{card.value}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

