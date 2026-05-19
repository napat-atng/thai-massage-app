import { AdminNav } from '@/app/admin/admin-nav'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { RevenueChart } from './revenue-chart'

function formatThaiDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
}

export default async function AdminReportsPage() {
  await requireAdmin()

  const supabase = createClient()

  // วันนี้ / เดือนนี้
  const today = new Date().toISOString().slice(0, 10)
  const firstOfMonth = today.slice(0, 7) + '-01'

  const [
    { count: todayCount },
    { data: todayRevData },
    { data: monthRevData },
    { data: dailyRevData },
    { data: methodData },
  ] = await Promise.all([
    // จำนวนจองวันนี้
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('booking_date', today)
      .not('status', 'eq', 'cancelled'),

    // รายได้วันนี้
    supabase
      .from('transactions')
      .select('amount')
      .gte('paid_at', today + 'T00:00:00')
      .lte('paid_at', today + 'T23:59:59'),

    // รายได้เดือนนี้
    supabase
      .from('transactions')
      .select('amount')
      .gte('paid_at', firstOfMonth + 'T00:00:00'),

    // รายได้รายวัน 30 วันล่าสุด
    supabase
      .from('transactions')
      .select('amount, paid_at')
      .gte('paid_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .order('paid_at', { ascending: true }),

    // รายได้แยกตามวิธีชำระ
    supabase
      .from('transactions')
      .select('payment_method, amount')
      .gte('paid_at', firstOfMonth + 'T00:00:00'),
  ])

  const todayRevenue = todayRevData?.reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const monthRevenue = monthRevData?.reduce((s, t) => s + Number(t.amount), 0) ?? 0

  // รวมรายได้รายวัน
  const dailyMap: Record<string, number> = {}
  for (const t of dailyRevData ?? []) {
    const day = t.paid_at.slice(0, 10)
    dailyMap[day] = (dailyMap[day] ?? 0) + Number(t.amount)
  }
  const chartData = Object.entries(dailyMap).map(([date, revenue]) => ({
    date: formatThaiDate(date),
    revenue,
  }))

  // รวมแยกตามวิธีชำระ
  const methodMap: Record<string, number> = {}
  for (const t of methodData ?? []) {
    methodMap[t.payment_method] = (methodMap[t.payment_method] ?? 0) + Number(t.amount)
  }
  const paymentMethodLabel: Record<string, string> = {
    cash: 'เงินสด',
    transfer: 'โอนเงิน',
    card: 'บัตร',
  }

  return (
    <main className="min-h-screen">
      <div className="page-shell">
        <h1 className="mb-2 text-2xl font-bold text-stone-800">รายงาน & สถิติ</h1>
        <p className="mb-6 text-sm text-stone-500">ข้อมูลรายได้และการจอง</p>
        <AdminNav />

        {/* สรุปตัวเลข */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="card">
            <p className="text-sm text-stone-500">จองวันนี้</p>
            <p className="mt-2 text-3xl font-bold text-stone-800">{todayCount ?? 0}</p>
            <p className="mt-1 text-xs text-stone-400">รายการ</p>
          </div>
          <div className="card">
            <p className="text-sm text-stone-500">รายได้วันนี้</p>
            <p className="mt-2 text-3xl font-bold text-primary-600">฿{todayRevenue.toLocaleString()}</p>
            <p className="mt-1 text-xs text-stone-400">บาท</p>
          </div>
          <div className="card">
            <p className="text-sm text-stone-500">รายได้เดือนนี้</p>
            <p className="mt-2 text-3xl font-bold text-primary-600">฿{monthRevenue.toLocaleString()}</p>
            <p className="mt-1 text-xs text-stone-400">บาท</p>
          </div>
        </div>

        {/* กราฟรายได้ */}
        <div className="card mb-6">
          <h2 className="mb-4 font-semibold text-stone-800">รายได้รายวัน (30 วันล่าสุด)</h2>
          {chartData.length === 0 ? (
            <p className="text-center text-sm text-stone-400 py-8">ยังไม่มีข้อมูลรายได้</p>
          ) : (
            <RevenueChart data={chartData} />
          )}
        </div>

        {/* วิธีชำระเงิน */}
        <div className="card">
          <h2 className="mb-4 font-semibold text-stone-800">รายได้แยกตามวิธีชำระ (เดือนนี้)</h2>
          {Object.keys(methodMap).length === 0 ? (
            <p className="text-center text-sm text-stone-400 py-4">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(methodMap).map(([method, amount]) => {
                const pct = monthRevenue > 0 ? Math.round((amount / monthRevenue) * 100) : 0
                return (
                  <div key={method}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-stone-700">{paymentMethodLabel[method] ?? method}</span>
                      <span className="font-medium text-stone-800">฿{amount.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

