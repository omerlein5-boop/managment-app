'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatSessionDate, formatTime, isCancellable } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { Calendar, X } from 'lucide-react'

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState<string | null>(null)
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', user.id)
      .single() as { data: any | null }

    if (!client) { setLoading(false); return }

    const { data } = await supabase
      .from('bookings')
      .select(`
        id, status, created_at,
        sessions (
          id, starts_at, ends_at, capacity,
          session_types ( name_he, type, color ),
          locations ( name )
        )
      `)
      .eq('client_id', client.id)
      .neq('status', 'canceled')
      .order('sessions.starts_at', { ascending: false })
      .limit(50)

    setBookings(data ?? [])
    setLoading(false)
  }

  async function cancelBooking(bookingId: string, sessionStartsAt: string) {
    if (!isCancellable(sessionStartsAt)) {
      alert('לא ניתן לבטל פחות מ-4 שעות לפני השיעור. צור קשר עם המאמן.')
      return
    }

    if (!confirm('האם לבטל את ההזמנה?')) return

    setCanceling(bookingId)
    await (supabase
      .from('bookings') as any)
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        cancellation_reason: 'client_canceled',
      })
      .eq('id', bookingId)

    setBookings((prev) =>
      prev.map((b) => b.id === bookingId ? { ...b, status: 'canceled' } : b)
    )
    setCanceling(null)
  }

  const now = new Date()
  const upcoming = bookings.filter((b) =>
    b.sessions?.starts_at > now.toISOString() && b.status !== 'canceled'
  )
  const past = bookings.filter((b) =>
    b.sessions?.starts_at <= now.toISOString()
  )
  const displayed = filter === 'upcoming' ? upcoming : past

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">ההזמנות שלי</h1>

      {/* Tab */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          קרובות ({upcoming.length})
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'past' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          היסטוריה
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <div className="text-gray-400 text-sm">
            {filter === 'upcoming' ? 'אין הזמנות קרובות' : 'אין היסטוריית הזמנות'}
          </div>
          {filter === 'upcoming' && (
            <button
              onClick={() => router.push('/book')}
              className="mt-3 text-sm text-blue-600 font-medium"
            >
              הזמן שיעור עכשיו
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((booking) => {
            const session = booking.sessions
            if (!session) return null
            const canCancel = filter === 'upcoming' && isCancellable(session.starts_at)
            const isPast = new Date(session.starts_at) < now

            return (
              <Card key={booking.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: session.session_types?.color ?? '#3B82F6' }}
                      >
                        {session.session_types?.name_he}
                      </span>
                      {booking.status === 'confirmed' && !isPast && (
                        <Badge color="green">מאושר ✓</Badge>
                      )}
                      {booking.status === 'waitlisted' && (
                        <Badge color="blue">המתנה</Badge>
                      )}
                      {isPast && <Badge color="gray">הסתיים</Badge>}
                    </div>

                    <div className="mt-1.5 font-semibold text-gray-900">
                      {formatSessionDate(session.starts_at)}
                    </div>
                    <div className="text-sm text-gray-400 mt-0.5">
                      {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
                      {session.locations && ` · ${session.locations.name}`}
                    </div>
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => cancelBooking(booking.id, session.starts_at)}
                      disabled={canceling === booking.id}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="בטל הזמנה"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
