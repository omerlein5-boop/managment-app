'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttendanceMarkerProps {
  sessionId: string
  clientId: string
  bookingId: string
  currentStatus?: string
  isPast: boolean
}

export default function AttendanceMarker({
  sessionId,
  clientId,
  bookingId,
  currentStatus,
  isPast,
}: AttendanceMarkerProps) {
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function markAttendance(newStatus: 'present' | 'absent' | 'no_show') {
    if (saving) return
    setSaving(true)

    try {
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('session_id', sessionId)
        .eq('client_id', clientId)
        .single() as { data: any | null }

      if (existing) {
        await (supabase
          .from('attendance') as any)
          .update({ status: newStatus })
          .eq('id', existing.id)
      } else {
        await (supabase.from('attendance') as any).insert({
          session_id: sessionId,
          client_id: clientId,
          booking_id: bookingId,
          status: newStatus,
        })
      }

      setStatus(newStatus)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!isPast) {
    return (
      <span className="text-xs text-gray-400">מחכה לשיעור</span>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => markAttendance('present')}
        disabled={saving}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          status === 'present'
            ? 'bg-green-100 text-green-600'
            : 'hover:bg-gray-100 text-gray-400'
        )}
        title="נוכח"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={() => markAttendance('no_show')}
        disabled={saving}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          status === 'no_show'
            ? 'bg-orange-100 text-orange-600'
            : 'hover:bg-gray-100 text-gray-400'
        )}
        title="לא הגיע"
      >
        <AlertCircle className="w-4 h-4" />
      </button>
      <button
        onClick={() => markAttendance('absent')}
        disabled={saving}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          status === 'absent'
            ? 'bg-red-100 text-red-600'
            : 'hover:bg-gray-100 text-gray-400'
        )}
        title="נעדר"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
