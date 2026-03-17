import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('payments')
    .select('*, clients ( full_name, phone )')
    .order('created_at', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

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
  const { client_id, amount, status: payStatus, payment_method, paid_at, description, notes, membership_id, booking_id } = body

  if (!client_id || !amount) {
    return NextResponse.json({ error: 'client_id and amount required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      client_id,
      amount: Number(amount),
      status: payStatus ?? 'unpaid',
      payment_method: payment_method ?? null,
      paid_at: paid_at ?? null,
      description: description ?? null,
      notes: notes ?? null,
      membership_id: membership_id ?? null,
      booking_id: booking_id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, status: payStatus, payment_method, paid_at } = body

  const { data, error } = await supabase
    .from('payments')
    .update({
      status: payStatus,
      payment_method,
      paid_at: paid_at ?? new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
