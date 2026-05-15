import { AdminNav } from '@/app/admin/admin-nav'
import { updateUserRole } from '@/app/admin/actions'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

const roles = ['customer', 'staff', 'admin']

export default async function AdminUsersPage() {
  await requireAdmin()

  const supabase = createClient()
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, phone, role, created_at')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-stone-800">จัดการผู้ใช้และ role</h1>
        <p className="mb-6 text-sm text-stone-500">หมอนวดสมัครสมาชิกก่อน จากนั้น admin เปลี่ยน role เป็น staff ได้ที่นี่</p>
        <AdminNav />

        {error ? <div className="card text-red-700">{error.message}</div> : null}

        <div className="space-y-3">
          {users?.map((user) => (
            <article key={user.id} className="card">
              <div className="grid gap-4 lg:grid-cols-[1fr_220px] lg:items-center">
                <div>
                  <h2 className="font-semibold text-stone-800">{user.full_name || user.email}</h2>
                  <p className="mt-1 text-sm text-stone-500">{user.email}</p>
                  <p className="mt-1 text-sm text-stone-500">โทร: {user.phone || '-'}</p>
                </div>
                <form action={updateUserRole} className="flex gap-2">
                  <input type="hidden" name="user_id" value={user.id} />
                  <select name="role" defaultValue={user.role} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn-primary text-sm">
                    บันทึก
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
