'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import type { BookingStatus, UserRole } from '@/types'

function textValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numberValue(formData: FormData, key: string) {
  const value = textValue(formData, key)
  return value ? Number(value) : null
}

export async function updateUserRole(formData: FormData) {
  await requireAdmin()
  const supabase = createClient()
  const userId = textValue(formData, 'user_id')
  const role = textValue(formData, 'role') as UserRole | null

  if (!userId || !role) {
    return
  }

  await supabase.from('users').update({ role }).eq('id', userId)
  revalidatePath('/admin/users')
  revalidatePath('/admin/staff')
  revalidatePath('/')
}

export async function saveService(formData: FormData) {
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
    return
  }

  if (id) {
    await supabase.from('services').update(payload).eq('id', id)
  } else {
    await supabase.from('services').insert(payload)
  }

  revalidatePath('/admin/services')
  revalidatePath('/')
  revalidatePath('/book')
}

export async function deleteService(formData: FormData) {
  await requireAdmin()
  const supabase = createClient()
  const id = textValue(formData, 'id')

  if (id) {
    await supabase.from('services').delete().eq('id', id)
  }

  revalidatePath('/admin/services')
  revalidatePath('/')
  revalidatePath('/book')
}

export async function saveStaff(formData: FormData) {
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
    return
  }

  if (id) {
    await supabase.from('staff').update(payload).eq('id', id)
  } else {
    await supabase.from('staff').insert(payload)
  }

  if (userId) {
    await supabase.from('users').update({ role: 'staff' }).eq('id', userId)
  }

  revalidatePath('/admin/staff')
  revalidatePath('/admin/users')
  revalidatePath('/book')
}

export async function deleteStaff(formData: FormData) {
  await requireAdmin()
  const supabase = createClient()
  const id = textValue(formData, 'id')

  if (id) {
    await supabase.from('staff').delete().eq('id', id)
  }

  revalidatePath('/admin/staff')
  revalidatePath('/book')
}

export async function updateBooking(formData: FormData) {
  await requireAdmin()
  const supabase = createClient()
  const id = textValue(formData, 'id')
  const status = textValue(formData, 'status') as BookingStatus | null
  const staffId = textValue(formData, 'staff_id')
  const note = textValue(formData, 'note')

  if (!id || !status) {
    return
  }

  await supabase
    .from('bookings')
    .update({
      status,
      staff_id: staffId,
      note,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  revalidatePath('/my-bookings')
  revalidatePath('/staff/schedule')
}
