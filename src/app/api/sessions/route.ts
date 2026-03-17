import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { addDays, format } from 'date-fns'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const from = searchParams.get('from') ?? new Date().toISOString()
  const to = searchParams.get('to') ?? addDays(new Date(), 14).toISOString()

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_types ( name_he, type, price, color, duration_minutes ),
      locations ( name, address ),
      bookings ( id, client_id, status )
    `)
    .gte('starts_at', from)
    .lte('starts_at', to)
    .neq('status', 'canceled')
    .order('starts_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const enriched = (data ?? []).map((session: any) => ({
    ...session,
    booking_count: session.bookings?.filter(
      (b: any) => ['confirmed', 'pending'].includes(b.status)
    ).length ?? 0,
  }))

  return NextResponse.json(enriched)
}

export async function POST(request: Request) {
  const supabase = await createClient()

  // Admin only
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

  const body = await request.json()
  const {
    session_type_id,
    location_id,
    starts_at,
    ends_at,
    capacity,
    notes,
    recurring_weeks,
  } = body

  if (!session_type_id || !starts_at || !ends_at || !capacity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const sessionsToCreate = recurring_weeks > 1
    ? Array.from({ length: recurring_weeks }, (_, i) => {
        const s = new Date(starts_at)
        s.setDate(s.getDate() + i * 7)
        const e = new Date(ends_at)
        e.setDate(e.getDate() + i * 7)
        return {
          session_type_id,
          location_id: location_id || null,
          coach_id: user.id,
          starts_at: s.toISOString(),
          ends_at: e.toISOString(),
          capacity: Number(capacity),
          notes: notes || null,
          recurring_group_id: crypto.randomUUID(),
        }
      })
    : [{
        session_type_id,
        location_id: location_id || null,
        coach_id: user.id,
        starts_at,
        ends_at,
        capacity: Number(capacity),
        notes: notes || null,
      }]

  const { data, error } = await supabase.from('sessions').insert(sessionsToCreate).select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
