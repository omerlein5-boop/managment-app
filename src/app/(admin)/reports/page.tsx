import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, subMonths, startOfDay } from 'date-fns'
import { he } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { TrendingUp, Users, CalendarCheck, AlertCircle } from 'lucide-react'

export default async function ReportsPage() {
  const supabase = await createClient()
  const now = new Date()
  const thisMonthStart = startOfMonth(now).toISOString()
  const thisMonthEnd = endOfMonth(now).toISOString()
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString()
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString()
  const today = format(now, 'yyyy-MM-dd')

  const [
    thisMonthRevenue,
    lastMonthRevenue,
    activeMembers,
    totalClients,
    revenueByType,
    attendanceStats,
    sessionFillRate,
    unpaidTotal,
  ] = await Promise.all([
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', thisMonthStart)
      .lte('paid_at', thisMonthEnd),

    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', lastMonthStart)
      .lte('paid_at', lastMonthEnd),

    supabase
      .from('client_memberships')
      .select('id', { count: 'exact' })
      .eq('status', 'active')
      .lte('starts_at', today)
      .gte('ends_at', today),

    supabase
      .from('clients')
      .select('id', { count: 'exact' })
      .eq('is_active', true),

    // Revenue by description (approximation for type)
    supabase
      .from('payments')
      .select('amount, description')
      .eq('status', 'paid')
      .gte('paid_at', thisMonthStart)
      .lte('paid_at', thisMonthEnd),

    // Attendance this month
    supabase
      .from('attendance')
      .select('status')
      .gte('marked_at', thisMonthStart)
      .lte('marked_at', thisMonthEnd),

    // Session fill rate this month
    supabase
      .from('sessions')
      .select('capacity, bookings ( status )')
      .gte('starts_at', thisMonthStart)
      .lte('starts_at', thisMonthEnd)
      .neq('status', 'canceled'),

    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'unpaid'),
  ])

  const thisRevenue = (thisMonthRevenue.data ?? []).reduce((s, p) => s + p.amount, 0)
  const lastRevenue = (lastMonthRevenue.data ?? []).reduce((s, p) => s + p.amount, 0)
  const revenueDiff = lastRevenue > 0 ? Math.round(((thisRevenue - lastRevenue) / lastRevenue) * 100) : 0

  const totalAttendance = attendanceStats.data?.length ?? 0
  const presentCount = attendanceStats.data?.filter((a) => a.status === 'present').length ?? 0
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

  const sessions = sessionFillRate.data ?? []
  const avgFillRate = sessions.length > 0
    ? Math.round(
        sessions.reduce((sum, s: any) => {
          const confirmed = s.bookings?.filter((b: any) => b.status === 'confirmed').length ?? 0
          return sum + (confirmed / Math.max(s.capacity, 1)) * 100
        }, 0) / sessions.length
      )
    : 0

  const unpaidBalance = (unpaidTotal.data ?? []).reduce((s, p) => s + p.amount, 0)

  const monthLabel = format(now, 'MMMM yyyy', { locale: he })
  const lastMonthLabel = format(subMonths(now, 1), 'MMMM yyyy', { locale: he })

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">דוחות</h1>
        <p className="text-gray-400 text-sm mt-0.5">{monthLabel}</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">הכנסות החודש</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(thisRevenue)}</div>
          <div className={`text-xs mt-1 ${revenueDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {revenueDiff >= 0 ? '+' : ''}{revenueDiff}% לעומת {lastMonthLabel}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500">מנויים פעילים</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{activeMembers.count ?? 0}</div>
          <div className="text-xs text-gray-400 mt-1">מתוך {totalClients.count ?? 0} תלמידים</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500">אחוז נוכחות</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{attendanceRate}%</div>
          <div className="text-xs text-gray-400 mt-1">{presentCount}/{totalAttendance} שיעורים</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-500">חובות פתוחים</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(unpaidBalance)}</div>
          <div className="text-xs text-gray-400 mt-1">סה״כ לגבייה</div>
        </Card>
      </div>

      {/* Session fill rate */}
      <Card className="mb-4">
        <h2 className="font-bold text-gray-900 mb-3">ממוצע מילוי שיעורים</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${avgFillRate}%` }}
            />
          </div>
          <span className="font-bold text-gray-900 text-sm w-10 text-left">{avgFillRate}%</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">{sessions.length} שיעורים החודש</p>
      </Card>

      {/* Last month comparison */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-3">השוואה לחודש שעבר</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{monthLabel}</span>
            <span className="font-semibold text-gray-900">{formatCurrency(thisRevenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{lastMonthLabel}</span>
            <span className="text-gray-400">{formatCurrency(lastRevenue)}</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
            <span className="text-gray-500">שינוי</span>
            <span className={`font-semibold ${revenueDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueDiff >= 0 ? '+' : ''}{formatCurrency(thisRevenue - lastRevenue)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
