import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'

interface FormFeedbackProps {
  type: 'error' | 'success'
  message: string | null
  className?: string
}

export function FormFeedback({ type, message, className }: FormFeedbackProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ring-1',
        type === 'error'
          ? 'bg-red-50 text-red-700 ring-red-100'
          : 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        className,
      )}
    >
      {type === 'error' ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      {message}
    </div>
  )
}
