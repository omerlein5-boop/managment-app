'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatSessionDate, formatTime, getSessionStatus } from '@/lib/utils'
import { addDays, format, startOfWeek } from 'date-fns'
import { Users, MapPin, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useRouter } from 'next/navigation'

type BookingStep = 'list' | 'confirm' | 'success'

export default function BookPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [step, setStep] = useState<BookingStep>('list')
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)
  const [myBookingIds, setMyBookingIds] = useState<Set<string>>(new Set())
  const [membership, setMembership] = useState<any>(null)
  const [weeklyGroupCount, setWeeklyGroupCount] = useState(0)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Get client record
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', user.id)
      .single() as { data: any | null }

    const cid = clientData?.id
    setClientId(cid ?? null)

    if (cid) {
      // Get active membership
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: mem } = await supabase
        .from('client_memberships')
        .select('*, membership_plans ( sessions_per_week )')
        .eq('client_id', cid)
        .eq('status', 'active')
        .lte('starts_at', today)
        .gte('ends_at', today)
        .single()
      setMembership(mem)

      // Count weekly group bookings
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
      const weekEnd = addDays(weekStart, 7)
      const { count } = await supabase
        .from('bookings')
        .select('id, sessions!inner ( session_types!inner ( type ) )', { count: 'exact' })
        .eq('client_id', cid)
        .eq('status', 'confirmed')
        .eq('sessions.session_types.type', 'group')
        .gte('sessions.starts_at', weekStart.toISOString())
        .lt('sessions.starts_at', weekEnd.toISOString())
      setWeeklyGroupCount(count ?? 0)
    }

    // Get available sessions (next 14 days)
    const from = new Date()
    const to = addDays(from, 14)

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select(`
        id, starts_at, ends_at, capacity, status, notes,
        session_types ( id, name_he, type, price, color, duration_minutes ),
        locations ( name ),
        bookings ( id, client_id, status )
      `)
      .gte('starts_at', from.toISOString())
      .lte('starts_at', to.toISOString())
      .eq('status', 'scheduled')
      .order('starts_at')

    setSessions(sessionsData ?? [])

    // Track which sessions this user is already booked into
    if (cid && sessionsData) {
      const booked = new Set(
        sessionsData
          .filter((s: any) =>
            s.bookings?.some((b: any) => b.client_id === cid && ['confirmed', 'pending'].includes(b.status))
          )
          .map((s: any) => s.id)
      )
      setMyBookingIds(booked)
    }

    setLoading(false)
  }

  async function confirmBooking() {
    if (!selectedSession || !clientId) return

    setBooking(true)
    setBookingError('')

    try {
      // Check eligibility for group sessions
      if (selectedSession.session_types?.type === 'group') {
        if (!membership) {
          setBookingError('נדרש מנוי פעיל כדי להזמין שיעורים קבוצתיים.')
          setBooking(false)
          return
        }
        const maxPerWeek = membership.membership_plans?.sessions_per_week ?? 2
        if (weeklyGroupCount >= maxPerWeek) {
          setBookingError(`ניצלת את מכסת השיעורים השבועית (${maxPerWeek} שיעורים בשבוע).`)
          setBooking(false)
          return
        }
      }

      // Check capacity
      const confirmedCount = selectedSession.bookings?.filter(
        (b: any) => ['confirmed', 'pending'].includes(b.status)
      ).length ?? 0

      if (confirmedCount >= selectedSession.capacity) {
        // Add to waitlist instead
        const { data: existing } = await supabase
          .from('waitlist_entries')
          .select('id')
          .eq('session_id', selectedSession.id)
          .eq('client_id', clientId)
          .single()

        if (!existing) {
          const { count } = await supabase
            .from('waitlist_entries')
            .select('id', { count: 'exact' })
            .eq('session_id', selectedSession.id)
            .eq('status', 'waiting') as { count: number | null }

          await (supabase.from('waitlist_entries') as any).insert({
            session_id: selectedSession.id,
            client_id: clientId,
            position: (count ?? 0) + 1,
          })
        }

        setStep('success')
        setBooking(false)
        return
      }

      // Book!
      const { error } = await (supabase.from('bookings') as any).insert({
        session_id: selectedSession.id,
        client_id: clientId,
        status: 'confirmed',
        booked_by: 'client',
      })

      if (error) {
        if (error.code === '23505') {
          setBookingError('כבר רשום לשיעור זה.')
        } else {
          throw error
        }
        setBooking(false)
        return
      }

      setMyBookingIds((prev) => new Set(Array.from(prev).concat(selectedSession.id)))
      setStep('success')
    } catch (err: any) {
      setBookingError(err.message ?? 'שגיאה בהזמנה')
    } finally {
      setBooking(false)
    }
  }

  if (step === 'success') {
    const confirmedCount = selectedSession?.bookings?.filter(
      (b: any) => ['confirmed', 'pending'].includes(b.status)
    ).length ?? 0
    const isFull = confirmedCount >= selectedSession?.capacity

    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isFull ? 'נוספת לרשימת המתנה!' : 'ההזמנה אושרה! 🎉'}
          </h1>
          <p className="text-gray-500 text-sm mb-1">
            {selectedSession?.session_types?.name_he}
          </p>
          <p className="text-gray-400 text-sm">
            {formatSessionDate(selectedSession?.starts_at)} · {formatTime(selectedSession?.starts_at)}
          </p>

          {isFull && (
            <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-orange-700">
              השיעור מלא. נוספת לרשימת ההמתנה. נודיע לך אם יתפנה מקום.
            </div>
          )}

          <div className="mt-8 space-y-3">
            <button
              onClick={() => { setStep('list'); setSelectedSession(null); loadData() }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              הזמן שיעור נוסף
            </button>
            <button
              onClick={() => router.push('/my-bookings')}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl"
            >
              ראה את ההזמנות שלי
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'confirm' && selectedSession) {
    const confirmedCount = selectedSession.bookings?.filter(
      (b: any) => ['confirmed', 'pending'].includes(b.status)
    ).length ?? 0
    const spotsLeft = selectedSession.capacity - confirmedCount
    const isFull = spotsLeft <= 0
    const st = selectedSession.session_types

    return (
      <div className="p-4 max-w-lg mx-auto">
        <button
          onClick={() => setStep('list')}
          className="flex items-center gap-1 text-sm text-gray-500 mb-4"
        >
          <ChevronRight className="w-4 h-4" />
          חזור
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-4">אישור הזמנה</h1>

        <Card className="mb-4">
          <div
            className="inline-flex items-center px-2 py-1 rounded-full text-white text-xs font-medium mb-2"
            style={{ backgroundColor: st?.color ?? '#3B82F6' }}
          >
            {st?.name_he}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatSessionDate(selectedSession.starts_at)}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(selectedSession.starts_at)} – {formatTime(selectedSession.ends_at)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {isFull ? 'מלא – רשימת המתנה' : `${spotsLeft} מקומות פנויים`}
            </span>
          </div>
          {selectedSession.locations && (
            <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-400">
              <MapPin className="w-3.5 h-3.5" />
              {selectedSession.locations.name}
            </div>
          )}
        </Card>

        {bookingError && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {bookingError}
          </div>
        )}

        <button
          onClick={confirmBooking}
          disabled={booking}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
        >
          {booking ? 'מזמין...' : isFull ? 'הצטרף לרשימת המתנה' : 'אשר הזמנה ✓'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          ניתן לבטל עד 4 שעות לפני תחילת השיעור
        </p>
      </div>
    )
  }

  // Session list
  const maxPerWeek = membership?.membership_plans?.sessions_per_week ?? 2

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">שיעורים פנויים</h1>
      <p className="text-sm text-gray-400 mb-4">14 ימים קרובים</p>

      {!membership && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <div className="text-sm font-medium text-orange-700">אין מנוי פעיל</div>
          <div className="text-xs text-orange-500 mt-0.5">
            לשיעורים קבוצתיים נדרש מנוי. שיעורים פרטיים זמינים תמיד.
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">😴</div>
          <div className="text-gray-400 text-sm">אין שיעורים זמינים כרגע</div>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const confirmedCount = session.bookings?.filter(
              (b: any) => ['confirmed', 'pending'].includes(b.status)
            ).length ?? 0
            const spotsLeft = session.capacity - confirmedCount
            const isFull = spotsLeft <= 0
            const isAlreadyBooked = myBookingIds.has(session.id)
            const isGroupSession = session.session_types?.type === 'group'
            const weeklyLimitReached = isGroupSession && weeklyGroupCount >= maxPerWeek
            const noMembership = isGroupSession && !membership
            const isDisabled = isAlreadyBooked || (noMembership && isGroupSession)

            return (
              <button
                key={session.id}
                onClick={() => {
                  if (isAlreadyBooked) return
                  setSelectedSession(session)
                  setBookingError('')
                  setStep('confirm')
                }}
                disabled={isDisabled}
                className={`w-full text-right ${isDisabled ? 'opacity-60' : ''}`}
              >
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-blue-200 transition-colors active:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: session.session_types?.color ?? '#3B82F6' }}
                        >
                          {session.session_types?.name_he}
                        </span>
                        {isAlreadyBooked && <Badge color="green">רשום ✓</Badge>}
                        {weeklyLimitReached && !isAlreadyBooked && (
                          <Badge color="orange">מכסה שבועית</Badge>
                        )}
                      </div>

                      <div className="mt-2 font-bold text-gray-900">
                        {formatSessionDate(session.starts_at)}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(session.starts_at)}
                        </span>
                        {session.locations && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {session.locations.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left mr-2 flex-shrink-0">
                      {isFull ? (
                        <Badge color="red">מלא</Badge>
                      ) : spotsLeft <= 2 ? (
                        <Badge color="orange">נשארו {spotsLeft}</Badge>
                      ) : (
                        <Badge color="green">{spotsLeft} פנויים</Badge>
                      )}
                      {session.session_types?.price > 0 && (
                        <div className="text-xs text-gray-400 mt-1 text-left">
                          {session.session_types.price}₪
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
