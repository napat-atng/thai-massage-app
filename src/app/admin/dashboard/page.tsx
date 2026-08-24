import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  CalendarDays,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Stethoscope,
  ArrowRight,
} from 'lucide-react'

type RecentBooking = {
  id: string
  booking_date: string
  start_time: string
  status: string
  total_price: number
  customer: { full_name: string | null; email: string } | null
  service: { name: string } | null
  staff: { name: string; nickname: string | null } | null
}

export default async function AdminDashboardPage() {
  await requireAdmin()

  const supabase = createClient()

  const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD (local)

  // เดือนนี้
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { count: totalBookings },
    { count: pendingCount },
    { count: confirmedCount },
    { count: inProgressCount },
    { count: todayBookings },
    { data: todayRevData },
    { data: monthRevData },
    { data: recentBookings },
    { data: todayStaffBookings },
    { data: staffList },
  ] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_date', todayStr),
    // รายได้วันนี้ (transactions)
    supabase.from('transactions').select('amount').eq('created_at::date' as never, todayStr as never),
    // รายได้เดือนนี้ – ใช้ gte / lt
    supabase
      .from('transactions')
      .select('amount')
      .gte('created_at', monthStart),
    // การจองล่าสุด 6 รายการ
    supabase
      .from('bookings')
      .select(`
        id, booking_date, start_time, status, total_price,
        customer:users(full_name, email),
        service:services(name),
        staff:staff(name, nickname)
      `)
      .order('created_at', { ascending: false })
      .limit(6)
      .returns<RecentBooking[]>(),
    // การจองวันนี้ จำแนกตามหมอนวด
    supabase
      .from('bookings')
      .select('staff_id, status')
      .eq('booking_date', todayStr)
      .not('staff_id', 'is', null),
    // รายชื่อหมอนวดที่ active
    supabase.from('staff').select('id, name, nickname').eq('status', 'active').order('name'),
  ])

  // คำนวณรายได้
  const todayRevenue = (todayRevData ?? []).reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0)
  const monthRevenue = (monthRevData ?? []).reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0)

  // จำนวนงานต่อหมอนวดวันนี้
  const staffJobsToday = (todayStaffBookings ?? []).reduce<Record<string, number>>((acc, b) => {
    if (b.staff_id) acc[b.staff_id] = (acc[b.staff_id] ?? 0) + 1
    return acc
  }, {})

  // --------- Stat Cards ---------
  const statCards = [
    {
      label: 'รายได้วันนี้',
      value: `฿${todayRevenue.toLocaleString()}`,
      icon: Banknote,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      ring: 'ring-emerald-200',
    },
    {
      label: 'รายได้เดือนนี้',
      value: `฿${monthRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
      ring: 'ring-primary-200',
    },
    {
      label: 'การจองวันนี้',
      value: String(todayBookings ?? 0),
      icon: CalendarDays,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      ring: 'ring-sky-200',
    },
    {
      label: 'รอยืนยัน',
      value: String(pendingCount ?? 0),
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      ring: 'ring-amber-200',
      href: '/admin/bookings?status=pending',
    },
    {
      label: 'ยืนยันแล้ว',
      value: String(confirmedCount ?? 0),
      icon: CheckCircle2,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      ring: 'ring-sky-200',
      href: '/admin/bookings?status=confirmed',
    },
    {
      label: 'กำลังให้บริการ',
      value: String(inProgressCount ?? 0),
      icon: Clock,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      ring: 'ring-violet-200',
      href: '/admin/bookings?status=in_progress',
    },
  ]

  return (
    <main className="min-h-screen">
      <div className="page-shell space-y-8">

        {/* Header */}
        <div>
          <p className="eyebrow mb-1">ภาพรวม</p>
          <h1 className="text-2xl font-bold text-stone-800">แดชบอร์ด</h1>
          <p className="mt-1 text-sm text-stone-500">
            วันนี้: {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* ======= Stat Cards ======= */}
        <section aria-label="สถิติภาพรวม">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statCards.map((card) => {
              const Icon = card.icon
              const inner = (
                <div className={`card flex items-center gap-4 ring-1 transition-shadow hover:shadow-md ${card.ring}`}>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-stone-500">{card.label}</p>
                    <p className={`mt-0.5 text-2xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                </div>
              )
              return card.href ? (
                <Link key={card.label} href={card.href} className="block">{inner}</Link>
              ) : (
                <div key={card.label}>{inner}</div>
              )
            })}
          </div>
        </section>

        {/* ======= Lower Grid: Recent Bookings + Today's Staff ======= */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

          {/* การจองล่าสุด */}
          <section aria-label="การจองล่าสุด">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-stone-800">การจองล่าสุด</h2>
              <Link href="/admin/bookings" className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline">
                ดูทั้งหมด <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-semibold text-stone-500">
                    <th className="px-4 py-3">ลูกค้า / บริการ</th>
                    <th className="px-4 py-3 hidden sm:table-cell">วันที่</th>
                    <th className="px-4 py-3 hidden md:table-cell">หมอนวด</th>
                    <th className="px-4 py-3 text-right">ราคา</th>
                    <th className="px-4 py-3">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {(recentBookings ?? []).map((b) => (
                    <tr key={b.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-stone-800 truncate max-w-[160px]">
                          {b.customer?.full_name || b.customer?.email || '—'}
                        </p>
                        <p className="text-xs text-stone-400 truncate max-w-[160px]">{b.service?.name ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-stone-600 whitespace-nowrap">
                        {b.booking_date}<br />
                        <span className="text-xs text-stone-400">{b.start_time?.slice(0, 5)}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-stone-600">
                        {b.staff?.name ?? <span className="text-stone-400 italic">ยังไม่ระบุ</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-700 whitespace-nowrap">
                        ฿{Number(b.total_price).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                  {(recentBookings ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-stone-400">ยังไม่มีการจอง</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* หมอนวดวันนี้ */}
          <section aria-label="หมอนวดวันนี้">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-stone-800">หมอนวดวันนี้</h2>
              <Link href="/admin/staff" className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline">
                จัดการ <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="card space-y-2">
              {(staffList ?? []).length === 0 && (
                <p className="py-4 text-center text-sm text-stone-400">ยังไม่มีหมอนวด</p>
              )}
              {(staffList ?? []).map((s: { id: string; name: string; nickname: string | null }) => {
                const jobs = staffJobsToday[s.id] ?? 0
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-stone-50 transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-stone-800">
                        {s.name}{s.nickname ? ` (${s.nickname})` : ''}
                      </p>
                      <p className="text-xs text-stone-400">
                        {jobs > 0 ? `${jobs} นัดวันนี้` : 'ไม่มีนัดวันนี้'}
                      </p>
                    </div>
                    {jobs > 0 && (
                      <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">
                        {jobs}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Quick Links */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">ลิงก์ด่วน</p>
              {[
                { label: 'จัดการบริการ', href: '/admin/services', icon: Stethoscope },
                { label: 'จัดการผู้ใช้', href: '/admin/users', icon: Users },
                { label: 'รายงาน', href: '/admin/reports', icon: TrendingUp },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800"
                >
                  <Icon className="h-4 w-4 shrink-0 text-stone-400" />
                  {label}
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-stone-400" />
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </main>
  )
}
