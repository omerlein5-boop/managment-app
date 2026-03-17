'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, addDays } from 'date-fns'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface MembershipFormProps {
  clientId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function MembershipForm({ clientId, onSuccess, onCancel }: MembershipFormProps) {
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [form, setForm] = useState({
    plan_id: '',
    starts_at: format(new Date(), 'yyyy-MM-dd'),
    price_paid: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('membership_plans')
      .select('*')
      .eq('is_active', true)
      .then(({ data }) => {
        setPlans(data ?? [])
        if (data?.[0]) {
          setSelectedPlan(data[0])
          setForm((f) => ({
            ...f,
            plan_id: data[0].id,
            price_paid: String(data[0].price),
          }))
        }
      })
  }, [])

  function handlePlanChange(planId: string) {
    const plan = plans.find((p) => p.id === planId)
    setSelectedPlan(plan)
    setForm((f) => ({
      ...f,
      plan_id: planId,
      price_paid: plan ? String(plan.price) : '',
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const starts = new Date(form.starts_at)
      const ends = addDays(starts, selectedPlan?.validity_days ?? 30)

      const { error } = await supabase.from('client_memberships').insert({
        client_id: clientId,
        plan_id: form.plan_id,
        starts_at: form.starts_at,
        ends_at: format(ends, 'yyyy-MM-dd'),
        status: 'active',
        sessions_remaining: selectedPlan?.sessions_total ?? null,
        price_paid: Number(form.price_paid),
        notes: form.notes || null,
      })

      if (error) throw error

      // Also create a payment record
      await supabase.from('payments').insert({
        client_id: clientId,
        amount: Number(form.price_paid),
        status: 'unpaid',  // Admin will mark it paid separately
        description: selectedPlan?.name_he,
      })

      onSuccess()
    } catch (err: any) {
      alert(err.message ?? 'שגיאה בשמירה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">סוג מנוי</label>
        <select
          value={form.plan_id}
          onChange={(e) => handlePlanChange(e.target.value)}
          required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name_he} – {plan.price}₪
            </option>
          ))}
        </select>
        {selectedPlan && (
          <p className="text-xs text-gray-400">
            {selectedPlan.sessions_per_week
              ? `${selectedPlan.sessions_per_week} שיעורים לשבוע · `
              : ''}
            תוקף {selectedPlan.validity_days} ימים
          </p>
        )}
      </div>

      <Input
        label="תחילת מנוי"
        type="date"
        value={form.starts_at}
        onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
        required
      />

      <Input
        label="מחיר ששולם (₪)"
        type="number"
        value={form.price_paid}
        onChange={(e) => setForm((f) => ({ ...f, price_paid: e.target.value }))}
        placeholder="400"
        required
        dir="ltr"
      />

      <Input
        label="הערות (אופציונלי)"
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        placeholder="הנחה, הסכם מיוחד..."
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} fullWidth>
          {loading ? 'שומר...' : 'הוסף מנוי'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  )
}
