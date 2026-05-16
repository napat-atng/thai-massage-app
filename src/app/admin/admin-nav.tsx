import Link from 'next/link'

const adminLinks = [
  { href: '/admin/dashboard', label: 'แดชบอร์ด' },
  { href: '/admin/bookings', label: 'การจอง' },
  { href: '/admin/staff', label: 'หมอนวด' },
  { href: '/admin/services', label: 'บริการ' },
  { href: '/admin/users', label: 'ผู้ใช้' },
  { href: '/admin/reports', label: 'รายงาน' },
]

export function AdminNav() {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {adminLinks.map((link) => (
        <Link key={link.href} href={link.href} className="btn-secondary text-sm">
          {link.label}
        </Link>
      ))}
      <Link href="/" className="btn-secondary text-sm">
        หน้าแรก
      </Link>
      <form action="/auth/logout" method="post">
        <button type="submit" className="btn-secondary text-sm">
          ออกจากระบบ
        </button>
      </form>
    </div>
  )
}
