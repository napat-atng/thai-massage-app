'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import type { BookingStatus, UserRole } from '@/types'

export type MutationResult = { success: boolean; message: string }

// ---- helpers ----

function textValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numberValue(formData: FormData, key: string) {
  const value = textValue(formData, key)
  return value ? Number(value) : null
}

// ---- admin actions ----

export async function updateUserRole(formData: FormData): Promise<MutationResult> {
  await requireAdmin()
  const supabase = createClient()
  const userId = textValue(formData, 'user_id')
  const role = textValue(formData, 'role') as UserRole | null

  if (!userId || !role) {
    return { success: false, message: 'ข้อมูลผู้ใช้หรือสิทธิ์ไม่ครบถ้วน' }
  }

  const { error } = await supabase.from('users').update({ role }).eq('id', userId)
  if (error) return { success: false, message: error.message }

  revalidatePath('/admin/users')
  revalidatePath('/admin/staff')
  revalidatePath('/')
  return { success: true, message: 'บันทึกสิทธิ์ผู้ใช้แล้ว' }
}

export async function saveService(formData: FormData): Promise<MutationResult> {
  await requireAdmin()
  const supabase = createClient()
  const id = textValue(formData, 'id')
  const payload = {
    name: textValue(formData, 'name'),
    description: textValue(formData, 'description'),
    duration_minutes: numberValue(formData, 'duration_minutes') ?? 60,
    price: numberValue(formData, 'price') ?? 0,
    is_active: formData.get('is_active') === 'on',
  }

  if (!payload.name) {
    return { success: false, message: 'กรุณาระบุชื่อบริการ' }
  }

  const { error } = id
    ? await supabase.from('services').update(payload).eq('id', id)
    : await supabase.from('services').insert(payload)

  if (error) return { success: false, message: error.message }

  revalidatePath('/admin/services')
  revalidatePath('/')
  revalidatePath('/book')
  return { success: true, message: id ? 'แก้ไขบริการแล้ว' : 'เพิ่มบริการแล้ว' }
}

export async function deleteService(formData: FormData): Promise<MutationResult> {
  await requireAdmin()
  const supabase = createClient()
  const id = textValue(formData, 'id')

  if (!id) return { success: false, message: 'ไม่พบรายการบริการ' }

  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return { success: false, message: error.message }

  revalidatePath('/admin/services')
  revalidatePath('/')
  revalidatePath('/book')
  return { success: true, message: 'ลบบริการแล้ว' }
}

export async function saveStaff(formData: FormData): Promise<MutationResult> {
  await requireAdmin()
  const supabase = createClient()
  const id = textValue(formData, 'id')
  const userId = textValue(formData, 'user_id')
  const payload = {
    user_id: userId,
    name: textValue(formData, 'name'),
    nickname: textValue(formData, 'nickname'),
    phone: textValue(formData, 'phone'),
    specialty: (textValue(formData, 'specialty') ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    status: textValue(formData, 'status') ?? 'active',
  }

  if (!payload.name) {
    return { success: false, message: 'กรุณาระบุชื่อหมอนวด' }
  }

  const { error } = id
    ? await supabase.from('staff').update(payload).eq('id', id)
    : await supabase.from('staff').insert(payload)

  if (error) return { success: false, message: error.message }

  if (userId) {
    const { error: roleError } = await supabase.from('users').update({ role: 'staff' }).eq('id', userId)
    if (roleError) return { success: false, message: `บันทึกหมอนวดแล้ว แต่เปลี่ยนสิทธิ์ผู้ใช้ไม่สำเร็จ: ${roleError.message}` }
  }

  revalidatePath('/admin/staff')
  revalidatePath('/admin/users')
  revalidatePath('/book')
  return { success: true, message: id ? 'แก้ไขข้อมูลหมอนวดแล้ว' : 'เพิ่มหมอนวดแล้ว' }
}

export async function deleteStaff(formData: FormData): Promise<MutationResult> {
  await requireAdmin()
  const supabase = createClient()
  const id = textValue(formData, 'id')

  if (!id) return { success: false, message: 'ไม่พบข้อมูลหมอนวด' }

  const { error } = await supabase.from('staff').delete().eq('id', id)
  if (error) return { success: false, message: error.message }

  revalidatePath('/admin/staff')
  revalidatePath('/book')
  return { success: true, message: 'ลบหมอนวดแล้ว' }
}

export async function updateBooking(formData: FormData): Promise<MutationResult> {
  await requireAdmin()
  const supabase = createClient()
  const id = textValue(formData, 'id')
  const status = textValue(formData, 'status') as BookingStatus | null
  const staffId = textValue(formData, 'staff_id')
  const note = textValue(formData, 'note')

  if (!id || !status) {
    return { success: false, message: 'ข้อมูลการจองไม่ครบถ้วน' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status, staff_id: staffId, note, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, message: error.message }

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  revalidatePath('/my-bookings')
  revalidatePath('/staff/schedule')
  return { success: true, message: 'อัปเดตการจองแล้ว' }
}

// ---- customer actions ----

export async function cancelBooking(formData: FormData): Promise<MutationResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }

  const id = textValue(formData, 'id')
  if (!id) return { success: false, message: 'ไม่พบรายการจอง' }

  // ตรวจสอบว่าเป็นการจองของลูกค้าคนนี้จริง และยังยกเลิกได้
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status, customer_id')
    .eq('id', id)
    .single()

  if (fetchError || !booking) return { success: false, message: 'ไม่พบรายการจอง' }
  if (booking.customer_id !== user.id) return { success: false, message: 'คุณไม่มีสิทธิ์ยกเลิกรายการนี้' }
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return { success: false, message: 'รายการนี้ไม่สามารถยกเลิกได้' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, message: error.message }

  revalidatePath('/my-bookings')
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  return { success: true, message: 'ยกเลิกการจองแล้ว' }
}

// ---- profile action ----

export async function updateProfile(formData: FormData): Promise<MutationResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }

  const full_name = textValue(formData, 'full_name')
  const phone = textValue(formData, 'phone')

  const { error } = await supabase
    .from('users')
    .update({ full_name, phone })
    .eq('id', user.id)

  if (error) return { success: false, message: error.message }

  revalidatePath('/profile')
  revalidatePath('/')
  return { success: true, message: 'บันทึกโปรไฟล์แล้ว' }
}

// ---- transaction action ----

export async function recordTransaction(formData: FormData): Promise<MutationResult> {
  await requireAdmin()
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }

  const booking_id = textValue(formData, 'booking_id')
  const amount = numberValue(formData, 'amount')
  const payment_method = textValue(formData, 'payment_method') ?? 'cash'
  const note = textValue(formData, 'note')

  if (!booking_id || !amount) {
    return { success: false, message: 'ข้อมูลการชำระเงินไม่ครบถ้วน' }
  }

  const { error } = await supabase.from('transactions').insert({
    booking_id,
    amount,
    payment_method,
    note,
    created_by: user.id,
  })

  if (error) return { success: false, message: error.message }

  // อัปเดตสถานะ booking เป็น completed
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', booking_id)

  if (bookingError) return { success: false, message: `บันทึกการชำระเงินแล้ว แต่เปลี่ยนสถานะการจองไม่สำเร็จ: ${bookingError.message}` }

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/reports')
  revalidatePath('/admin/dashboard')
  revalidatePath('/my-bookings')
  return { success: true, message: 'บันทึกการชำระเงินแล้ว' }
}
