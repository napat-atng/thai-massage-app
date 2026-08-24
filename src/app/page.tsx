import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarCheck, Clock3, ShieldCheck, Sparkles } from 'lucide-react'
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
    <div className="min-h-screen">
      <Navbar />

      <main id="main-content" tabIndex={-1}>
        <section className="page-shell grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <div>
            <p className="eyebrow">Thai Massage Booking</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight text-stone-950 md:text-5xl">
              จองคิวนวดแผนไทยได้ง่าย ในบรรยากาศที่ดูแลคุณตั้งแต่ก่อนมาถึงร้าน
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-stone-600 md:text-lg">
              เลือกบริการ เวลา และหมอนวดที่ต้องการ พร้อมติดตามสถานะการจองได้ในที่เดียว เหมาะทั้งลูกค้าประจำและผู้ที่มาครั้งแรก
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={user ? '/book' : '/login'} className="btn-primary px-6 py-3 text-base">
                จองนัดเลย
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link href="#services" className="btn-secondary px-6 py-3 text-base">
                ดูบริการ
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Booking benefits">
              {[
                { icon: CalendarCheck, label: 'จองออนไลน์', detail: 'ไม่ต้องโทรถามคิว' },
                { icon: Clock3, label: '09:00-21:00', detail: 'เปิดบริการทุกวัน' },
                { icon: ShieldCheck, label: 'ติดตามสถานะ', detail: 'รู้ผลการจองชัดเจน' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-xl border border-white/80 bg-white/80 p-4 shadow-sm">
                    <Icon className="h-5 w-5 text-primary-700" aria-hidden="true" />
                    <p className="mt-3 font-semibold text-stone-900">{item.label}</p>
                    <p className="mt-1 text-sm text-stone-500">{item.detail}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-xl shadow-stone-300/40">
            <Image
              src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1100&q=80"
              alt="บรรยากาศการนวดเพื่อผ่อนคลายในสปา"
              width={1100}
              height={840}
              priority
              className="h-[420px] w-full object-cover"
            />
            <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/70 bg-white/90 p-4 shadow-lg backdrop-blur">
              <p className="text-sm font-semibold text-stone-900">วันนี้พร้อมดูแลคุณ</p>
              <p className="mt-1 text-sm text-stone-600">เลือกบริการที่เหมาะกับร่างกาย แล้วให้ร้านช่วยจัดเวลาที่ลงตัว</p>
            </div>
          </div>
        </section>

        <section id="services" className="border-y border-stone-200 bg-white/70">
          <div className="page-shell py-12">
            <div className="page-header">
              <div>
                <p className="eyebrow">Services</p>
                <h2 className="mt-2 text-3xl font-bold text-stone-950">บริการของเรา</h2>
                <p className="mt-2 max-w-2xl text-stone-600">
                  รายการบริการที่เปิดให้จอง เลือกจากเวลา ราคา และรายละเอียดที่เหมาะกับคุณ
                </p>
              </div>
              <Link href={user ? '/book' : '/login'} className="btn-primary">
                เริ่มจอง
              </Link>
            </div>

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
                <article key={service.id} className="card flex min-h-56 flex-col transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-100 text-primary-800">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">{service.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-stone-600">{service.description}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
                    <span className="text-xl font-bold text-primary-700">฿{Number(service.price).toLocaleString()}</span>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-600">
                      {service.duration_minutes} นาที
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-stone-500">
        © {new Date().getFullYear()} นวดแผนไทย · เปิดบริการ 09:00-21:00 น. ทุกวัน
      </footer>
    </div>
  )
}
