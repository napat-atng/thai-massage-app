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
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">จองนัดนวด</h1>
            <p className="mt-1 text-sm text-stone-500">เลือกบริการ วันที่ และเวลาที่สะดวก</p>
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
