'use client'

import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'

export type MutationResult = {
  success: boolean
  message: string
}

type MutationFormProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, 'action'> & {
  action: (formData: FormData) => Promise<MutationResult>
  successMessage: string
  errorMessage?: string
  confirmMessage?: string
}

export function MutationForm({
  action,
  successMessage,
  errorMessage = 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
  confirmMessage,
  children,
  ...formProps
}: MutationFormProps) {
  const router = useRouter()

  return (
    <form
      {...formProps}
      action={async (formData) => {
        if (confirmMessage) {
          const confirmation = await Swal.fire({
            title: 'ยืนยันการดำเนินการ',
            text: confirmMessage,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#ab4a16',
          })
          if (!confirmation.isConfirmed) return
        }

        try {
          const result = await action(formData)
          if (!result.success) {
            await Swal.fire({ icon: 'error', title: 'ดำเนินการไม่สำเร็จ', text: result.message || errorMessage })
            return
          }

          router.refresh()
          await Swal.fire({ icon: 'success', title: 'สำเร็จ', text: result.message || successMessage, timer: 1800, showConfirmButton: false })
        } catch {
          await Swal.fire({ icon: 'error', title: 'ดำเนินการไม่สำเร็จ', text: errorMessage })
        }
      }}
    >
      {children}
    </form>
  )
}
