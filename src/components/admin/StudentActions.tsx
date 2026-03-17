'use client'

import { useState } from 'react'
import { MoreVertical, Edit, CreditCard, UserCheck } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import StudentForm from './StudentForm'
import PaymentForm from './PaymentForm'
import MembershipForm from './MembershipForm'

export default function StudentActions({ client }: { client: any }) {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<'edit' | 'payment' | 'membership' | null>(null)

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-20 min-w-36 py-1">
              <button
                onClick={() => { setModal('edit'); setOpen(false) }}
                className="flex items-center gap-2 px-4 py-2.5 w-full text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
                ערוך פרטים
              </button>
              <button
                onClick={() => { setModal('membership'); setOpen(false) }}
                className="flex items-center gap-2 px-4 py-2.5 w-full text-sm text-gray-700 hover:bg-gray-50"
              >
                <UserCheck className="w-4 h-4" />
                הוסף מנוי
              </button>
              <button
                onClick={() => { setModal('payment'); setOpen(false) }}
                className="flex items-center gap-2 px-4 py-2.5 w-full text-sm text-gray-700 hover:bg-gray-50"
              >
                <CreditCard className="w-4 h-4" />
                רשום תשלום
              </button>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={modal === 'edit'} onClose={() => setModal(null)} title="עריכת פרטי תלמיד">
        <StudentForm
          client={client}
          onSuccess={() => { setModal(null); window.location.reload() }}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <Modal isOpen={modal === 'payment'} onClose={() => setModal(null)} title="רישום תשלום">
        <PaymentForm
          clientId={client.id}
          clientName={client.full_name}
          onSuccess={() => { setModal(null); window.location.reload() }}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <Modal isOpen={modal === 'membership'} onClose={() => setModal(null)} title="הוספת מנוי">
        <MembershipForm
          clientId={client.id}
          onSuccess={() => { setModal(null); window.location.reload() }}
          onCancel={() => setModal(null)}
        />
      </Modal>
    </>
  )
}
