import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateProfile } from '@/app/admin/actions'
import { Navbar } from '@/components/ui/Navbar'
import { MutationForm } from '@/components/ui/MutationForm'

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
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content" tabIndex={-1}>
      <div className="page-shell max-w-3xl">
        <div className="page-header">
          <div>
            <p className="eyebrow">Profile</p>
            <h1 className="mt-2 text-3xl font-bold text-stone-950">โปรไฟล์ของฉัน</h1>
            <p className="mt-2 text-stone-600">แก้ไขชื่อและเบอร์โทรศัพท์</p>
          </div>
          <Link href="/" className="btn-secondary text-sm">หน้าแรก</Link>
        </div>

        <div className="card mb-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-sm text-stone-500">อีเมล</p>
            <p className="mt-1 break-words font-semibold text-stone-900">{profile?.email ?? user.email}</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-sm text-stone-500">สิทธิ์</p>
            <p className="mt-1 font-semibold text-stone-900">
              {roleLabel[profile?.role ?? 'customer'] ?? profile?.role}
            </p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-sm text-stone-500">สมาชิกตั้งแต่</p>
            <p className="mt-1 font-semibold text-stone-900">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '-'}
            </p>
          </div>
        </div>

        <MutationForm action={updateProfile} successMessage="บันทึกโปรไฟล์แล้ว" className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="full_name">
              ชื่อ-นามสกุล
            </label>
            <input
              id="full_name"
              name="full_name"
              defaultValue={profile?.full_name ?? ''}
              placeholder="ชื่อ นามสกุล"
              className="form-field mt-2"
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
              className="form-field mt-2"
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3">
            บันทึกการเปลี่ยนแปลง
          </button>
        </MutationForm>

        <div className="mt-4 text-center">
          <Link href="/my-bookings" className="text-sm text-primary-600 hover:underline">
            ดูการจองของฉัน →
          </Link>
        </div>
      </div>
      </main>
    </div>
  )
}
