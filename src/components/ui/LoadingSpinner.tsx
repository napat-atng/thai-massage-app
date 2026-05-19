import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-8 w-8 border-[3px]',
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label="กำลังโหลด"
      className={clsx(
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        sizeMap[size],
        className,
      )}
    />
  )
}
