import { STATUS_BADGE_CLASS, STATUS_LABEL } from '@/lib/constants'
import type { BookingStatus } from '@/types'
import { clsx } from 'clsx'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const badgeClass = STATUS_BADGE_CLASS[status as BookingStatus] ?? 'badge-pending'
  const label = STATUS_LABEL[status as BookingStatus] ?? status

  return (
    <span className={clsx(badgeClass, className)}>
      {label}
    </span>
  )
}
