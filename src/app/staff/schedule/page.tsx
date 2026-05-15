import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireStaffOrAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

const statusLabel: Record<string, string> = {
  pending: 'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  in_progress: 'กำลังให้บริการ',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
}

type StaffBookingRow = {
  id: string
  booking_date: string
  start_time: string
  end_time: string
  status: string
  note: string | null
  total_price: number
  customer: { email: string; full_name: string | null; phone: string | null } | null
  service: { name: string } | null
}

export default async function StaffSchedulePage() {
  await requireStaffOrAdmin()

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: staffProfile, error: staffError } = await supabase
    .from('staff')
    .select('id, name, nickname')
    .eq('user_id', user.id)
    .single()

  const { data: bookings, error: bookingsError } = staffProfile
    ? await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          status,
          note,
          total_price,
          customer:users(email, full_name, phone),
          service:services(name)
        `)
        .eq('staff_id', staffProfile.id)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })
        .returns<StaffBookingRow[]>()
    : { data: null, error: null }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">ตารางนัดหมอนวด</h1>
            <p className="mt-1 text-sm text-stone-500">
              {staffProfile ? `${staffProfile.name}${staffProfile.nickname ? ` (${staffProfile.nickname})` : ''}` : 'ยังไม่พบโปรไฟล์หมอนวด'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="btn-secondary text-sm">
              หน้าแรก
            </Link>
            <form action="/auth/logout" method="post">
              <button type="submit" className="btn-secondary text-sm">
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>

        {staffError ? (
          <div className="card text-red-700">
            ยังไม่มีโปรไฟล์หมอนวดที่ผูกกับบัญชีนี้ กรุณาให้ admin เพิ่มข้อมูลในเมนูจัดการหมอนวด
          </div>
        ) : null}

        {bookingsError ? <div className="card text-red-700">{bookingsError.message}</div> : null}

        {!staffError && bookings?.length === 0 ? (
          <div className="card text-center">
            <h2 className="font-semibold text-stone-800">ยังไม่มีนัดที่ถูกมอบหมาย</h2>
            <p className="mt-2 text-sm text-stone-500">เมื่อ admin หรือลูกค้าเลือกคุณเป็นหมอนวด รายการจะแสดงที่นี่</p>
          </div>
        ) : null}

        <div className="space-y-4">
          {bookings?.map((booking) => (
            <article key={booking.id} className="card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-stone-800">{booking.service?.name ?? 'บริการนวด'}</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {booking.booking_date} เวลา {booking.start_time.slice(0, 5)}-{booking.end_time.slice(0, 5)}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    ลูกค้า: {booking.customer?.full_name || booking.customer?.email || '-'} · {booking.customer?.phone || '-'}
                  </p>
                  {booking.note ? <p className="mt-2 text-sm text-stone-600">หมายเหตุ: {booking.note}</p> : null}
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                  {statusLabel[booking.status] ?? booking.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
