import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatSessionDate, formatTime, formatCurrency } from '@/lib/utils'
import { Users, MapPin, Clock, ArrowRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import AttendanceMarker from '@/components/admin/AttendanceMarker'
import AddBookingToSession from '@/components/admin/AddBookingToSession'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select(`
      *,
      session_types ( name_he, type, price, color ),
      locations ( name, address ),
      bookings (
        id, status, booked_by, created_at,
        clients ( id, full_name, phone )
      )
    `)
    .eq('id', id)
    .single() as { data: any | null }

  if (!session) notFound()

  const confirmedBookings = session.bookings?.filter(
    (b: any) => b.status === 'confirmed' || b.status === 'pending'
  ) ?? []
  const canceledBookings = session.bookings?.filter(
    (b: any) => b.status === 'canceled' || b.status === 'no_show'
  ) ?? []

  const spotsLeft = session.capacity - confirmedBookings.length
  const isPast = new Date(session.starts_at) < new Date()

  // Get attendance records
  const { data: attendanceRecords } = await supabase
    .from('attendance')
    .select('*')
    .eq('session_id', id) as { data: any[] | null }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/schedule"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowRight className="w-4 h-4" />
        חזור למערכת שעות
      </Link>

      {/* Session header */}
      <Card className="mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div
              className="inline-flex items-center px-2 py-1 rounded-full text-white text-xs font-medium mb-2"
              style={{ backgroundColor: session.session_types?.color ?? '#3B82F6' }}
            >
              {session.session_types?.name_he}
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {formatSessionDate(session.starts_at)}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
              </span>
              {session.locations && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {session.locations.name}
                </span>
              )}
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1 text-sm font-semibold">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{confirmedBookings.length}</span>
              <span className="text-gray-400">/{session.capacity}</span>
            </div>
            {spotsLeft === 0 ? (
              <Badge color="red" className="mt-1">מלא</Badge>
            ) : (
              <Badge color="green" className="mt-1">{spotsLeft} פנויים</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Attendance / Bookings */}
      <Card padding="none" className="mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">
            רשימת נוכחים ({confirmedBookings.length})
          </h2>
          {!isPast && spotsLeft > 0 && (
            <AddBookingToSession sessionId={id} />
          )}
        </div>

        {confirmedBookings.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">אין הרשמות לשיעור זה</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {confirmedBookings.map((booking: any) => {
              const att = attendanceRecords?.find((a: any) => a.client_id === booking.clients?.id)

              return (
                <div key={booking.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <Link
                      href={`/students/${booking.clients?.id}`}
                      className="font-medium text-sm text-gray-900 hover:text-blue-600"
                    >
                      {booking.clients?.full_name}
                    </Link>
                    <div className="text-xs text-gray-400 mt-0.5">{booking.clients?.phone}</div>
                  </div>

                  <AttendanceMarker
                    sessionId={id}
                    clientId={booking.clients?.id}
                    bookingId={booking.id}
                    currentStatus={att?.status}
                    isPast={isPast}
                  />
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Canceled / No-show */}
      {canceledBookings.length > 0 && (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-700 text-sm">ביטולים ואי-הגעה ({canceledBookings.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {canceledBookings.map((booking: any) => (
              <div key={booking.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-500">{booking.clients?.full_name}</span>
                <Badge color={booking.status === 'no_show' ? 'orange' : 'gray'}>
                  {booking.status === 'no_show' ? 'לא הגיע' : 'ביטל'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
