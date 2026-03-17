import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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

  const body = await request.json()
  const { session_id, client_id, booking_id, status, notes } = body

  if (!session_id || !client_id || !status) {
    return NextResponse.json({ error: 'session_id, client_id, and status required' }, { status: 400 })
  }

  const validStatuses = ['present', 'absent', 'canceled', 'no_show']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Upsert attendance record
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('session_id', session_id)
    .eq('client_id', client_id)
    .single()

  let data, error
  if (existing) {
    const res = await supabase
      .from('attendance')
      .update({ status, notes: notes ?? null, marked_by: user.id, marked_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    data = res.data
    error = res.error
  } else {
    const res = await supabase
      .from('attendance')
      .insert({
        session_id,
        client_id,
        booking_id: booking_id ?? null,
        status,
        marked_by: user.id,
        notes: notes ?? null,
      })
      .select()
      .single()
    data = res.data
    error = res.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  const clientId = searchParams.get('client_id')

  let query = supabase
    .from('attendance')
    .select('*, clients ( full_name ), sessions ( starts_at, session_types ( name_he ) )')
    .order('marked_at', { ascending: false })

  if (sessionId) query = query.eq('session_id', sessionId)
  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
