import { AdminNav } from '@/app/admin/admin-nav'
import { deleteStaff, saveStaff } from '@/app/admin/actions'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

type StaffRow = {
  id: string
  user_id: string | null
  name: string
  nickname: string | null
  phone: string | null
  specialty: string[] | null
  status: string
  users: { email: string; full_name: string | null } | null
}

export default async function AdminStaffPage() {
  await requireAdmin()

  const supabase = createClient()
  const [{ data: staff, error }, { data: users }] = await Promise.all([
    supabase
      .from('staff')
      .select('id, user_id, name, nickname, phone, specialty, status, users(email, full_name)')
      .order('created_at', { ascending: false })
      .returns<StaffRow[]>(),
    supabase
      .from('users')
      .select('id, email, full_name, phone, role')
      .order('created_at', { ascending: false }),
  ])

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-stone-800">จัดการหมอนวด</h1>
        <p className="mb-6 text-sm text-stone-500">เลือกผู้ใช้ที่สมัครแล้วเพื่อสร้างโปรไฟล์หมอนวด และระบบจะตั้ง role เป็น staff</p>
        <AdminNav />

        <form action={saveStaff} className="card mb-6 grid gap-3 lg:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-stone-700">ผูกกับผู้ใช้</label>
            <select name="user_id" className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
              <option value="">ไม่ผูกผู้ใช้</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email} ({user.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">ชื่อหมอนวด</label>
            <input name="name" required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">ชื่อเล่น</label>
            <input name="nickname" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">เบอร์โทร</label>
            <input name="phone" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">ความถนัด</label>
            <input name="specialty" placeholder="นวดไทย, นวดน้ำมัน" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">สถานะ</label>
            <select name="status" defaultValue="active" className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
          <button type="submit" className="btn-primary lg:col-span-2">
            เพิ่มหมอนวด
          </button>
        </form>

        {error ? <div className="card text-red-700">{error.message}</div> : null}

        <div className="space-y-3">
          {staff?.map((person) => (
            <article key={person.id} className="card">
              <form action={saveStaff} className="grid gap-3 lg:grid-cols-3">
                <input type="hidden" name="id" value={person.id} />
                <select name="user_id" defaultValue={person.user_id ?? ''} className="rounded-lg border border-stone-300 bg-white px-3 py-2">
                  <option value="">ไม่ผูกผู้ใช้</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email} ({user.role})
                    </option>
                  ))}
                </select>
                <input name="name" defaultValue={person.name} className="rounded-lg border border-stone-300 px-3 py-2" />
                <input name="nickname" defaultValue={person.nickname ?? ''} className="rounded-lg border border-stone-300 px-3 py-2" />
                <input name="phone" defaultValue={person.phone ?? ''} className="rounded-lg border border-stone-300 px-3 py-2" />
                <input name="specialty" defaultValue={(person.specialty ?? []).join(', ')} className="rounded-lg border border-stone-300 px-3 py-2" />
                <select name="status" defaultValue={person.status} className="rounded-lg border border-stone-300 bg-white px-3 py-2">
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
                <button type="submit" className="btn-primary text-sm lg:col-span-3">
                  บันทึก
                </button>
              </form>
              <form action={deleteStaff} className="mt-3">
                <input type="hidden" name="id" value={person.id} />
                <button type="submit" className="text-sm font-medium text-red-600">
                  ลบหมอนวด
                </button>
              </form>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
