import type { BookingStatus } from '@/types'

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  in_progress: 'กำลังให้บริการ',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
}

export const STATUS_BADGE_CLASS: Record<BookingStatus, string> = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  in_progress: 'badge-in_progress',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
}

export const ALL_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
]

// เวลาทำการร้าน (24h format)
export const BUSINESS_HOURS = {
  open: '09:00',
  close: '21:00',
} as const
