import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingCard } from '@/components/ui/BookingCard'
import { cancelBooking } from '@/app/admin/actions'

type BookingRow = {
  id: string
  booking_date: string
  start_time: string
  end_time: string
  status: string
  total_price: number
  note: string | null
  service: { name: string } | null
  staff: { name: string; nickname: string | null } | null
}

export default async function MyBookingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id, booking_date, start_time, end_time, status, total_price, note,
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
            <Link href="/" className="btn-secondary text-sm">หน้าแรก</Link>
            <Link href="/book" className="btn-primary text-sm">จองเพิ่ม</Link>
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
            <Link href="/book" className="btn-primary mt-5 inline-block">จองนัด</Link>
          </div>
        ) : null}

        {!error && bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                actions={
                  ['pending', 'confirmed'].includes(booking.status) ? (
                    <form action={cancelBooking}>
                      <input type="hidden" name="id" value={booking.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        ยกเลิกการจอง
                      </button>
                    </form>
                  ) : null
                }
              />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  )
}
