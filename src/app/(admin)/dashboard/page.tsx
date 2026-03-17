import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatTime, formatDateHe } from '@/lib/utils'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns'
import { Users, CreditCard, CalendarCheck, AlertCircle, TrendingUp, Clock } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'

async function getDashboardData() {
  const supabase = await createClient()
  const today = new Date()
  const dayStart = startOfDay(today).toISOString()
  const dayEnd = endOfDay(today).toISOString()
  const monthStart = startOfMonth(today).toISOString()
  const monthEnd = endOfMonth(today).toISOString()

  const [
    todaySessions,
    activeMembers,
    unpaidPayments,
    monthlyRevenue,
    upcomingBookings,
  ] = await Promise.all([
    // Today's sessions
    supabase
      .from('sessions')
      .select(`
        *,
        session_types ( name_he, type, color ),
        locations ( name ),
        bookings ( id, status, clients ( full_name ) )
      `)
      .gte('starts_at', dayStart)
      .lte('starts_at', dayEnd)
      .neq('status', 'canceled')
      .order('starts_at') as any,

    // Active members count
    supabase
      .from('client_memberships')
      .select('id', { count: 'exact' })
      .eq('status', 'active')
      .lte('starts_at', format(today, 'yyyy-MM-dd'))
      .gte('ends_at', format(today, 'yyyy-MM-dd')) as any,

    // Unpaid payments
    supabase
      .from('payments')
      .select('id, amount, clients ( full_name )', { count: 'exact' })
      .eq('status', 'unpaid')
      .order('created_at', { ascending: false })
      .limit(5) as any,

    // Monthly revenue
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', monthStart)
      .lte('paid_at', monthEnd) as any,

    // Upcoming bookings (next 7 days)
    supabase
      .from('bookings')
      .select(`
        id,
        status,
        sessions ( starts_at, session_types ( name_he ) ),
        clients ( full_name )
      `)
      .eq('status', 'confirmed')
      .gte('sessions.starts_at', today.toISOString())
      .order('sessions.starts_at')
      .limit(8) as any,
  ])

  const revenue = (monthlyRevenue as any).data?.reduce((sum: number, p: any) => sum + p.amount, 0) ?? 0

  return {
    todaySessions: (todaySessions as any).data ?? [],
    activeMembersCount: (activeMembers as any).count ?? 0,
    unpaidPayments: (unpaidPayments as any).data ?? [],
    unpaidCount: (unpaidPayments as any).count ?? 0,
    monthlyRevenue: revenue,
    upcomingBookings: (upcomingBookings as any).data ?? [],
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  const todayLabel = format(new Date(), 'EEEE, d.M.yyyy')

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">לוח בקרה</h1>
        <p className="text-gray-500 text-sm mt-0.5">{todayLabel}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">מנויים פעילים</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.activeMembersCount}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">הכנסות החודש</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.monthlyRevenue)}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-orange-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs text-gray-500">חובות פתוחים</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.unpaidCount}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <CalendarCheck className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">שיעורים היום</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.todaySessions.length}</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Today's Sessions */}
        <Card padding="none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              שיעורים היום
            </h2>
            <Link href="/schedule" className="text-sm text-blue-600 font-medium">
              כל המערכת
            </Link>
          </div>

          {data.todaySessions.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">אין שיעורים היום</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.todaySessions.map((session: any) => {
                const confirmedBookings = session.bookings?.filter(
                  (b: any) => b.status === 'confirmed'
                ) ?? []
                const spotsLeft = session.capacity - confirmedBookings.length

                return (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {session.session_types?.name_he}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatTime(session.starts_at)} · {session.locations?.name ?? ''}
                      </div>
                    </div>
                    <div className="text-left text-sm">
                      <span className="font-semibold text-gray-900">{confirmedBookings.length}</span>
                      <span className="text-gray-400">/{session.capacity}</span>
                      {spotsLeft === 0 && (
                        <Badge color="red" className="mr-2">מלא</Badge>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </Card>

        {/* Unpaid Students */}
        <Card padding="none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              חובות פתוחים
            </h2>
            <Link href="/payments" className="text-sm text-blue-600 font-medium">
              כל התשלומים
            </Link>
          </div>

          {data.unpaidPayments.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">אין חובות פתוחים 🎉</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.unpaidPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {payment.clients?.full_name}
                    </div>
                    <Badge color="red" size="sm" className="mt-0.5">לא שולם</Badge>
                  </div>
                  <div className="font-bold text-gray-900">{formatCurrency(payment.amount)}</div>
                </div>
              ))}
              {data.unpaidCount > 5 && (
                <div className="px-4 py-2 text-center">
                  <Link href="/payments?filter=unpaid" className="text-sm text-blue-600">
                    +{data.unpaidCount - 5} נוספים
                  </Link>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
