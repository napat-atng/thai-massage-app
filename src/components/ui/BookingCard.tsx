import { CalendarDays, Clock3, MessageSquareText, UserRound } from 'lucide-react'
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
    <article className="card transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-stone-200">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-stone-900">
              {booking.service?.name ?? 'บริการนวด'}
            </h2>
            <StatusBadge status={booking.status} />
          </div>

          <div className="mt-4 grid gap-2 text-sm text-stone-600 sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary-700" aria-hidden="true" />
              {booking.booking_date}
            </p>
            <p className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary-700" aria-hidden="true" />
              {booking.start_time.slice(0, 5)}-{booking.end_time.slice(0, 5)} น.
            </p>
            <p className="flex items-center gap-2 sm:col-span-2">
              <UserRound className="h-4 w-4 text-primary-700" aria-hidden="true" />
              {booking.staff
                ? `${booking.staff.name}${booking.staff.nickname ? ` (${booking.staff.nickname})` : ''}`
                : 'ให้ร้านจัดช่างให้'}
            </p>
          </div>

          {booking.note ? (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">
              <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
              {booking.note}
            </p>
          ) : null}
        </div>
        <div className="flex flex-row items-center justify-between gap-3 border-t border-stone-100 pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
          <p className="text-xl font-bold text-primary-700">
            ฿{Number(booking.total_price).toLocaleString()}
          </p>
          {actions}
        </div>
      </div>
    </article>
  )
}
