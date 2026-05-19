import Link from 'next/link'
import { headers } from 'next/headers'
import {
  BarChart3,
  CalendarDays,
  Home,
  LayoutDashboard,
  LogOut,
  Scissors,
  Users,
  UserCog,
  Leaf,
} from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/admin/dashboard', label: 'แดชบอร์ด',    icon: LayoutDashboard },
  { href: '/admin/bookings',  label: 'การจอง',       icon: CalendarDays },
  { href: '/admin/staff',     label: 'หมอนวด',       icon: Users },
  { href: '/admin/services',  label: 'บริการ',        icon: Scissors },
  { href: '/admin/users',     label: 'ผู้ใช้',        icon: UserCog },
  { href: '/admin/reports',   label: 'รายงาน',       icon: BarChart3 },
]

export function AdminSidebar() {
  // Get current pathname on server via headers (x-pathname set in middleware or layout)
  const headersList = headers()
  const pathname = headersList.get('x-pathname') ?? ''

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-stone-200 bg-white">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-stone-200 px-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-100 text-primary-800 ring-1 ring-primary-200">
          <Leaf className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-stone-900">นวดแผนไทย</p>
          <p className="text-[11px] font-medium text-primary-600">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          เมนูหลัก
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-200'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
              )}
            >
              <Icon className={clsx('h-4 w-4 shrink-0', isActive ? 'text-primary-700' : 'text-stone-400')} aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-1 border-t border-stone-200 px-3 py-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
        >
          <Home className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
          หน้าแรก
        </Link>
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  )
}
