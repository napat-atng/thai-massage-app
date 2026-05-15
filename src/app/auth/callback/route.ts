import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const oauthError = requestUrl.searchParams.get('error')
  const oauthErrorCode = requestUrl.searchParams.get('error_code')
  const oauthErrorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next')
  const redirectPath = next?.startsWith('/') ? next : '/'

  if (oauthError) {
    console.error('Supabase OAuth callback error', {
      error: oauthError,
      errorCode: oauthErrorCode,
      errorDescription: oauthErrorDescription,
    })

    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', oauthErrorCode ?? oauthError)
    if (oauthErrorDescription) {
      loginUrl.searchParams.set('message', oauthErrorDescription)
    }

    return NextResponse.redirect(loginUrl)
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', requestUrl.origin))
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Supabase exchangeCodeForSession error', {
      name: error.name,
      message: error.message,
      status: error.status,
    })

    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'auth_callback_failed')
    loginUrl.searchParams.set('message', error.message)

    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}
