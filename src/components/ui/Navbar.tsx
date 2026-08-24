import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CalendarCheck, ClipboardList, LayoutDashboard, Leaf, LogOut, UserRound } from 'lucide-react'

export async function Navbar() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('users').select('role, full_name').eq('id', user.id).single()
    : { data: null }

  const isAdmin = profile?.role === 'admin'
  const isStaff = profile?.role === 'staff' || isAdmin

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur-xl">
      <a href="#main-content" className="skip-link">ข้ามไปยังเนื้อหาหลัก</a>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-100 text-primary-800 ring-1 ring-primary-200">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-bold leading-tight text-stone-900">นวดแผนไทย</span>
            <span className="block text-xs font-medium text-stone-500">จองนัดง่าย ดูแลครบ</span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-2" aria-label="Primary navigation">
          {user ? (
            <>
              <Link href="/my-bookings" className="btn-secondary px-3 py-2 text-sm">
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                การจองของฉัน
              </Link>
              {isAdmin ? (
                <Link href="/admin/dashboard" className="btn-secondary px-3 py-2 text-sm">
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  ผู้ดูแล
                </Link>
              ) : null}
              {isStaff ? (
                <Link href="/staff/schedule" className="btn-secondary px-3 py-2 text-sm">
                  <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                  ตารางนัด
                </Link>
              ) : null}
              <Link href="/profile" className="btn-secondary px-3 py-2 text-sm">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                {profile?.full_name ? profile.full_name.split(' ')[0] : 'โปรไฟล์'}
              </Link>
              <Link href="/book" className="btn-primary px-3 py-2 text-sm">
                จองนัดเลย
              </Link>
              <form action="/auth/logout" method="post">
                <button type="submit" className="btn-secondary px-3 py-2 text-sm">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  ออกจากระบบ
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
