import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  await requireAdmin()

  const supabase = createClient()
  const [
    { count: servicesCount },
    { count: staffCount },
    { count: bookingsCount },
    { count: pendingBookingsCount },
  ] = await Promise.all([
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('staff').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">แดชบอร์ดผู้ดูแล</h1>
            <p className="mt-1 text-sm text-stone-500">หน้านี้เข้าได้เฉพาะผู้ใช้ role admin</p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="btn-secondary text-sm">
              หน้าแรก
            </Link>
            <form action="/auth/logout" method="post">
              <button type="submit" className="btn-secondary text-sm">
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <p className="text-sm text-stone-500">บริการทั้งหมด</p>
            <p className="mt-2 text-3xl font-bold text-stone-800">{servicesCount ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-stone-500">ช่างทั้งหมด</p>
            <p className="mt-2 text-3xl font-bold text-stone-800">{staffCount ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-stone-500">การจองทั้งหมด</p>
            <p className="mt-2 text-3xl font-bold text-stone-800">{bookingsCount ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-stone-500">รอยืนยัน</p>
            <p className="mt-2 text-3xl font-bold text-primary-600">{pendingBookingsCount ?? 0}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
