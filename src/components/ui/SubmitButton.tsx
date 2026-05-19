'use client'

import { useFormStatus } from 'react-dom'
import { clsx } from 'clsx'
import { LoadingSpinner } from './LoadingSpinner'

interface SubmitButtonProps {
  label: string
  loadingLabel?: string
  variant?: 'primary' | 'secondary' | 'danger'
  className?: string
  disabled?: boolean
}

const variantMap = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-600 shadow-sm transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 active:translate-y-px',
}

export function SubmitButton({
  label,
  loadingLabel,
  variant = 'primary',
  className,
  disabled,
}: SubmitButtonProps) {
  const { pending } = useFormStatus()
  const isDisabled = pending || disabled

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={clsx(variantMap[variant], 'disabled:cursor-not-allowed disabled:opacity-60', className)}
    >
      {pending ? (
        <>
          <LoadingSpinner size="sm" />
          {loadingLabel ?? 'กำลังบันทึก...'}
        </>
      ) : (
        label
      )}
    </button>
  )
}
