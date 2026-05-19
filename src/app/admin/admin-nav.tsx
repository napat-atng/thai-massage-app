import Link from 'next/link'
import { BarChart3, CalendarDays, Home, LayoutDashboard, LogOut, Scissors, Users, WalletCards } from 'lucide-react'

const adminLinks = [
  { href: '/admin/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'การจอง', icon: CalendarDays },
  { href: '/admin/staff', label: 'หมอนวด', icon: Users },
  { href: '/admin/services', label: 'บริการ', icon: Scissors },
  { href: '/admin/users', label: 'ผู้ใช้', icon: WalletCards },
  { href: '/admin/reports', label: 'รายงาน', icon: BarChart3 },
]

export function AdminNav() {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white/80 p-2 shadow-sm">
      {adminLinks.map((link) => {
        const Icon = link.icon
        return (
          <Link key={link.href} href={link.href} className="btn-secondary px-3 py-2 text-sm">
            <Icon className="h-4 w-4" aria-hidden="true" />
            {link.label}
          </Link>
        )
      })}
      <Link href="/" className="btn-secondary text-sm">
        <Home className="h-4 w-4" aria-hidden="true" />
        หน้าแรก
      </Link>
      <form action="/auth/logout" method="post">
        <button type="submit" className="btn-secondary text-sm">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          ออกจากระบบ
        </button>
      </form>
    </div>
  )
}
