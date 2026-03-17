import { createClient } from '@/lib/supabase/server'
import { formatSessionDate, formatTime, getBookingStatusLabel, formatShortDate } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Link from 'next/link'
import { addDays, format } from 'date-fns'

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; days?: string }>
}) {
  const { filter, days } = await searchParams
  const supabase = await createClient()

  const dayRange = Number(days ?? 7)
  const from = new Date()
  const to = addDays(from, dayRange)

  let query = supabase
    .from('bookings')
    .select(`
      *,
      sessions (
        id, starts_at, ends_at,
        session_types ( name_he, type ),
        locations ( name )
      ),
      clients ( id, full_name, phone )
    `)
    .gte('sessions.starts_at', from.toISOString())
    .lte('sessions.starts_at', to.toISOString())
    .order('sessions.starts_at')

  if (filter && filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data: bookings } = await query as { data: any[] | null }

  // Group by session
  const sessionMap = new Map<string, { session: any; bookings: any[] }>()
  for (const booking of bookings ?? []) {
    const sessionId = booking.session_id
    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, { session: booking.sessions, bookings: [] })
    }
    sessionMap.get(sessionId)!.bookings.push(booking)
  }

  const grouped = Array.from(sessionMap.values()).sort((a, b) =>
    new Date(a.session?.starts_at).getTime() - new Date(b.session?.starts_at).getTime()
  )

  const filters = [
    { label: 'הכל', value: 'all' },
    { label: 'מאושר', value: 'confirmed' },
    { label: 'ממתין', value: 'pending' },
    { label: 'לא הגיע', value: 'no_show' },
    { label: 'בוטל', value: 'canceled' },
  ]

  const dayFilters = [
    { label: 'שבוע', value: '7' },
    { label: '14 יום', value: '14' },
    { label: 'חודש', value: '30' },
  ]

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">הזמנות</h1>

      {/* Filters */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((f) => (
            <Link
              key={f.value}
              href={`?filter=${f.value}&days=${days ?? 7}`}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (filter ?? 'all') === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          {dayFilters.map((f) => (
            <Link
              key={f.value}
              href={`?filter=${filter ?? 'all'}&days=${f.value}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (days ?? '7') === f.value
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Grouped sessions */}
      {grouped.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📅</div>
          <div>אין הזמנות בתקופה זו</div>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ session, bookings: sessionBookings }) => {
            if (!session) return null
            return (
              <Card key={session.id} padding="none">
                {/* Session header */}
                <Link href={`/sessions/${session.id}`}>
                  <div className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900">
                          {session.session_types?.name_he}
                        </div>
                        <div className="text-sm text-gray-400 mt-0.5">
                          {formatSessionDate(session.starts_at)} · {formatTime(session.starts_at)}
                          {session.locations && ` · ${session.locations.name}`}
                        </div>
                      </div>
                      <Badge color="blue" size="md">
                        {sessionBookings.length} רשומים
                      </Badge>
                    </div>
                  </div>
                </Link>

                {/* Bookings list */}
                <div className="divide-y divide-gray-50">
                  {sessionBookings.map((booking: any) => {
                    const { label, color } = getBookingStatusLabel(booking.status)
                    return (
                      <div key={booking.id} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <Link
                            href={`/students/${booking.clients?.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          >
                            {booking.clients?.full_name}
                          </Link>
                          <div className="text-xs text-gray-400">{booking.clients?.phone}</div>
                        </div>
                        <Badge color={color as any}>{label}</Badge>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
