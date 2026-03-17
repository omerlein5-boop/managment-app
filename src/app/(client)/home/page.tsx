import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { he } from 'date-fns/locale'
import { formatTime, formatSessionDate, formatShortDate } from '@/lib/utils'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Calendar, ChevronLeft } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export default async function ClientHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get client record
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  if (!client) {
    return (
      <div className="p-4 text-center py-16">
        <div className="text-5xl mb-4">🥊</div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">ברוך הבא!</h2>
        <p className="text-gray-500 text-sm">הפרופיל שלך יוגדר בקרוב על ידי המאמן.</p>
      </div>
    )
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const in7Days = format(addDays(new Date(), 7), 'yyyy-MM-dd')

  // Get upcoming bookings for this client
  const { data: upcomingBookings } = await supabase
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
    .eq('status', 'confirmed')
    .gte('sessions.starts_at', new Date().toISOString())
    .order('sessions.starts_at')
    .limit(3)

  // Get active membership
  const { data: membership } = await supabase
    .from('client_memberships')
    .select('*, membership_plans ( name_he, sessions_per_week )')
    .eq('client_id', client.id)
    .eq('status', 'active')
    .lte('starts_at', today)
    .gte('ends_at', today)
    .single()

  // Count group bookings this week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Sunday
  const weekEnd = addDays(weekStart, 7)

  const { count: weeklyGroupCount } = await supabase
    .from('bookings')
    .select('id, sessions!inner ( session_types!inner ( type ) )', { count: 'exact' })
    .eq('client_id', client.id)
    .eq('status', 'confirmed')
    .eq('sessions.session_types.type', 'group')
    .gte('sessions.starts_at', weekStart.toISOString())
    .lt('sessions.starts_at', weekEnd.toISOString())

  const maxWeekly = membership?.membership_plans?.sessions_per_week ?? 2
  const weeklyUsed = weeklyGroupCount ?? 0
  const weeklyLeft = Math.max(0, maxWeekly - weeklyUsed)

  const dayLabel = format(new Date(), 'EEEE', { locale: he })
  const firstName = client.full_name.split(' ')[0]

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Greeting */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">שלום, {firstName} 👋</h1>
        <p className="text-gray-500 text-sm">{dayLabel}</p>
      </div>

      {/* Membership status */}
      {membership ? (
        <Card className="mb-4 bg-gradient-to-l from-blue-600 to-blue-700 text-white border-0 shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs opacity-75 mb-0.5">מנוי פעיל</div>
              <div className="font-bold text-lg">{membership.membership_plans?.name_he}</div>
              <div className="text-sm opacity-80 mt-1">
                בתוקף עד {formatShortDate(membership.ends_at)}
              </div>
            </div>
            <div className="text-left">
              <div className="text-xs opacity-75 mb-0.5">השבוע</div>
              <div className="text-2xl font-bold">{weeklyUsed}/{maxWeekly}</div>
              <div className="text-xs opacity-75">שיעורים</div>
            </div>
          </div>
          {weeklyLeft === 0 && (
            <div className="mt-2 text-xs bg-white/20 rounded-lg px-2.5 py-1.5 text-center">
              ניצלת את כל השיעורים השבוע
            </div>
          )}
        </Card>
      ) : (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <div className="text-sm font-medium text-orange-700">אין מנוי פעיל</div>
          <div className="text-xs text-orange-500 mt-0.5">פנה למאמן לחידוש מנוי</div>
        </Card>
      )}

      {/* Book CTA */}
      <Link href="/book">
        <div className="mb-4 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl p-4 flex items-center justify-between transition-colors active:bg-gray-700">
          <div>
            <div className="font-bold text-lg">הזמן שיעור</div>
            <div className="text-sm text-gray-300 mt-0.5">ראה שיעורים פנויים</div>
          </div>
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🥊</span>
          </div>
        </div>
      </Link>

      {/* Upcoming bookings */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-900">הזמנות קרובות</h2>
          <Link href="/my-bookings" className="text-sm text-blue-600 font-medium flex items-center gap-0.5">
            הכל
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!upcomingBookings || upcomingBookings.length === 0) ? (
          <Card className="text-center py-6">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <div className="text-sm text-gray-400">אין הזמנות קרובות</div>
            <Link href="/book" className="mt-2 inline-block text-sm text-blue-600 font-medium">
              הזמן שיעור עכשיו
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcomingBookings.map((booking: any) => {
              const session = booking.sessions
              if (!session) return null
              return (
                <Card key={booking.id} className="flex items-center justify-between">
                  <div>
                    <div
                      className="inline-block w-1 h-1 rounded-full ml-1.5 align-middle"
                      style={{ backgroundColor: session.session_types?.color ?? '#3B82F6', width: 8, height: 8 }}
                    />
                    <span className="font-semibold text-sm text-gray-900">
                      {session.session_types?.name_he}
                    </span>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {formatSessionDate(session.starts_at)} · {formatTime(session.starts_at)}
                    </div>
                    {session.locations && (
                      <div className="text-xs text-gray-400 mt-0.5">{session.locations.name}</div>
                    )}
                  </div>
                  <Badge color="green">מאושר ✓</Badge>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
