import { AdminNav } from '@/app/admin/admin-nav'
import { updateBooking } from '@/app/admin/actions'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ALL_STATUSES, STATUS_LABEL } from '@/lib/constants'
import { recordTransaction } from '@/app/admin/actions'

const PAGE_SIZE = 20

type AdminBookingRow = {
  id: string
  booking_date: string
  start_time: string
  end_time: string
  status: string
  total_price: number
  note: string | null
  staff_id: string | null
  customer: { email: string; full_name: string | null; phone: string | null } | null
  service: { name: string } | null
  staff: { name: string; nickname: string | null } | null
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; date?: string }
}) {
  await requireAdmin()

  const page = Math.max(1, Number(searchParams.page ?? 1))
  const statusFilter = searchParams.status ?? ''
  const dateFilter = searchParams.date ?? ''
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = createClient()

  let query = supabase
    .from('bookings')
    .select(
      `id, booking_date, start_time, end_time, status, total_price, note, staff_id,
       customer:users(email, full_name, phone),
       service:services(name),
       staff:staff(name, nickname)`,
      { count: 'exact' }
    )
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false })
    .range(from, to)

  if (statusFilter) query = query.eq('status', statusFilter)
  if (dateFilter) query = query.eq('booking_date', dateFilter)

  const [{ data: bookings, error, count }, { data: staff }] = await Promise.all([
    query.returns<AdminBookingRow[]>(),
    supabase.from('staff').select('id, name, nickname').eq('status', 'active').order('name'),
  ])

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-stone-800">จัดการการจอง</h1>
        <p className="mb-6 text-sm text-stone-500">เปลี่ยนสถานะ มอบหมายหมอนวด และบันทึกการชำระเงิน</p>
        <AdminNav />

        {/* ตัวกรอง */}
        <form method="get" className="card mb-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm font-medium text-stone-700">วันที่</label>
            <input
              type="date"
              name="date"
              defaultValue={dateFilter}
              className="mt-1 block rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">สถานะ</label>
            <select
              name="status"
              defaultValue={statusFilter}
              className="mt-1 block rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">ทั้งหมด</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary text-sm">ค้นหา</button>
          <a href="/admin/bookings" className="btn-secondary text-sm">ล้างตัวกรอง</a>
          <span className="ml-auto text-sm text-stone-500">พบ {count ?? 0} รายการ</span>
        </form>

        {error ? <div className="card text-red-700 mb-4">{error.message}</div> : null}

        <div className="space-y-4">
          {bookings?.map((booking) => (
            <article key={booking.id} className="card">
              <div className="mb-4 grid gap-2 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-stone-800">{booking.service?.name ?? 'บริการนวด'}</h2>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="text-sm text-stone-500">
                    {booking.booking_date} {booking.start_time?.slice(0, 5)}–{booking.end_time?.slice(0, 5)}
                  </p>
                  <p className="text-sm text-stone-500">
                    ลูกค้า: {booking.customer?.full_name || booking.customer?.email || '-'} · {booking.customer?.phone || '-'}
                  </p>
                </div>
                <p className="font-bold text-primary-600">฿{Number(booking.total_price).toLocaleString()}</p>
              </div>

              {/* ฟอร์มอัปเดตสถานะ */}
              <form action={updateBooking} className="grid gap-3 lg:grid-cols-[160px_1fr_1fr_100px] lg:items-end">
                <input type="hidden" name="id" value={booking.id} />
                <div>
                  <label className="text-sm font-medium text-stone-700">สถานะ</label>
                  <select name="status" defaultValue={booking.status} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700">หมอนวด</label>
                  <select name="staff_id" defaultValue={booking.staff_id ?? ''} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
                    <option value="">ยังไม่ระบุ</option>
                    {staff?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.nickname ? ` (${p.nickname})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700">หมายเหตุ</label>
                  <input name="note" defaultValue={booking.note ?? ''} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
                </div>
                <button type="submit" className="btn-primary text-sm">บันทึก</button>
              </form>

              {/* ฟอร์มบันทึกการชำระเงิน (แสดงเมื่อสถานะไม่ใช่ completed/cancelled) */}
              {!['completed', 'cancelled'].includes(booking.status) ? (
                <form action={recordTransaction} className="mt-3 flex flex-wrap items-end gap-3 border-t border-stone-100 pt-3">
                  <input type="hidden" name="booking_id" value={booking.id} />
                  <input type="hidden" name="amount" value={booking.total_price} />
                  <div>
                    <label className="text-sm font-medium text-stone-700">วิธีชำระเงิน</label>
                    <select name="payment_method" className="mt-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">
                      <option value="cash">เงินสด</option>
                      <option value="transfer">โอนเงิน</option>
                      <option value="card">บัตร</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700">หมายเหตุ</label>
                    <input name="note" className="mt-1 rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="ไม่บังคับ" />
                  </div>
                  <button type="submit" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                    บันทึกชำระเงิน ฿{Number(booking.total_price).toLocaleString()}
                  </button>
                </form>
              ) : null}
            </article>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-2">
            {page > 1 ? (
              <a
                href={`/admin/bookings?page=${page - 1}&status=${statusFilter}&date=${dateFilter}`}
                className="btn-secondary text-sm"
              >
                ← ก่อนหน้า
              </a>
            ) : null}
            <span className="text-sm text-stone-500">หน้า {page} / {totalPages}</span>
            {page < totalPages ? (
              <a
                href={`/admin/bookings?page=${page + 1}&status=${statusFilter}&date=${dateFilter}`}
                className="btn-secondary text-sm"
              >
                ถัดไป →
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  )
}
