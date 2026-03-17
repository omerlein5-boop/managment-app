import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { startOfWeek, addDays } from 'date-fns'
import { CANCELLATION_WINDOW_HOURS, MAX_WEEKLY_GROUP_SESSIONS } from '@/lib/constants'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const sessionId = searchParams.get('session_id')

  let query = supabase
    .from('bookings')
    .select(`
      *,
      sessions ( starts_at, ends_at, session_types ( name_he, type ) ),
      clients ( full_name, phone )
    `)
    .order('created_at', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)
  if (sessionId) query = query.eq('session_id', sessionId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { session_id, client_id } = body

  if (!session_id || !client_id) {
    return NextResponse.json({ error: 'session_id and client_id required' }, { status: 400 })
  }

  // Get session details
  const { data: session } = await supabase
    .from('sessions')
    .select('*, session_types ( type ), bookings ( id, client_id, status )')
    .eq('id', session_id)
    .single() as { data: any | null }

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.status === 'canceled') {
    return NextResponse.json({ error: 'Session is canceled' }, { status: 400 })
  }

  const confirmedCount = session.bookings?.filter(
    (b: any) => ['confirmed', 'pending'].includes(b.status)
  ).length ?? 0

  // Check capacity
  if (confirmedCount >= session.capacity) {
    // Add to waitlist
    const { count } = await supabase
      .from('waitlist_entries')
      .select('id', { count: 'exact' })
      .eq('session_id', session_id)
      .eq('status', 'waiting') as { count: number | null }

    const { data: waitlistEntry, error: wErr } = await (supabase
      .from('waitlist_entries') as any)
      .insert({ session_id, client_id, position: (count ?? 0) + 1 })
      .select()
      .single()

    if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 })
    return NextResponse.json({ waitlisted: true, entry: waitlistEntry }, { status: 201 })
  }

  // For group sessions, check membership and weekly limit
  if (session.session_types?.type === 'group') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: any | null }

    // Skip checks for admins
    if (profile?.role === 'client') {
      // Get client record
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', user.id)
        .single() as { data: any | null }

      if (client) {
        const today = new Date().toISOString().split('T')[0]

        // Check active membership
        const { data: mem } = await supabase
          .from('client_memberships')
          .select('id, membership_plans ( sessions_per_week )')
          .eq('client_id', client.id)
          .eq('status', 'active')
          .lte('starts_at', today)
          .gte('ends_at', today)
          .single() as { data: any | null }

        if (!mem) {
          return NextResponse.json(
            { error: 'Active membership required for group sessions' },
            { status: 403 }
          )
        }

        // Check weekly limit
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
        const weekEnd = addDays(weekStart, 7)
        const { count } = await supabase
          .from('bookings')
          .select('id, sessions!inner ( session_types!inner ( type ) )', { count: 'exact' })
          .eq('client_id', client.id)
          .eq('status', 'confirmed')
          .eq('sessions.session_types.type', 'group')
          .gte('sessions.starts_at', weekStart.toISOString())
          .lt('sessions.starts_at', weekEnd.toISOString())

        const maxPerWeek = (mem as any).membership_plans?.sessions_per_week ?? MAX_WEEKLY_GROUP_SESSIONS
        if ((count ?? 0) >= maxPerWeek) {
          return NextResponse.json(
            { error: `Weekly group session limit reached (${maxPerWeek}/week)` },
            { status: 403 }
          )
        }
      }
    }
  }

  // Create booking
  const { data, error } = await (supabase
    .from('bookings') as any)
    .insert({
      session_id,
      client_id,
      status: 'confirmed',
      booked_by: 'client',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already booked' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
