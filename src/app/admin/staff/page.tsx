import { AdminNav } from '@/app/admin/admin-nav'
import { deleteStaff, saveStaff } from '@/app/admin/actions'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { saveStaffSchedule, DAY_NAMES } from './schedule-actions'

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

type ScheduleRow = {
  staff_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export default async function AdminStaffPage() {
  await requireAdmin()

  const supabase = createClient()
  const [{ data: staff, error }, { data: users }, { data: schedules }] = await Promise.all([
    supabase
      .from('staff')
      .select('id, user_id, name, nickname, phone, specialty, status, users(email, full_name)')
      .order('created_at', { ascending: false })
      .returns<StaffRow[]>(),
    supabase
      .from('users')
      .select('id, email, full_name, role')
      .order('created_at', { ascending: false }),
    supabase
      .from('staff_schedules')
      .select('staff_id, day_of_week, start_time, end_time')
      .returns<ScheduleRow[]>(),
  ])

  // จัดตารางเวลาเป็น map: staff_id -> { day_of_week: {start, end} }
  const scheduleMap: Record<string, Record<number, { start_time: string; end_time: string }>> = {}
  for (const s of schedules ?? []) {
    if (!scheduleMap[s.staff_id]) scheduleMap[s.staff_id] = {}
    scheduleMap[s.staff_id][s.day_of_week] = { start_time: s.start_time, end_time: s.end_time }
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-stone-800">จัดการหมอนวด</h1>
        <p className="mb-6 text-sm text-stone-500">เพิ่มหมอนวด ตั้งตารางเวลา และจัดการข้อมูล</p>
        <AdminNav />

        {/* ฟอร์มเพิ่มหมอนวดใหม่ */}
        <form action={saveStaff} className="card mb-6 grid gap-3 lg:grid-cols-2">
          <h2 className="text-base font-semibold text-stone-800 lg:col-span-2">เพิ่มหมอนวดใหม่</h2>
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
            <label className="text-sm font-medium text-stone-700">ความถนัด (คั่นด้วยจุลภาค)</label>
            <input name="specialty" placeholder="นวดไทย, นวดน้ำมัน" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">สถานะ</label>
            <select name="status" defaultValue="active" className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
              <option value="active">เปิดรับจอง</option>
              <option value="inactive">หยุดชั่วคราว</option>
            </select>
          </div>
          <button type="submit" className="btn-primary lg:col-span-2">เพิ่มหมอนวด</button>
        </form>

        {error ? <div className="card text-red-700 mb-4">{error.message}</div> : null}

        {/* รายการหมอนวด */}
        <div className="space-y-6">
          {staff?.map((person) => (
            <article key={person.id} className="card space-y-4">
              {/* ข้อมูลพื้นฐาน */}
              <form action={saveStaff} className="grid gap-3 lg:grid-cols-3">
                <input type="hidden" name="id" value={person.id} />
                <h2 className="text-base font-semibold text-stone-800 lg:col-span-3">
                  {person.name}{person.nickname ? ` (${person.nickname})` : ''}
                </h2>
                <select name="user_id" defaultValue={person.user_id ?? ''} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">
                  <option value="">ไม่ผูกผู้ใช้</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </select>
                <input name="name" defaultValue={person.name} placeholder="ชื่อ" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                <input name="nickname" defaultValue={person.nickname ?? ''} placeholder="ชื่อเล่น" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                <input name="phone" defaultValue={person.phone ?? ''} placeholder="เบอร์โทร" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                <input name="specialty" defaultValue={(person.specialty ?? []).join(', ')} placeholder="ความถนัด" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                <select name="status" defaultValue={person.status} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">
                  <option value="active">เปิดรับจอง</option>
                  <option value="inactive">หยุดชั่วคราว</option>
                </select>
                <div className="flex gap-2 lg:col-span-3">
                  <button type="submit" className="btn-primary text-sm">บันทึกข้อมูล</button>
                </div>
              </form>

              {/* ตารางเวลา */}
              <form action={saveStaffSchedule} className="border-t border-stone-100 pt-4">
                <input type="hidden" name="staff_id" value={person.id} />
                <h3 className="mb-3 text-sm font-semibold text-stone-700">ตารางเวลาทำงาน</h3>
                <div className="grid gap-2">
                  {DAY_NAMES.map((dayName, day) => {
                    const sch = scheduleMap[person.id]?.[day]
                    return (
                      <div key={day} className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 w-28 text-sm text-stone-700">
                          <input
                            type="checkbox"
                            name={`day_${day}_enabled`}
                            defaultChecked={!!sch}
                          />
                          {dayName}
                        </label>
                        <input
                          type="time"
                          name={`day_${day}_start`}
                          defaultValue={sch?.start_time?.slice(0, 5) ?? '09:00'}
                          className="rounded border border-stone-300 px-2 py-1 text-sm"
                        />
                        <span className="text-sm text-stone-400">ถึง</span>
                        <input
                          type="time"
                          name={`day_${day}_end`}
                          defaultValue={sch?.end_time?.slice(0, 5) ?? '18:00'}
                          className="rounded border border-stone-300 px-2 py-1 text-sm"
                        />
                      </div>
                    )
                  })}
                </div>
                <button type="submit" className="mt-3 rounded-lg bg-stone-700 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800">
                  บันทึกตารางเวลา
                </button>
              </form>

              {/* ลบ */}
              <form action={deleteStaff} className="border-t border-stone-100 pt-3">
                <input type="hidden" name="id" value={person.id} />
                <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
                  ลบหมอนวดออกจากระบบ
                </button>
              </form>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
