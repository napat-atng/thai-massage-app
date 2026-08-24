'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, LockKeyhole, Mail, Phone, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Swal from 'sweetalert2'

type AuthMode = 'login' | 'signup'

function getFriendlyAuthError(message: string) {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('email not confirmed')) {
    return 'อีเมลนี้ยังไม่ได้ยืนยัน หากต้องการไม่ให้ยืนยันอีเมล ให้ปิด Confirm email ใน Supabase Auth'
  }

  if (lowerMessage.includes('invalid login credentials')) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  }

  if (lowerMessage.includes('rate limit') || lowerMessage.includes('over_email_send_rate_limit')) {
    return 'ระบบส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง'
  }

  if (lowerMessage.includes('password should be at least')) {
    return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
  }

  if (lowerMessage.includes('user already registered')) {
    return 'อีเมลนี้สมัครสมาชิกไว้แล้ว กรุณาเข้าสู่ระบบแทน'
  }

  return message
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const error = searchParams.get('error')
    const callbackMessage = searchParams.get('message')

    if (callbackMessage) {
      setErrorMessage(callbackMessage)
      return
    }

    if (error === 'missing_code' || error === 'auth_callback_failed') {
      setErrorMessage('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    }
  }, [])

  const clearFeedback = () => {
    setMessage(null)
    setErrorMessage(null)
  }

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearFeedback()
    setIsLoading(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone: phone.trim() || null,
          },
        },
      })

      setIsLoading(false)

      if (error) {
        const message = getFriendlyAuthError(error.message)
        setErrorMessage(message)
        await Swal.fire({ icon: 'error', title: 'สมัครสมาชิกไม่สำเร็จ', text: message })
        return
      }

      if (data.session) {
        await Swal.fire({ icon: 'success', title: 'สมัครสมาชิกสำเร็จ', timer: 1600, showConfirmButton: false })
        router.push('/')
        router.refresh()
        return
      }

      setMessage('สมัครสมาชิกสำเร็จ แต่ Supabase ยังเปิดการยืนยันอีเมลอยู่ กรุณาปิด Confirm email เพื่อให้เข้าใช้ได้ทันที')
      await Swal.fire({ icon: 'success', title: 'สมัครสมาชิกสำเร็จ', text: 'กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี' })
      setMode('login')
      setPassword('')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsLoading(false)

    if (error) {
      const message = getFriendlyAuthError(error.message)
      setErrorMessage(message)
      await Swal.fire({ icon: 'error', title: 'เข้าสู่ระบบไม่สำเร็จ', text: message })
      return
    }

    await Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบสำเร็จ', timer: 1200, showConfirmButton: false })
    router.push('/')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    clearFeedback()
    setIsLoading(true)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? location.origin

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appUrl}/auth/callback`,
      },
    })

    if (error) {
      setIsLoading(false)
      setErrorMessage(
        error.message.includes('Unsupported provider')
          ? 'ยังไม่ได้เปิด Google provider ใน Supabase Auth'
          : getFriendlyAuthError(error.message)
      )
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section>
          <div className="mb-6 grid h-14 w-14 place-items-center rounded-lg bg-primary-100 text-primary-800 ring-1 ring-primary-200">
            <Leaf className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="eyebrow">Welcome Back</p>
          <h1 className="mt-3 max-w-xl text-4xl font-bold leading-tight text-stone-950">เข้าสู่ระบบนวดแผนไทย</h1>
          <p className="mt-4 max-w-lg leading-7 text-stone-600">
            เข้าสู่ระบบเพื่อจองนัด ติดตามสถานะ และจัดการโปรไฟล์ของคุณในที่เดียว
          </p>
          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white bg-white/80 p-4 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-primary-700" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-stone-900">ข้อมูลปลอดภัย</p>
            </div>
            <div className="rounded-lg border border-white bg-white/80 p-4 shadow-sm">
              <LockKeyhole className="h-5 w-5 text-primary-700" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-stone-900">เข้าใช้งานรวดเร็ว</p>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <div className="card">
            <h2 className="text-xl font-bold text-stone-800">บัญชีสมาชิก</h2>
            <p className="mt-1 text-sm text-stone-500">สมัครหรือเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน</p>

            <div className="my-5 grid grid-cols-2 rounded-lg bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  clearFeedback()
                }}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-white text-primary-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  clearFeedback()
                }}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-white text-primary-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                สมัครสมาชิก
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700" htmlFor="email">
                  อีเมล
                </label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="form-field pl-9"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700" htmlFor="password">
                  รหัสผ่าน
                </label>
                <div className="relative mt-1">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    className="form-field pl-9"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                  />
                </div>
              </div>

              {mode === 'signup' ? (
                <div>
                  <label className="block text-sm font-medium text-stone-700" htmlFor="phone">
                    เบอร์โทร
                  </label>
                  <div className="relative mt-1">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="form-field pl-9"
                      placeholder="08x-xxx-xxxx"
                    />
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบด้วยบัญชีสมาชิก' : 'สมัครสมาชิก'}
              </button>
            </form>

            {message ? (
              <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
            ) : null}

            {errorMessage ? (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
            ) : null}
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-stone-800">Google OAuth</h2>
            <p className="mt-1 text-sm text-stone-500">เข้าสู่ระบบด้วยบัญชี Google ตาม flow เดิม</p>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg border border-stone-300 px-4 py-3 font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              เข้าสู่ระบบด้วย Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
