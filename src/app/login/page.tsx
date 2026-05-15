'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'login' | 'signup'

function getFriendlyAuthError(message: string) {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('email not confirmed')) {
    return 'อีเมลนี้ยังไม่ได้ยืนยัน กรุณากดลิงก์ยืนยันในอีเมลก่อนเข้าสู่ระบบ'
  }

  if (lowerMessage.includes('invalid login credentials')) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
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
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

    if (error === 'missing_code') {
      setErrorMessage('ไม่พบรหัสยืนยัน กรุณาลองใหม่อีกครั้ง')
      return
    }

    if (error === 'auth_callback_failed') {
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
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? location.origin
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback`,
          data: {
            full_name: fullName.trim(),
          },
        },
      })

      setIsLoading(false)

      if (error) {
        setErrorMessage(getFriendlyAuthError(error.message))
        return
      }

      if (!data.session) {
        setMessage('สมัครสมาชิกสำเร็จ กรุณาตรวจอีเมลและกดลิงก์ยืนยันก่อนเข้าสู่ระบบ')
      } else {
        setMessage('สมัครสมาชิกและเข้าสู่ระบบสำเร็จ')
        router.push('/')
        router.refresh()
      }

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
      setErrorMessage(getFriendlyAuthError(error.message))
      return
    }

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100 px-4">
      <div className="card w-full max-w-md text-center">
        <div className="text-5xl mb-4">🌿</div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">
          {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </h1>
        <p className="text-stone-500 text-sm mb-6">จองนัดนวดออนไลน์ได้ง่าย ๆ</p>

        <div className="mb-5 grid grid-cols-2 rounded-lg bg-stone-100 p-1">
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

        <form onSubmit={handleEmailAuth} className="space-y-3 text-left">
          {mode === 'signup' ? (
            <div>
              <label className="block text-sm font-medium text-stone-700" htmlFor="fullName">
                ชื่อ-นามสกุล
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-primary-500"
                placeholder="เช่น สมชาย ใจดี"
              />
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="email">
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-primary-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="password">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-primary-500"
              placeholder="อย่างน้อย 6 ตัวอักษร"
            />
          </div>

          {mode === 'signup' ? (
            <p className="text-xs text-stone-500">
              หลังสมัคร ระบบอาจส่งอีเมลยืนยันให้กดก่อนเข้าสู่ระบบ ขึ้นอยู่กับการตั้งค่า Supabase
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบด้วยอีเมล' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs text-stone-400">หรือ</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 border border-stone-300 rounded-lg px-4 py-3 hover:bg-stone-50 transition-colors font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          เข้าสู่ระบบด้วย Google
        </button>

        {message ? (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
        ) : null}
      </div>
    </div>
  )
}
