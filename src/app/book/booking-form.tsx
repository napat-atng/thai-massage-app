'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BUSINESS_HOURS } from '@/lib/constants'

type ServiceOption = {
  id: string
  name: string
  duration_minutes: number
  price: number
}

type StaffOption = {
  id: string
  name: string
  nickname: string | null
}

type BookingFormProps = {
  userId: string
  services: ServiceOption[]
  staff: StaffOption[]
}

function addMinutesToTime(time: string, minutes: number) {
  const [hours, mins] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, mins + minutes, 0, 0)
  return date.toTimeString().slice(0, 5)
}

function isWithinBusinessHours(startTime: string, durationMinutes: number): boolean {
  const endTime = addMinutesToTime(startTime, durationMinutes)
  return startTime >= BUSINESS_HOURS.open && endTime <= BUSINESS_HOURS.close
}

export function BookingForm({ userId, services, staff }: BookingFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')
  const [staffId, setStaffId] = useState('')
  const [bookingDate, setBookingDate] = useState(today)
  const [startTime, setStartTime] = useState('10:00')
  const [note, setNote] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [serviceId, services]
  )

  const endTime = selectedService
    ? addMinutesToTime(startTime, selectedService.duration_minutes)
    : null

  const businessHoursOk = selectedService
    ? isWithinBusinessHours(startTime, selectedService.duration_minutes)
    : true

  const canSubmit = Boolean(selectedService && bookingDate && startTime && businessHoursOk)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedService || !canSubmit) return

    setIsSubmitting(true)
    setErrorMessage(null)

    // ตรวจสอบ double-booking: ช่างถูกจองในช่วงเวลานี้ไหม
    if (staffId) {
      const calculatedEndTime = addMinutesToTime(startTime, selectedService.duration_minutes)
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('staff_id', staffId)
        .eq('booking_date', bookingDate)
        .not('status', 'in', '(cancelled)')
        .or(
          `and(start_time.lt.${calculatedEndTime},end_time.gt.${startTime})`
        )

      if (conflicts && conflicts.length > 0) {
        setErrorMessage(
          `ช่างนวดคนนี้ไม่ว่างในช่วงเวลา ${startTime}–${calculatedEndTime} น. กรุณาเลือกเวลาหรือช่างอื่น`
        )
        setIsSubmitting(false)
        return
      }
    }

    const { error } = await supabase.from('bookings').insert({
      customer_id: userId,
      service_id: selectedService.id,
      staff_id: staffId || null,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: addMinutesToTime(startTime, selectedService.duration_minutes),
      total_price: selectedService.price,
      note: note.trim() || null,
    })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    router.push('/my-bookings')
    router.refresh()
  }

  if (services.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-stone-800">ยังไม่มีบริการที่เปิดใช้งาน</h2>
        <p className="mt-2 text-sm text-stone-500">
          เพิ่มข้อมูลในตาราง services บน Supabase ก่อน จึงจะเริ่มจองได้
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      {/* บริการ */}
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="service">
          บริการ
        </label>
        <select
          id="service"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 outline-none focus:border-primary-500"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.duration_minutes} นาที — ฿{Number(s.price).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {/* ช่างนวด */}
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="staff">
          ช่างนวด
        </label>
        <select
          id="staff"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 outline-none focus:border-primary-500"
        >
          <option value="">ให้ร้านจัดช่างให้</option>
          {staff.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.nickname ? ` (${p.nickname})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* วันที่ + เวลา */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="date">
            วันที่
          </label>
          <input
            id="date"
            type="date"
            min={today}
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="time">
            เวลาเริ่ม{' '}
            <span className="font-normal text-stone-400">
              (เปิด {BUSINESS_HOURS.open}–{BUSINESS_HOURS.close})
            </span>
          </label>
          <input
            id="time"
            type="time"
            min={BUSINESS_HOURS.open}
            max={BUSINESS_HOURS.close}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* แสดง warning ถ้านอกเวลาทำการ */}
      {selectedService && !businessHoursOk ? (
        <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700">
          ⚠️ เวลาสิ้นสุด {endTime} น. เกินเวลาปิดร้าน {BUSINESS_HOURS.close} น. กรุณาเลือกเวลาเริ่มให้เร็วขึ้น
        </p>
      ) : null}

      {/* หมายเหตุ */}
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="note">
          หมายเหตุ
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 outline-none focus:border-primary-500"
          placeholder="เช่น ต้องการเน้นไหล่และหลัง"
        />
      </div>

      {/* สรุปราคา */}
      {selectedService ? (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-stone-700">
          รวม ฿{Number(selectedService.price).toLocaleString()} · ใช้เวลา {selectedService.duration_minutes} นาที
          {endTime ? ` · เสร็จ ${endTime} น.` : ''}
        </div>
      ) : null}

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการจอง'}
      </button>
    </form>
  )
}
