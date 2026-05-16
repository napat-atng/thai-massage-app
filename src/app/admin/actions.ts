'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/auth/roles'
import type { BookingStatus, UserRole } from '@/types'

// ---- helpers ----

function textValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numberValue(formData: FormData, key: string) {
  const value = textValue(formData, key)
  return value ? Number(value) : null
}

export type ActionResult = { success: true } | { success: false; error: string }

// ---- admin actions ----

export async function updateUserRole(formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const supabase = createClient()
  const userId = textValue(formData, 'user_id')
  const role = textValue(formData, 'role') as UserRole | null

  if (!userId || !role) {
    return { success: false, error: 'ข้อมูลไม่ครบ' }
  }

  const { error } = await supabase.from('users').update({ role }).eq('id', userId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/users')
  revalidatePath('/admin/staff')
  revalidatePath('/')
  return { success: true }
}

export async function saveService(formData: FormData): Promise<ActionResult> {
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
    return { success: false, error: 'กรุณาระบุชื่อบริการ' }
  }

  const { error } = id
    ? await supabase.from('services').update(payload).eq('id', id)
    : await supabase.from('services').insert(payload)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/services')
  revalidatePath('/')
  revalidatePath('/book')
  return { success: true }
}

export async function deleteService(formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const supabase = createClient()
  const id = textValue(formData, 'id')

  if (!id) return { success: false, error: 'ไม่พบ id' }

  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/services')
  revalidatePath('/')
  revalidatePath('/book')
  return { success: true }
}

export async function saveStaff(formData: FormData): Promise<ActionResult> {
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
    return { success: false, error: 'กรุณาระบุชื่อหมอนวด' }
  }

  const { error } = id
    ? await supabase.from('staff').update(payload).eq('id', id)
    : await supabase.from('staff').insert(payload)

  if (error) return { success: false, error: error.message }

  if (userId) {
    await supabase.from('users').update({ role: 'staff' }).eq('id', userId)
  }

  revalidatePath('/admin/staff')
  revalidatePath('/admin/users')
  revalidatePath('/book')
  return { success: true }
}

export async function deleteStaff(formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const supabase = createClient()
  const id = textValue(formData, 'id')

  if (!id) return { success: false, error: 'ไม่พบ id' }

  const { error } = await supabase.from('staff').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/staff')
  revalidatePath('/book')
  return { success: true }
}

export async function updateBooking(formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const supabase = createClient()
  const id = textValue(formData, 'id')
  const status = textValue(formData, 'status') as BookingStatus | null
  const staffId = textValue(formData, 'staff_id')
  const note = textValue(formData, 'note')

  if (!id || !status) {
    return { success: false, error: 'ข้อมูลไม่ครบ' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status, staff_id: staffId, note, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  revalidatePath('/my-bookings')
  revalidatePath('/staff/schedule')
  return { success: true }
}

// ---- customer actions ----

export async function cancelBooking(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

  const id = textValue(formData, 'id')
  if (!id) return { success: false, error: 'ไม่พบ id' }

  // ตรวจสอบว่าเป็นการจองของลูกค้าคนนี้จริง และยังยกเลิกได้
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status, customer_id')
    .eq('id', id)
    .single()

  if (fetchError || !booking) return { success: false, error: 'ไม่พบการจอง' }
  if (booking.customer_id !== user.id) return { success: false, error: 'ไม่มีสิทธิ์ยกเลิกการจองนี้' }
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return { success: false, error: 'ไม่สามารถยกเลิกการจองในสถานะนี้ได้' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/my-bookings')
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ---- profile action ----

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

  const full_name = textValue(formData, 'full_name')
  const phone = textValue(formData, 'phone')

  const { error } = await supabase
    .from('users')
    .update({ full_name, phone })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/profile')
  revalidatePath('/')
  return { success: true }
}

// ---- transaction action ----

export async function recordTransaction(formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

  const booking_id = textValue(formData, 'booking_id')
  const amount = numberValue(formData, 'amount')
  const payment_method = textValue(formData, 'payment_method') ?? 'cash'
  const note = textValue(formData, 'note')

  if (!booking_id || !amount) {
    return { success: false, error: 'กรุณาระบุ booking และจำนวนเงิน' }
  }

  const { error } = await supabase.from('transactions').insert({
    booking_id,
    amount,
    payment_method,
    note,
    created_by: user.id,
  })

  if (error) return { success: false, error: error.message }

  // อัปเดตสถานะ booking เป็น completed
  await supabase
    .from('bookings')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', booking_id)

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/reports')
  revalidatePath('/admin/dashboard')
  revalidatePath('/my-bookings')
  return { success: true }
}
