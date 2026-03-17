'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface SessionFormProps {
  defaultDate: Date
  onSuccess: () => void
  onCancel: () => void
  session?: any  // for editing
}

export default function SessionForm({ defaultDate, onSuccess, onCancel, session }: SessionFormProps) {
  const [sessionTypes, setSessionTypes] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [recurring, setRecurring] = useState(false)
  const [recurringWeeks, setRecurringWeeks] = useState(4)

  const [form, setForm] = useState({
    session_type_id: session?.session_type_id ?? '',
    location_id: session?.location_id ?? '',
    date: session?.starts_at
      ? format(new Date(session.starts_at), 'yyyy-MM-dd')
      : format(defaultDate, 'yyyy-MM-dd'),
    time: session?.starts_at
      ? format(new Date(session.starts_at), 'HH:mm')
      : '18:00',
    duration_minutes: session
      ? String(Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60000))
      : '60',
    capacity: session?.capacity ? String(session.capacity) : '12',
    notes: session?.notes ?? '',
  })

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [typesRes, locsRes] = await Promise.all([
        supabase.from('session_types').select('*').eq('is_active', true) as any,
        supabase.from('locations').select('*').eq('is_active', true) as any,
      ])
      setSessionTypes((typesRes as any).data ?? [])
      setLocations((locsRes as any).data ?? [])
      if (!form.session_type_id && (typesRes as any).data?.[0]) {
        setForm((f) => ({ ...f, session_type_id: (typesRes as any).data[0].id }))
      }
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const starts = new Date(`${form.date}T${form.time}:00`)
      const ends = new Date(starts.getTime() + Number(form.duration_minutes) * 60000)
      const recurringGroupId = recurring ? crypto.randomUUID() : null

      const sessionsToCreate = recurring
        ? Array.from({ length: recurringWeeks }, (_, i) => {
            const s = new Date(starts)
            s.setDate(s.getDate() + i * 7)
            const e = new Date(ends)
            e.setDate(e.getDate() + i * 7)
            return {
              session_type_id: form.session_type_id,
              location_id: form.location_id || null,
              starts_at: s.toISOString(),
              ends_at: e.toISOString(),
              capacity: Number(form.capacity),
              notes: form.notes || null,
              recurring_group_id: recurringGroupId,
            }
          })
        : [{
            session_type_id: form.session_type_id,
            location_id: form.location_id || null,
            starts_at: starts.toISOString(),
            ends_at: ends.toISOString(),
            capacity: Number(form.capacity),
            notes: form.notes || null,
          }]

      if (session) {
        // Edit mode
        const { error } = await (supabase
          .from('sessions') as any)
          .update({
            session_type_id: form.session_type_id,
            location_id: form.location_id || null,
            starts_at: starts.toISOString(),
            ends_at: ends.toISOString(),
            capacity: Number(form.capacity),
            notes: form.notes || null,
          })
          .eq('id', session.id)
        if (error) throw error
      } else {
        const { error } = await (supabase.from('sessions') as any).insert(sessionsToCreate)
        if (error) throw error
      }

      onSuccess()
    } catch (err) {
      console.error(err)
      alert('שגיאה בשמירת השיעור')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Session type */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">סוג שיעור</label>
        <select
          value={form.session_type_id}
          onChange={(e) => setForm((f) => ({ ...f, session_type_id: e.target.value }))}
          required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        >
          <option value="">בחר סוג שיעור</option>
          {sessionTypes.map((st) => (
            <option key={st.id} value={st.id}>{st.name_he}</option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">מיקום</label>
        <select
          value={form.location_id}
          onChange={(e) => setForm((f) => ({ ...f, location_id: e.target.value }))}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        >
          <option value="">בחר מיקום</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="תאריך"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          required
        />
        <Input
          label="שעה"
          type="time"
          value={form.time}
          onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
          required
        />
      </div>

      {/* Duration & Capacity */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="משך (דקות)"
          type="number"
          value={form.duration_minutes}
          onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
          min="30"
          max="180"
          required
        />
        <Input
          label="קיבולת"
          type="number"
          value={form.capacity}
          onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          min="1"
          max="50"
          required
        />
      </div>

      {/* Recurring (only for new sessions) */}
      {!session && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">שיעור קבוע (חוזר שבועי)</span>
          </label>
          {recurring && (
            <div className="mt-2">
              <Input
                label="כמה שבועות?"
                type="number"
                value={String(recurringWeeks)}
                onChange={(e) => setRecurringWeeks(Number(e.target.value))}
                min="2"
                max="52"
              />
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">הערות (אופציונלי)</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
          placeholder="הערות לשיעור..."
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading} fullWidth>
          {loading ? 'שומר...' : session ? 'עדכן שיעור' : recurring ? `צור ${recurringWeeks} שיעורים` : 'צור שיעור'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  )
}
