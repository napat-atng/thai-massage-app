import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ดึงบริการมาแสดง
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('price')

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur sticky top-0 z-50 border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="font-bold text-primary-700 text-lg">นวดแผนไทย</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/my-bookings" className="text-stone-600 hover:text-primary-600 text-sm font-medium">
                  การจองของฉัน
                </Link>
                <Link href="/book" className="btn-primary text-sm">
                  จองนัดเลย
                </Link>
              </>
            ) : (
              <Link href="/login" className="btn-primary text-sm">
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4">
          ผ่อนคลายร่างกาย<br />
          <span className="text-primary-600">ด้วยนวดแผนไทยแท้</span>
        </h1>
        <p className="text-stone-500 text-lg mb-8 max-w-xl mx-auto">
          จองนัดนวดออนไลน์ได้ง่ายๆ เลือกช่าง เลือกเวลา สะดวกทุกที่ทุกเวลา
        </p>
        <Link href={user ? '/book' : '/login'} className="btn-primary text-base px-8 py-3">
          จองนัดเลย →
        </Link>
      </section>

      {/* Services */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-stone-700 mb-8">บริการของเรา</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services?.map((service) => (
            <div key={service.id} className="card hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🌺</div>
              <h3 className="font-semibold text-stone-800 mb-1">{service.name}</h3>
              <p className="text-stone-500 text-sm mb-3">{service.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-primary-600 font-bold text-lg">฿{service.price.toLocaleString()}</span>
                <span className="text-stone-400 text-sm">{service.duration_minutes} นาที</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-stone-400 text-sm">
        © 2024 นวดแผนไทย · สอบถามโทร 02-xxx-xxxx
      </footer>
    </div>
  )
}
