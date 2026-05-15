import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type BookingRow = {
  id: string
  booking_date: string
  start_time: string
  end_time: string
  status: string
  total_price: number
  note: string | null
  service: {
    name: string
  } | null
  staff: {
    name: string
    nickname: string | null
  } | null
}

const statusLabel: Record<string, string> = {
  pending: 'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  in_progress: 'กำลังให้บริการ',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
}

const badgeClassName: Record<string, string> = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  in_progress: 'badge-in_progress',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
}

export default async function MyBookingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_date,
      start_time,
      end_time,
      status,
      total_price,
      note,
      service:services(name),
      staff:staff(name, nickname)
    `)
    .eq('customer_id', user.id)
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false })
    .returns<BookingRow[]>()

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">การจองของฉัน</h1>
            <p className="mt-1 text-sm text-stone-500">ดูสถานะและรายละเอียดนัดหมายทั้งหมด</p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="btn-secondary text-sm">
              หน้าแรก
            </Link>
            <Link href="/book" className="btn-primary text-sm">
              จองเพิ่ม
            </Link>
          </div>
        </div>

        {error ? (
          <div className="card">
            <h2 className="text-lg font-semibold text-red-700">โหลดข้อมูลไม่สำเร็จ</h2>
            <p className="mt-2 text-sm text-stone-500">{error.message}</p>
          </div>
        ) : null}

        {!error && bookings?.length === 0 ? (
          <div className="card text-center">
            <h2 className="text-lg font-semibold text-stone-800">ยังไม่มีการจอง</h2>
            <p className="mt-2 text-sm text-stone-500">เริ่มจองนัดแรกของคุณได้เลย</p>
            <Link href="/book" className="btn-primary mt-5 inline-block">
              จองนัด
            </Link>
          </div>
        ) : null}

        {!error && bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <article key={booking.id} className="card">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-stone-800">
                        {booking.service?.name ?? 'บริการนวด'}
                      </h2>
                      <span className={badgeClassName[booking.status] ?? 'badge-pending'}>
                        {statusLabel[booking.status] ?? booking.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone-500">
                      {booking.booking_date} เวลา {booking.start_time.slice(0, 5)}-{booking.end_time.slice(0, 5)}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      ช่าง: {booking.staff?.name ?? 'ให้ร้านจัดช่างให้'}
                      {booking.staff?.nickname ? ` (${booking.staff.nickname})` : ''}
                    </p>
                    {booking.note ? (
                      <p className="mt-2 text-sm text-stone-600">หมายเหตุ: {booking.note}</p>
                    ) : null}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-bold text-primary-600">
                      ฿{Number(booking.total_price).toLocaleString()}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  )
}
