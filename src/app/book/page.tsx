import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingForm } from './booking-form'

export default async function BookPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: services }, { data: staff }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, duration_minutes, price')
      .eq('is_active', true)
      .order('price'),
    supabase
      .from('staff')
      .select('id, name, nickname')
      .eq('status', 'active')
      .order('name'),
  ])

  return (
    <main className="min-h-screen">
      <div className="page-shell max-w-5xl">
        <div className="page-header">
          <div>
            <p className="eyebrow">Booking</p>
            <h1 className="mt-2 text-3xl font-bold text-stone-950">จองนัดนวด</h1>
            <p className="mt-2 text-stone-600">เลือกบริการ วันที่ และเวลาที่สะดวก</p>
          </div>
          <Link href="/" className="btn-secondary text-sm">
            กลับหน้าแรก
          </Link>
        </div>

        <BookingForm
          userId={user.id}
          services={services ?? []}
          staff={staff ?? []}
        />
      </div>
    </main>
  )
}
