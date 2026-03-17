import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CANCELLATION_WINDOW_HOURS } from '@/lib/constants'
import { parseISO } from 'date-fns'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { status, cancellation_reason } = body

  // Get booking and session
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, sessions ( starts_at )')
    .eq('id', id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // Client can only cancel, and only within the window
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'client' && status === 'canceled') {
    const sessionStart = parseISO(booking.sessions?.starts_at)
    const hoursUntil = (sessionStart.getTime() - Date.now()) / (1000 * 60 * 60)

    if (hoursUntil < CANCELLATION_WINDOW_HOURS) {
      return NextResponse.json(
        { error: `Cannot cancel less than ${CANCELLATION_WINDOW_HOURS} hours before session` },
        { status: 400 }
      )
    }
  }

  const update: Record<string, any> = { status }
  if (status === 'canceled') {
    update.canceled_at = new Date().toISOString()
    update.cancellation_reason = cancellation_reason ?? null
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If canceled, promote first person on waitlist
  if (status === 'canceled') {
    const { data: waitlisted } = await supabase
      .from('waitlist_entries')
      .select('*')
      .eq('session_id', booking.session_id)
      .eq('status', 'waiting')
      .order('position')
      .limit(1)

    if (waitlisted && waitlisted.length > 0) {
      const first = waitlisted[0]
      await supabase.from('bookings').insert({
        session_id: booking.session_id,
        client_id: first.client_id,
        status: 'confirmed',
        booked_by: 'admin',
      })
      await supabase
        .from('waitlist_entries')
        .update({ status: 'promoted' })
        .eq('id', first.id)
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'coach'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
