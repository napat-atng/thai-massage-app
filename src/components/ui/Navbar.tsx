import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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
    <nav className="sticky top-0 z-50 border-b border-stone-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <span className="text-lg font-bold text-primary-700">นวดแผนไทย</span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/my-bookings" className="text-sm font-medium text-stone-600 hover:text-primary-600">
                การจองของฉัน
              </Link>
              {isAdmin ? (
                <Link href="/admin/dashboard" className="text-sm font-medium text-stone-600 hover:text-primary-600">
                  ผู้ดูแล
                </Link>
              ) : null}
              {isStaff ? (
                <Link href="/staff/schedule" className="text-sm font-medium text-stone-600 hover:text-primary-600">
                  ตารางนัด
                </Link>
              ) : null}
              <Link href="/profile" className="text-sm font-medium text-stone-600 hover:text-primary-600">
                {profile?.full_name ? profile.full_name.split(' ')[0] : 'โปรไฟล์'}
              </Link>
              <Link href="/book" className="btn-primary text-sm">
                จองนัดเลย
              </Link>
              <form action="/auth/logout" method="post">
                <button type="submit" className="btn-secondary text-sm">
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
