'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'
import { clsx } from 'clsx'

export type ToastType = 'success' | 'error'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

// Simple event bus for toasts (no extra lib needed)
type Listener = (toast: ToastMessage) => void
const listeners: Listener[] = []

export function toast(type: ToastType, message: string) {
  const id = Math.random().toString(36).slice(2)
  listeners.forEach((fn) => fn({ id, type, message }))
}
toast.success = (msg: string) => toast('success', msg)
toast.error   = (msg: string) => toast('error',   msg)

export function useToastSubscribe(fn: Listener) {
  useEffect(() => {
    listeners.push(fn)
    return () => {
      const idx = listeners.indexOf(fn)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  }, [fn])
}

// ─── ToastContainer ─────────────────────────────────────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useToastSubscribe((t) => {
    setToasts((prev) => [...prev, t])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id))
    }, 4000)
  })

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'flex min-w-[260px] max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-stone-300/50 animate-in slide-in-from-right-4 duration-300',
            t.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800',
          )}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          )}
          <p className="flex-1 text-sm font-medium">{t.message}</p>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="shrink-0 text-current opacity-50 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
