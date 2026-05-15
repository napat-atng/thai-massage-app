import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return (data?.role as UserRole | undefined) ?? null
}

export async function requireAdmin() {
  const role = await getCurrentUserRole()

  if (role !== 'admin') {
    redirect('/')
  }

  return role
}
