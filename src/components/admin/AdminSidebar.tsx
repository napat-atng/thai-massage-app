'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-stone-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
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
      <nav className="flex flex-1 gap-1 overflow-x-auto px-3 py-3 md:flex-col md:overflow-y-auto md:py-4" aria-label="Admin navigation">
        <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          เมนูหลัก
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-primary-200',
                isActive
                  ? 'bg-primary-700 text-white shadow-md shadow-primary-900/20'
                  : 'text-stone-600 hover:bg-primary-50 hover:text-primary-800',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={clsx('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-stone-400')} aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="hidden flex-col gap-1 border-t border-stone-200 px-3 py-3 md:flex">
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
