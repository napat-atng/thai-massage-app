import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateProfile } from '@/app/admin/actions'

export default async function ProfilePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone, email, role, created_at')
    .eq('id', user.id)
    .single()

  const roleLabel: Record<string, string> = {
    admin: 'ผู้ดูแลระบบ',
    staff: 'หมอนวด',
    customer: 'ลูกค้า',
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">โปรไฟล์ของฉัน</h1>
            <p className="mt-1 text-sm text-stone-500">แก้ไขชื่อและเบอร์โทรศัพท์</p>
          </div>
          <Link href="/" className="btn-secondary text-sm">หน้าแรก</Link>
        </div>

        <div className="card mb-4">
          <p className="text-sm text-stone-500">อีเมล</p>
          <p className="mt-1 font-medium text-stone-800">{profile?.email ?? user.email}</p>
          <p className="mt-3 text-sm text-stone-500">สิทธิ์</p>
          <p className="mt-1 font-medium text-stone-800">
            {roleLabel[profile?.role ?? 'customer'] ?? profile?.role}
          </p>
          <p className="mt-3 text-sm text-stone-500">สมาชิกตั้งแต่</p>
          <p className="mt-1 font-medium text-stone-800">
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '-'}
          </p>
        </div>

        <form action={updateProfile} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="full_name">
              ชื่อ-นามสกุล
            </label>
            <input
              id="full_name"
              name="full_name"
              defaultValue={profile?.full_name ?? ''}
              placeholder="ชื่อ นามสกุล"
              className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="phone">
              เบอร์โทรศัพท์
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile?.phone ?? ''}
              placeholder="0812345678"
              className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 outline-none focus:border-primary-500"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            บันทึกการเปลี่ยนแปลง
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/my-bookings" className="text-sm text-primary-600 hover:underline">
            ดูการจองของฉัน →
          </Link>
        </div>
      </div>
    </main>
  )
}
