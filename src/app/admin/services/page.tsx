import { AdminNav } from '@/app/admin/admin-nav'
import { deleteService, saveService } from '@/app/admin/actions'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

export default async function AdminServicesPage() {
  await requireAdmin()

  const supabase = createClient()
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, description, duration_minutes, price, is_active')
    .order('price')

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-stone-800">จัดการบริการ</h1>
        <p className="mb-6 text-sm text-stone-500">เพิ่ม แก้ไข ปิด/เปิดบริการที่ลูกค้าจองได้</p>
        <AdminNav />

        <form action={saveService} className="card mb-6 grid gap-3 lg:grid-cols-[1fr_1fr_120px_120px_120px] lg:items-end">
          <div>
            <label className="text-sm font-medium text-stone-700">ชื่อบริการ</label>
            <input name="name" required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">รายละเอียด</label>
            <input name="description" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">นาที</label>
            <input name="duration_minutes" type="number" defaultValue={60} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">ราคา</label>
            <input name="price" type="number" defaultValue={0} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input name="is_active" type="checkbox" defaultChecked />
            เปิดใช้
          </label>
          <button type="submit" className="btn-primary lg:col-span-5">
            เพิ่มบริการ
          </button>
        </form>

        {error ? <div className="card text-red-700">{error.message}</div> : null}

        <div className="space-y-3">
          {services?.map((service) => (
            <article key={service.id} className="card">
              <form action={saveService} className="grid gap-3 lg:grid-cols-[1fr_1fr_110px_110px_100px_90px] lg:items-end">
                <input type="hidden" name="id" value={service.id} />
                <input name="name" defaultValue={service.name} className="rounded-lg border border-stone-300 px-3 py-2" />
                <input name="description" defaultValue={service.description ?? ''} className="rounded-lg border border-stone-300 px-3 py-2" />
                <input name="duration_minutes" type="number" defaultValue={service.duration_minutes} className="rounded-lg border border-stone-300 px-3 py-2" />
                <input name="price" type="number" defaultValue={service.price} className="rounded-lg border border-stone-300 px-3 py-2" />
                <label className="flex items-center gap-2 text-sm">
                  <input name="is_active" type="checkbox" defaultChecked={service.is_active} />
                  เปิด
                </label>
                <button type="submit" className="btn-primary text-sm">
                  บันทึก
                </button>
              </form>
              <form action={deleteService} className="mt-3">
                <input type="hidden" name="id" value={service.id} />
                <button type="submit" className="text-sm font-medium text-red-600">
                  ลบ
                </button>
              </form>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
