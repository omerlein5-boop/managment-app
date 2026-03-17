'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import StudentForm from '@/components/admin/StudentForm'

export default function AddStudentButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        תלמיד חדש
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="הוספת תלמיד חדש" size="md">
        <StudentForm
          onSuccess={() => {
            setOpen(false)
            window.location.reload()
          }}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  )
}
