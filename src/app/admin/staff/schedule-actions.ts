'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

export async function saveStaffSchedule(formData: FormData): Promise<{ success: boolean; message: string }> {
  await requireAdmin()
  const supabase = createClient()

  const staff_id = formData.get('staff_id') as string
  if (!staff_id) return { success: false, message: 'ไม่พบข้อมูลหมอนวด' }

  // ลบตารางเดิมของ staff คนนี้ก่อน
  const { error: deleteError } = await supabase.from('staff_schedules').delete().eq('staff_id', staff_id)
  if (deleteError) return { success: false, message: deleteError.message }

  // เพิ่มใหม่เฉพาะวันที่เปิด
  const rows = []
  for (let day = 0; day <= 6; day++) {
    const enabled = formData.get(`day_${day}_enabled`) === 'on'
    if (!enabled) continue
    const start_time = formData.get(`day_${day}_start`) as string
    const end_time = formData.get(`day_${day}_end`) as string
    if (start_time && end_time) {
      rows.push({ staff_id, day_of_week: day, start_time, end_time })
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('staff_schedules').insert(rows)
    if (error) return { success: false, message: error.message }
  }

  revalidatePath('/admin/staff')
  return { success: true, message: 'บันทึกตารางเวลาทำงานแล้ว' }
}
