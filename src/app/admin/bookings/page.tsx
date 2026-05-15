import { AdminNav } from '@/app/admin/admin-nav'
import { updateBooking } from '@/app/admin/actions'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

const statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']

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

export default async function AdminBookingsPage() {
  await requireAdmin()

  const supabase = createClient()
  const [{ data: bookings, error }, { data: staff }] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        status,
        total_price,
        note,
        customer:users(email, full_name, phone),
        service:services(name),
        staff_id,
        staff:staff(name, nickname)
      `)
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false })
      .returns<AdminBookingRow[]>(),
    supabase.from('staff').select('id, name, nickname').eq('status', 'active').order('name'),
  ])

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-stone-800">จัดการการจอง</h1>
        <p className="mb-6 text-sm text-stone-500">เปลี่ยนสถานะ มอบหมายหมอนวด และแก้หมายเหตุ</p>
        <AdminNav />

        {error ? <div className="card text-red-700">{error.message}</div> : null}

        <div className="space-y-4">
          {bookings?.map((booking) => (
            <article key={booking.id} className="card">
              <div className="mb-4 grid gap-2 lg:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="font-semibold text-stone-800">{booking.service?.name ?? 'บริการนวด'}</h2>
                  <p className="text-sm text-stone-500">
                    {booking.booking_date} {booking.start_time?.slice(0, 5)}-{booking.end_time?.slice(0, 5)}
                  </p>
                  <p className="text-sm text-stone-500">
                    ลูกค้า: {booking.customer?.full_name || booking.customer?.email || '-'} · {booking.customer?.phone || '-'}
                  </p>
                </div>
                <p className="font-bold text-primary-600">฿{Number(booking.total_price).toLocaleString()}</p>
              </div>

              <form action={updateBooking} className="grid gap-3 lg:grid-cols-[160px_1fr_1fr_100px] lg:items-end">
                <input type="hidden" name="id" value={booking.id} />
                <div>
                  <label className="text-sm font-medium text-stone-700">สถานะ</label>
                  <select name="status" defaultValue={booking.status} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700">หมอนวด</label>
                  <select name="staff_id" defaultValue={booking.staff_id ?? ''} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
                    <option value="">ยังไม่ระบุ</option>
                    {staff?.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}{person.nickname ? ` (${person.nickname})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700">หมายเหตุ</label>
                  <input name="note" defaultValue={booking.note ?? ''} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
                </div>
                <button type="submit" className="btn-primary text-sm">
                  บันทึก
                </button>
              </form>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
