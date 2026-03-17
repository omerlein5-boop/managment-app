import { createClient } from '@/lib/supabase/server'
import { formatSessionDate, formatTime } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Link from 'next/link'
import { subDays } from 'date-fns'

export default async function AttendancePage() {
  const supabase = await createClient()
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, starts_at, ends_at, capacity, status,
      session_types ( name_he, type ),
      bookings ( id, client_id, status, clients ( full_name ) ),
      attendance ( id, client_id, status )
    `)
    .gte('starts_at', thirtyDaysAgo)
    .lte('starts_at', new Date().toISOString())
    .neq('status', 'canceled')
    .order('starts_at', { ascending: false })
    .limit(40)

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">נוכחות</h1>
      <p className="text-sm text-gray-400 mb-4">30 יום אחרונים</p>

      <div className="space-y-3">
        {(sessions ?? []).map((session: any) => {
          const confirmedBookings = session.bookings?.filter(
            (b: any) => b.status === 'confirmed' || b.status === 'no_show'
          ) ?? []
          const presentCount = session.attendance?.filter(
            (a: any) => a.status === 'present'
          ).length ?? 0
          const markedCount = session.attendance?.length ?? 0
          const attendanceRate = confirmedBookings.length > 0
            ? Math.round((presentCount / confirmedBookings.length) * 100)
            : 0

          return (
            <Link key={session.id} href={`/sessions/${session.id}`}>
              <Card className="hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {session.session_types?.name_he}
                    </div>
                    <div className="text-sm text-gray-400 mt-0.5">
                      {formatSessionDate(session.starts_at)} · {formatTime(session.starts_at)}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">
                      {presentCount}/{confirmedBookings.length}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {markedCount === 0 ? 'טרם סומן' : `${attendanceRate}% נוכחות`}
                    </div>
                  </div>
                </div>

                {confirmedBookings.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {confirmedBookings.map((booking: any) => {
                      const att = session.attendance?.find(
                        (a: any) => a.client_id === booking.client_id
                      )
                      return (
                        <span
                          key={booking.id}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            att?.status === 'present'
                              ? 'bg-green-100 text-green-700'
                              : att?.status === 'no_show'
                              ? 'bg-orange-100 text-orange-700'
                              : att?.status === 'absent'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {booking.clients?.full_name}
                        </span>
                      )
                    })}
                  </div>
                )}
              </Card>
            </Link>
          )
        })}

        {(!sessions || sessions.length === 0) && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <div>אין שיעורים להציג</div>
          </div>
        )}
      </div>
    </div>
  )
}
