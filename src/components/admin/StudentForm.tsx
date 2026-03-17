'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface StudentFormProps {
  client?: any  // for edit mode
  onSuccess: () => void
  onCancel: () => void
}

export default function StudentForm({ client, onSuccess, onCancel }: StudentFormProps) {
  const [form, setForm] = useState({
    full_name: client?.full_name ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    goals: client?.goals ?? '',
    injuries: client?.injuries ?? '',
    notes: client?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim() || !form.phone.trim()) {
      setError('שם וטלפון הם שדות חובה')
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        goals: form.goals.trim() || null,
        injuries: form.injuries.trim() || null,
        notes: form.notes.trim() || null,
      }

      if (client) {
        const { error } = await (supabase
          .from('clients') as any)
          .update(payload)
          .eq('id', client.id)
        if (error) throw error
      } else {
        const { error } = await (supabase.from('clients') as any).insert(payload)
        if (error) throw error
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message ?? 'שגיאה בשמירה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="שם מלא *"
          value={form.full_name}
          onChange={(e) => update('full_name', e.target.value)}
          placeholder="ישראל ישראלי"
          required
        />
        <Input
          label="טלפון *"
          type="tel"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          placeholder="052-0000000"
          required
          dir="ltr"
        />
      </div>

      <Input
        label="אימייל (אופציונלי)"
        type="email"
        value={form.email}
        onChange={(e) => update('email', e.target.value)}
        placeholder="email@example.com"
        dir="ltr"
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">מטרות</label>
        <textarea
          value={form.goals}
          onChange={(e) => update('goals', e.target.value)}
          rows={2}
          placeholder="ירידה במשקל, תחרות, כושר כללי..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">פציעות / מגבלות</label>
        <textarea
          value={form.injuries}
          onChange={(e) => update('injuries', e.target.value)}
          rows={2}
          placeholder="כאבי גב, ברך..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">הערות</label>
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={2}
          placeholder="הערות נוספות..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={loading} fullWidth>
          {loading ? 'שומר...' : client ? 'עדכן פרטים' : 'הוסף תלמיד'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  )
}
