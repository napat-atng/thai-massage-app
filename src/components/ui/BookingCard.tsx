import { StatusBadge } from './StatusBadge'

interface BookingCardProps {
  booking: {
    id: string
    booking_date: string
    start_time: string
    end_time: string
    status: string
    total_price: number
    note: string | null
    service: { name: string } | null
    staff: { name: string; nickname: string | null } | null
  }
  actions?: React.ReactNode
}

export function BookingCard({ booking, actions }: BookingCardProps) {
  return (
    <article className="card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-stone-800">
              {booking.service?.name ?? 'บริการนวด'}
            </h2>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-2 text-sm text-stone-500">
            {booking.booking_date} เวลา {booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            ช่าง:{' '}
            {booking.staff
              ? `${booking.staff.name}${booking.staff.nickname ? ` (${booking.staff.nickname})` : ''}`
              : 'ให้ร้านจัดช่างให้'}
          </p>
          {booking.note ? (
            <p className="mt-2 text-sm text-stone-600">หมายเหตุ: {booking.note}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <p className="text-lg font-bold text-primary-600">
            ฿{Number(booking.total_price).toLocaleString()}
          </p>
          {actions}
        </div>
      </div>
    </article>
  )
}
