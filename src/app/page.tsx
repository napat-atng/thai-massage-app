import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'

export default async function HomePage() {
  const supabase = createClient()

  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('price')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50">
      <Navbar />

      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h1 className="mb-4 text-4xl font-bold text-stone-800 md:text-5xl">
          ผ่อนคลายร่างกาย
          <br />
          <span className="text-primary-600">ด้วยนวดแผนไทยแท้</span>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-lg text-stone-500">
          จองนัดนวดออนไลน์ได้ง่าย ๆ เลือกบริการ เลือกเวลา และติดตามสถานะได้ในที่เดียว
        </p>
        <Link href={user ? '/book' : '/login'} className="btn-primary px-8 py-3 text-base">
          จองนัดเลย →
        </Link>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold text-stone-700">บริการของเรา</h2>

        {servicesError ? (
          <div className="card mx-auto max-w-xl text-center">
            <h3 className="font-semibold text-red-700">โหลดข้อมูลบริการไม่สำเร็จ</h3>
            <p className="mt-2 text-sm text-stone-500">{servicesError.message}</p>
          </div>
        ) : null}

        {!servicesError && services?.length === 0 ? (
          <div className="card mx-auto max-w-xl text-center">
            <h3 className="font-semibold text-stone-800">ยังไม่มีบริการที่เปิดใช้งาน</h3>
            <p className="mt-2 text-sm text-stone-500">เพิ่มข้อมูลในตาราง services หรือเปิด is_active เป็น true</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services?.map((service) => (
            <div key={service.id} className="card transition-shadow hover:shadow-md">
              <div className="mb-3 text-3xl">🌺</div>
              <h3 className="mb-1 font-semibold text-stone-800">{service.name}</h3>
              <p className="mb-3 text-sm text-stone-500">{service.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary-600">฿{Number(service.price).toLocaleString()}</span>
                <span className="text-sm text-stone-400">{service.duration_minutes} นาที</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-stone-400">
        © {new Date().getFullYear()} นวดแผนไทย · เปิดบริการ 09:00–21:00 น. ทุกวัน
      </footer>
    </div>
  )
}
