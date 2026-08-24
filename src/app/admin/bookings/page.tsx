import { AdminNav } from '@/app/admin/admin-nav'
import { updateBooking, recordTransaction, cancelBookingAdmin } from '@/app/admin/actions'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ALL_STATUSES, STATUS_LABEL } from '@/lib/constants'
import { MutationForm } from '@/components/ui/MutationForm'
import { CheckCircle2, Circle, LockKeyhole, Ban } from 'lucide-react'

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

/**
 * ขั้นตอนหลักของ flow การจอง (ไม่รวม cancelled)
 * pending → confirmed → in_progress → completed
 */
const BOOKING_STEPS = [
  { status: 'pending',     label: 'รับคำขอ' },
  { status: 'confirmed',   label: 'ยืนยันนัด' },
  { status: 'in_progress', label: 'ให้บริการ' },
  { status: 'completed',   label: 'ชำระเงินแล้ว' },
] as const

type BookingStepStatus = (typeof BOOKING_STEPS)[number]['status']

/** คืน index ของขั้นตอนปัจจุบัน (0-based) หรือ -1 ถ้า cancelled */
function currentStepIndex(status: string): number {
  return BOOKING_STEPS.findIndex((s) => s.status === status)
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

  // โหลด payment ทุกรายการในหน้านี้
  const bookingIds = bookings?.map((b) => b.id) ?? []
  let payments: { booking_id: string }[] = []
  if (bookingIds.length) {
    const { data } = await supabase.from('transactions').select('booking_id').in('booking_id', bookingIds)
    payments = data ?? []
  }
  const paidBookingIds = new Set(payments.map((p) => p.booking_id))

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <main className="min-h-screen">
      <div className="page-shell">
        <h1 className="mb-2 text-2xl font-bold text-stone-800">จัดการการจอง</h1>
        <p className="mb-6 text-sm text-stone-500">เปลี่ยนสถานะ มอบหมายหมอนวด และบันทึกการชำระเงิน</p>

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
          {bookings?.map((booking) => {
            const isPaid = paidBookingIds.has(booking.id)
            const isCancelled = booking.status === 'cancelled'
            const isLocked = isPaid || isCancelled   // ล็อกทั้งหมด ถ้าจ่ายแล้วหรือยกเลิก
            const stepIdx = currentStepIndex(booking.status)

            // ขั้นตอนถัดไปที่ทำได้จาก status ปัจจุบัน (เฉพาะ non-locked)
            const nextStatus: Record<string, string> = {
              pending:     'confirmed',
              confirmed:   'in_progress',
            }
            const canAdvance = !isLocked && nextStatus[booking.status] !== undefined
            const canPayment = !isLocked && booking.status === 'in_progress'

            return (
              <article key={booking.id} className="card">
                {/* Header */}
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
                    {booking.staff && (
                      <p className="text-sm text-stone-500">
                        หมอนวด: {booking.staff.name}{booking.staff.nickname ? ` (${booking.staff.nickname})` : ''}
                      </p>
                    )}
                  </div>
                  <p className="font-bold text-primary-600 text-lg">฿{Number(booking.total_price).toLocaleString()}</p>
                </div>

                {/* Progress Steps */}
                {isCancelled ? (
                  <div className="mb-5 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
                    <Ban className="h-4 w-4 shrink-0" aria-hidden="true" />
                    การจองนี้ถูกยกเลิกแล้ว
                  </div>
                ) : (
                  <ol className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="ขั้นตอนการจอง">
                    {BOOKING_STEPS.map((step, index) => {
                      const isComplete = stepIdx >= 0 && index <= stepIdx
                      const isCurrent = index === stepIdx
                      return (
                        <li
                          key={step.status}
                          className={[
                            'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors',
                            isComplete
                              ? isCurrent && !isPaid
                                ? 'bg-primary-200 text-primary-900 ring-1 ring-primary-300'
                                : 'bg-primary-100 text-primary-900'
                              : 'bg-stone-100 text-stone-400',
                          ].join(' ')}
                        >
                          {isComplete
                            ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                            : <Circle className="h-4 w-4 shrink-0" aria-hidden="true" />
                          }
                          {step.label}
                        </li>
                      )
                    })}
                  </ol>
                )}

                {/* ============================================================
                    ฟอร์มอัปเดตขั้นตอน (pending → confirmed, confirmed → in_progress)
                    แสดงเฉพาะเมื่อยังไม่ lock และมีขั้นตอนถัดไป
                ============================================================ */}
                {canAdvance && (
                  <MutationForm
                    action={updateBooking}
                    successMessage="อัปเดตการจองแล้ว"
                    confirmMessage={
                      booking.status === 'pending'
                        ? 'ยืนยันนัดและมอบหมายหมอนวด?'
                        : 'เริ่มให้บริการลูกค้าแล้วใช่ไหม?'
                    }
                    className="border-t border-stone-100 pt-4 mt-2 grid gap-3 sm:grid-cols-[1fr_1fr_auto] lg:grid-cols-[180px_1fr_auto] lg:items-end"
                  >
                    <input type="hidden" name="id" value={booking.id} />
                    <input type="hidden" name="status" value={nextStatus[booking.status]} />

                    {/* มอบหมายหมอนวด — แสดงตอน pending เท่านั้น (ก่อน confirm) */}
                    {booking.status === 'pending' && (
                      <div>
                        <label className="text-sm font-medium text-stone-700">
                          หมอนวด <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="staff_id"
                          defaultValue={booking.staff_id ?? ''}
                          required
                          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">— เลือกหมอนวด —</option>
                          {staff?.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}{p.nickname ? ` (${p.nickname})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* หมายเหตุ */}
                    <div>
                      <label className="text-sm font-medium text-stone-700">หมายเหตุ</label>
                      <input
                        name="note"
                        defaultValue={booking.note ?? ''}
                        placeholder="ไม่บังคับ"
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <button type="submit" className="btn-primary text-sm self-end">
                      {booking.status === 'pending' ? '✓ ยืนยันนัด' : '▶ เริ่มให้บริการ'}
                    </button>
                  </MutationForm>
                )}

                {/* ============================================================
                    ฟอร์มบันทึกการชำระเงิน (in_progress เท่านั้น)
                    เมื่อชำระแล้ว → status เปลี่ยนเป็น completed และล็อกทุกอย่าง
                ============================================================ */}
                {canPayment && (
                  <MutationForm
                    action={recordTransaction}
                    successMessage="บันทึกการชำระเงินแล้ว"
                    confirmMessage={`ยืนยันรับชำระเงิน ฿${Number(booking.total_price).toLocaleString()} ใช่ไหม?`}
                    className="mt-3 border-t border-stone-100 pt-4 flex flex-wrap items-end gap-3"
                  >
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
                    <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition">
                      💳 รับชำระ ฿{Number(booking.total_price).toLocaleString()}
                    </button>
                  </MutationForm>
                )}

                {/* ============================================================
                    แบนเนอร์ล็อก: จ่ายแล้ว
                ============================================================ */}
                {isPaid && (
                  <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
                    <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden="true" />
                    บันทึกการชำระเงินแล้ว — สถานะการจองถูกล็อก
                  </p>
                )}

                {/* ============================================================
                    ปุ่มยกเลิก — แสดงเฉพาะ pending / confirmed (ยังไม่เริ่มบริการ)
                ============================================================ */}
                {!isLocked && ['pending', 'confirmed'].includes(booking.status) && (
                  <div className="mt-3 flex justify-end border-t border-stone-100 pt-3">
                    <MutationForm
                      action={cancelBookingAdmin}
                      successMessage="ยกเลิกการจองแล้ว"
                      confirmMessage="ยืนยันยกเลิกการจองนี้? ไม่สามารถย้อนกลับได้"
                      className="contents"
                    >
                      <input type="hidden" name="id" value={booking.id} />
                      <button type="submit" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition">
                        ✕ ยกเลิกการจอง
                      </button>
                    </MutationForm>
                  </div>
                )}
              </article>
            )
          })}
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
