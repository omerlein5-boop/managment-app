'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { PAYMENT_METHODS } from '@/lib/constants'
import { format } from 'date-fns'

interface PaymentFormProps {
  clientId: string
  clientName: string
  defaultAmount?: number
  defaultDescription?: string
  onSuccess: () => void
  onCancel: () => void
}

export default function PaymentForm({
  clientId,
  clientName,
  defaultAmount,
  defaultDescription,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [form, setForm] = useState({
    amount: defaultAmount ? String(defaultAmount) : '',
    payment_method: 'bit' as string,
    description: defaultDescription ?? '',
    paid_at: format(new Date(), 'yyyy-MM-dd'),
    status: 'paid' as 'paid' | 'unpaid',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) {
      setError('הכנס סכום תקין')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await (supabase.from('payments') as any).insert({
        client_id: clientId,
        amount: Number(form.amount),
        status: form.status,
        payment_method: form.status === 'paid' ? form.payment_method : null,
        paid_at: form.status === 'paid' ? new Date(form.paid_at).toISOString() : null,
        description: form.description || null,
        notes: form.notes || null,
      })

      if (error) throw error
      onSuccess()
    } catch (err: any) {
      setError(err.message ?? 'שגיאה בשמירה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
        תלמיד: <span className="font-semibold text-gray-900">{clientName}</span>
      </div>

      <Input
        label="סכום (₪)"
        type="number"
        value={form.amount}
        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
        placeholder="400"
        min="1"
        required
        dir="ltr"
      />

      <Input
        label="תיאור"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="מנוי חודשי / שיעור פרטי..."
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">סטטוס</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, status: 'paid' }))}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              form.status === 'paid'
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            שולם ✓
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, status: 'unpaid' }))}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              form.status === 'unpaid'
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            לא שולם
          </button>
        </div>
      </div>

      {form.status === 'paid' && (
        <>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">אמצעי תשלום</label>
            <select
              value={form.payment_method}
              onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <Input
            label="תאריך תשלום"
            type="date"
            value={form.paid_at}
            onChange={(e) => setForm((f) => ({ ...f, paid_at: e.target.value }))}
          />
        </>
      )}

      <Input
        label="הערות (אופציונלי)"
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        placeholder="הערות נוספות..."
      />

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} fullWidth>
          {loading ? 'שומר...' : 'שמור תשלום'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  )
}
