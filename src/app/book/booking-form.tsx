'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, CheckCircle2, Clock3, MessageSquareText, Sparkles, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BUSINESS_HOURS } from '@/lib/constants'
import Swal from 'sweetalert2'

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
  const selectedStaff = staff.find((person) => person.id === staffId)

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
        const message = `ช่างนวดคนนี้ไม่ว่างในช่วงเวลา ${startTime}–${calculatedEndTime} น. กรุณาเลือกเวลาหรือช่างอื่น`
        setErrorMessage(message)
        await Swal.fire({ icon: 'error', title: 'ไม่สามารถจองได้', text: message })
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
      await Swal.fire({ icon: 'error', title: 'บันทึกการจองไม่สำเร็จ', text: error.message })
      return
    }

    await Swal.fire({ icon: 'success', title: 'จองสำเร็จ', text: 'ระบบบันทึกการจองของคุณแล้ว', timer: 1800, showConfirmButton: false })
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
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-stone-800" htmlFor="service">
            <Sparkles className="h-4 w-4 text-primary-700" aria-hidden="true" />
            บริการ
          </label>
          <select
            id="service"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="form-field mt-2"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - {s.duration_minutes} นาที - ฿{Number(s.price).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-stone-800" htmlFor="staff">
            <UserRound className="h-4 w-4 text-primary-700" aria-hidden="true" />
            ช่างนวด
          </label>
          <select
            id="staff"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="form-field mt-2"
          >
            <option value="">ให้ร้านจัดช่างให้</option>
            {staff.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.nickname ? ` (${p.nickname})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-800" htmlFor="date">
              <CalendarDays className="h-4 w-4 text-primary-700" aria-hidden="true" />
              วันที่
            </label>
            <input
              id="date"
              type="date"
              min={today}
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="form-field mt-2"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-800" htmlFor="time">
              <Clock3 className="h-4 w-4 text-primary-700" aria-hidden="true" />
              เวลาเริ่ม
            </label>
            <input
              id="time"
              type="time"
              min={BUSINESS_HOURS.open}
              max={BUSINESS_HOURS.close}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="form-field mt-2"
            />
            <p className="mt-1 text-xs text-stone-500">
              เปิด {BUSINESS_HOURS.open}-{BUSINESS_HOURS.close} น.
            </p>
          </div>
        </div>

        {selectedService && !businessHoursOk ? (
          <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-medium text-orange-800 ring-1 ring-orange-100" role="alert">
            เวลาสิ้นสุด {endTime} น. เกินเวลาปิดร้าน {BUSINESS_HOURS.close} น. กรุณาเลือกเวลาเริ่มให้เร็วขึ้น
          </p>
        ) : null}

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-stone-800" htmlFor="note">
            <MessageSquareText className="h-4 w-4 text-primary-700" aria-hidden="true" />
            หมายเหตุ
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="form-field mt-2"
            placeholder="เช่น ต้องการเน้นไหล่และหลัง"
          />
        </div>

        {errorMessage ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-100" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <aside className="card h-fit lg:sticky lg:top-24">
        <p className="eyebrow">Summary</p>
        <h2 className="mt-2 text-xl font-bold text-stone-950">สรุปการจอง</h2>

        {selectedService ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>ตรวจสอบรายละเอียดก่อนกดยืนยัน</span>
            </div>
            <div className="soft-panel">
              <p className="text-sm text-stone-600">บริการ</p>
              <p className="mt-1 font-bold text-stone-950">{selectedService.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-stone-50 p-3">
                <p className="text-stone-500">เวลา</p>
                <p className="mt-1 font-semibold text-stone-900">{selectedService.duration_minutes} นาที</p>
              </div>
              <div className="rounded-lg bg-stone-50 p-3">
                <p className="text-stone-500">เสร็จ</p>
                <p className="mt-1 font-semibold text-stone-900">{endTime ?? '-'}</p>
              </div>
            </div>
            <div className="rounded-xl bg-stone-50 p-3 text-sm">
              <p className="text-stone-500">หมอนวด</p>
              <p className="mt-1 font-semibold text-stone-900">
                {selectedStaff ? `${selectedStaff.name}${selectedStaff.nickname ? ` (${selectedStaff.nickname})` : ''}` : 'ให้ร้านจัดหมอนวดที่ว่างให้'}
              </p>
            </div>
            <div className="flex items-end justify-between border-t border-stone-100 pt-4">
              <span className="text-sm text-stone-500">รวมทั้งหมด</span>
              <span className="text-2xl font-bold text-primary-700">
                ฿{Number(selectedService.price).toLocaleString()}
              </span>
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="btn-primary mt-6 w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการจอง'}
        </button>
      </aside>
    </form>
  )
}
