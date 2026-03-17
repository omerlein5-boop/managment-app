'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatShortDate, getPaymentMethodLabel } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import PaymentForm from '@/components/admin/PaymentForm'
import { Plus, CreditCard } from 'lucide-react'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all')
  const [showForm, setShowForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null)
  const [clients, setClients] = useState<any[]>([])

  const supabase = createClient()

  async function fetchPayments() {
    setLoading(true)
    let query = supabase
      .from('payments')
      .select(`*, clients ( id, full_name, phone )`)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    setPayments(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPayments()
  }, [filter])

  async function markPaid(paymentId: string) {
    const method = prompt('אמצעי תשלום (bit/cash/transfer/credit_card):') ?? 'bit'
    await (supabase
      .from('payments') as any)
      .update({
        status: 'paid',
        payment_method: method,
        paid_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
    fetchPayments()
  }

  const totalUnpaid = payments
    .filter((p) => p.status === 'unpaid')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">תשלומים</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          תשלום חדש
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4">
          <div className="text-xs text-gray-500 mb-1">חובות פתוחים</div>
          <div className="text-xl font-bold text-red-600">{formatCurrency(totalUnpaid)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-500 mb-1">הכנסות (מוצג)</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'unpaid', 'paid'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f === 'all' ? 'הכל' : f === 'unpaid' ? 'לא שולם' : 'שולם'}
          </button>
        ))}
      </div>

      {/* Payment list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <div>אין תשלומים</div>
        </div>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-gray-50">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">
                    {payment.clients?.full_name}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {payment.description ?? '—'}
                    {payment.paid_at && (
                      <span> · {formatShortDate(payment.paid_at)} · {getPaymentMethodLabel(payment.payment_method)}</span>
                    )}
                    {!payment.paid_at && payment.created_at && (
                      <span> · נוצר {formatShortDate(payment.created_at)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mr-2">
                  <span className="font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
                  {payment.status === 'paid' ? (
                    <Badge color="green">שולם</Badge>
                  ) : (
                    <button
                      onClick={() => markPaid(payment.id)}
                      className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 px-2 py-1 rounded-full font-medium transition-colors"
                    >
                      סמן שולם
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add payment modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="תשלום חדש">
        <AddPaymentFlow
          onSuccess={() => {
            setShowForm(false)
            fetchPayments()
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}

function AddPaymentFlow({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('clients')
      .select('id, full_name, phone')
      .eq('is_active', true)
      .order('full_name')
      .then(({ data }) => setClients(data ?? []))
  }, [])

  const filtered = clients.filter(
    (c) => c.full_name.includes(search) || c.phone.includes(search)
  )

  if (selectedClient) {
    return (
      <PaymentForm
        clientId={selectedClient.id}
        clientName={selectedClient.full_name}
        onSuccess={onSuccess}
        onCancel={() => setSelectedClient(null)}
      />
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">בחר תלמיד</p>
      <input
        type="text"
        placeholder="חפש תלמיד..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
      />
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {filtered.map((client) => (
          <button
            key={client.id}
            onClick={() => setSelectedClient(client)}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-right"
          >
            <div>
              <div className="font-medium text-sm text-gray-900">{client.full_name}</div>
              <div className="text-xs text-gray-400">{client.phone}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
