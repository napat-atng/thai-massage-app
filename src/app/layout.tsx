import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'นวดแผนไทย - Thai Massage',
  description: 'ระบบจัดการร้านนวดแผนไทย จองนัดออนไลน์ได้เลย',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
