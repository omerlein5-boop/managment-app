import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Phone, Mail, Target, AlertTriangle, ArrowRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import StudentActions from '@/components/admin/StudentActions'
import { formatCurrency, formatSessionDate, formatTime, formatShortDate, getMembershipStatusLabel, getPaymentMethodLabel } from '@/lib/utils'

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select(`
      *,
      client_memberships (
        *, membership_plans ( name_he, type, sessions_per_week, validity_days )
      ),
      payments ( * ),
      bookings (
        id, status, created_at,
        sessions ( starts_at, ends_at, session_types ( name_he, type, color ) )
      )
    `)
    .eq('id', id)
    .single()

  if (!client) notFound()

  const today = format(new Date(), 'yyyy-MM-dd')
  const activeMembership = client.client_memberships?.find(
    (m: any) => m.status === 'active' && m.ends_at >= today
  )

  const totalUnpaid = client.payments
    ?.filter((p: any) => p.status === 'unpaid')
    .reduce((sum: number, p: any) => sum + p.amount, 0) ?? 0

  const upcomingBookings = (client.bookings ?? [])
    .filter((b: any) =>
      b.sessions?.starts_at > new Date().toISOString() &&
      b.status === 'confirmed'
    )
    .sort((a: any, b: any) =>
      new Date(a.sessions.starts_at).getTime() - new Date(b.sessions.starts_at).getTime()
    )
    .slice(0, 5)

  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('status, marked_at, sessions ( starts_at, session_types ( name_he ) )')
    .eq('client_id', id)
    .order('marked_at', { ascending: false })
    .limit(10)

  const { data: notes } = await supabase
    .from('notes')
    .select('*, profiles ( full_name )')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const membershipStatus = activeMembership
    ? getMembershipStatusLabel('active')
    : getMembershipStatusLabel('expired')

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      {/* Back */}
      <Link
        href="/students"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowRight className="w-4 h-4" />
        חזור לתלמידים
      </Link>

      {/* Profile card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{client.full_name}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
              <Phone className="w-3.5 h-3.5" />
              <span dir="ltr">{client.phone}</span>
            </div>
            {client.email && (
              <div className="flex items-center gap-1.5 mt-0.5 text-sm text-gray-500">
                <Mail className="w-3.5 h-3.5" />
                <span dir="ltr">{client.email}</span>
              </div>
            )}
          </div>
          <StudentActions client={client} />
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          <Badge color={activeMembership ? 'green' : 'gray'}>
            {membershipStatus.label}
          </Badge>
          {totalUnpaid > 0 && (
            <Badge color="red">חוב {formatCurrency(totalUnpaid)}</Badge>
          )}
        </div>
      </Card>

      {/* Goals & Injuries */}
      {(client.goals || client.injuries) && (
        <Card>
          {client.goals && (
            <div className="flex gap-2 mb-3">
              <Target className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-500 mb-0.5">מטרות</div>
                <div className="text-sm text-gray-700">{client.goals}</div>
              </div>
            </div>
          )}
          {client.injuries && (
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-500 mb-0.5">פציעות / מגבלות</div>
                <div className="text-sm text-orange-700 font-medium">{client.injuries}</div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Active Membership */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">מנוי</h2>
        </div>
        {activeMembership ? (
          <div className="px-4 py-3">
            <div className="font-semibold text-gray-900">
              {activeMembership.membership_plans?.name_he}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              תוקף: {formatShortDate(activeMembership.starts_at)} – {formatShortDate(activeMembership.ends_at)}
            </div>
            {activeMembership.sessions_remaining !== null && (
              <div className="text-sm text-gray-500">
                נשארו {activeMembership.sessions_remaining} שיעורים
              </div>
            )}
            {activeMembership.price_paid !== null && (
              <div className="text-sm text-gray-500">
                שולם: {formatCurrency(activeMembership.price_paid)}
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-4 text-sm text-gray-400 text-center">אין מנוי פעיל</div>
        )}
      </Card>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">הזמנות קרובות</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingBookings.map((booking: any) => (
              <div key={booking.id} className="px-4 py-3 text-sm">
                <div className="font-medium text-gray-900">
                  {booking.sessions?.session_types?.name_he}
                </div>
                <div className="text-gray-400 mt-0.5">
                  {formatSessionDate(booking.sessions?.starts_at)} · {formatTime(booking.sessions?.starts_at)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Attendance History */}
      {attendanceData && attendanceData.length > 0 && (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">היסטוריית נוכחות</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {attendanceData.map((att: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="text-sm">
                  <div className="text-gray-700">{(att.sessions as any)?.session_types?.name_he}</div>
                  <div className="text-gray-400 text-xs">{formatSessionDate((att.sessions as any)?.starts_at)}</div>
                </div>
                <Badge
                  color={
                    att.status === 'present' ? 'green' :
                    att.status === 'no_show' ? 'orange' : 'gray'
                  }
                >
                  {att.status === 'present' ? 'נוכח' : att.status === 'no_show' ? 'לא הגיע' : 'נעדר'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment History */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">תשלומים</h2>
        </div>
        {client.payments?.length === 0 ? (
          <div className="px-4 py-4 text-sm text-gray-400 text-center">אין תשלומים</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(client.payments ?? []).slice(0, 8).map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {payment.description ?? 'תשלום'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {payment.paid_at
                      ? `שולם ${formatShortDate(payment.paid_at)} · ${getPaymentMethodLabel(payment.payment_method)}`
                      : 'לא שולם'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
                  <Badge color={payment.status === 'paid' ? 'green' : 'red'}>
                    {payment.status === 'paid' ? 'שולם' : 'לא שולם'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Notes */}
      {notes && notes.length > 0 && (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">הערות</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {notes.map((note: any) => (
              <div key={note.id} className="px-4 py-3">
                <p className="text-sm text-gray-700">{note.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatShortDate(note.created_at)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
