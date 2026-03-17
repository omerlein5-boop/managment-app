'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import { ChevronRight, ChevronLeft, Plus, Users, Lock } from 'lucide-react'
import { formatTime, cn } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import SessionForm from '@/components/admin/SessionForm'
import Link from 'next/link'

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

export default function SchedulePage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  )
  const [showForm, setShowForm] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const supabase = createClient()

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    const weekEnd = addDays(weekStart, 6)

    const { data } = await supabase
      .from('sessions')
      .select(`
        *,
        session_types ( name_he, type, color, price ),
        locations ( name ),
        bookings ( id, status )
      `)
      .gte('starts_at', weekStart.toISOString())
      .lte('starts_at', weekEnd.toISOString())
      .neq('status', 'canceled')
      .order('starts_at')

    setSessions(data ?? [])
    setLoading(false)
  }, [weekStart])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getSessionsForDay = (day: Date) =>
    sessions.filter((s) => isSameDay(parseISO(s.starts_at), day))

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">מערכת שעות</h1>
        <button
          onClick={() => { setSelectedDay(new Date()); setShowForm(true) }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          שיעור חדש
        </button>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4 bg-white rounded-xl border border-gray-100 shadow-sm p-3">
        <button
          onClick={() => setWeekStart((d) => addDays(d, -7))}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        <div className="text-center">
          <div className="font-semibold text-gray-900 text-sm">
            {format(weekStart, 'd בMMMM', { locale: he })} –{' '}
            {format(addDays(weekStart, 6), 'd בMMMM yyyy', { locale: he })}
          </div>
        </div>
        <button
          onClick={() => setWeekStart((d) => addDays(d, 7))}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day columns (horizontal scroll on mobile) */}
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-2 min-w-max pb-2">
          {days.map((day, idx) => {
            const isToday = isSameDay(day, new Date())
            const daySessions = getSessionsForDay(day)

            return (
              <div
                key={idx}
                className="w-40 lg:w-auto lg:flex-1"
                style={{ minWidth: '140px' }}
              >
                {/* Day header */}
                <div
                  className={cn(
                    'text-center py-2 px-2 rounded-xl mb-2',
                    isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  <div className="text-xs font-medium">{DAY_NAMES[idx]}</div>
                  <div className="text-lg font-bold">{format(day, 'd')}</div>
                </div>

                {/* Sessions for this day */}
                <div className="space-y-2">
                  {loading ? (
                    <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                  ) : daySessions.length === 0 ? (
                    <button
                      onClick={() => { setSelectedDay(day); setShowForm(true) }}
                      className="w-full h-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-300 hover:border-blue-300 hover:text-blue-400 transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  ) : (
                    daySessions.map((session) => {
                      const confirmedCount = session.bookings?.filter(
                        (b: any) => b.status === 'confirmed'
                      ).length ?? 0
                      const isFull = confirmedCount >= session.capacity
                      const sessionType = session.session_types

                      return (
                        <Link
                          key={session.id}
                          href={`/sessions/${session.id}`}
                          className="block"
                        >
                          <div
                            className="rounded-xl p-2.5 text-white text-xs"
                            style={{
                              backgroundColor: sessionType?.color ?? '#3B82F6',
                              opacity: session.status === 'completed' ? 0.6 : 1,
                            }}
                          >
                            <div className="font-bold truncate">{sessionType?.name_he}</div>
                            <div className="opacity-90 mt-0.5">{formatTime(session.starts_at)}</div>
                            <div className="flex items-center gap-1 mt-1 opacity-90">
                              {isFull ? (
                                <Lock className="w-3 h-3" />
                              ) : (
                                <Users className="w-3 h-3" />
                              )}
                              <span>{confirmedCount}/{session.capacity}</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })
                  )}

                  {/* Add session to non-empty day */}
                  {!loading && daySessions.length > 0 && (
                    <button
                      onClick={() => { setSelectedDay(day); setShowForm(true) }}
                      className="w-full h-8 border border-dashed border-gray-200 rounded-lg text-gray-300 hover:border-blue-300 hover:text-blue-400 transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Session form modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="שיעור חדש"
        size="md"
      >
        <SessionForm
          defaultDate={selectedDay ?? new Date()}
          onSuccess={() => {
            setShowForm(false)
            fetchSessions()
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
