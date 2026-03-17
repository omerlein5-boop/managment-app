'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatShortDate, formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { LogOut, Phone, Mail, Target, AlertTriangle, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { APP_NAME } from '@/lib/constants'

export default function ProfilePage() {
  const [client, setClient] = useState<any>(null)
  const [membership, setMembership] = useState<any>(null)
  const [unpaidPayments, setUnpaidPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [clientRes] = await Promise.all([
      supabase
        .from('clients')
        .select('*')
        .eq('profile_id', user.id)
        .single(),
    ])

    const c = clientRes.data
    setClient(c)

    if (c) {
      const today = format(new Date(), 'yyyy-MM-dd')
      const [memRes, payRes] = await Promise.all([
        supabase
          .from('client_memberships')
          .select('*, membership_plans ( name_he, sessions_per_week, validity_days )')
          .eq('client_id', c.id)
          .eq('status', 'active')
          .lte('starts_at', today)
          .gte('ends_at', today)
          .single(),
        supabase
          .from('payments')
          .select('*')
          .eq('client_id', c.id)
          .eq('status', 'unpaid'),
      ])
      setMembership(memRes.data)
      setUnpaidPayments(payRes.data ?? [])
    }

    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  const totalUnpaid = unpaidPayments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Profile header */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-blue-600">
              {client?.full_name?.[0] ?? '?'}
            </span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{client?.full_name ?? 'תלמיד'}</h2>
            <div className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
              <Phone className="w-3.5 h-3.5" />
              <span dir="ltr">{client?.phone ?? '—'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Membership */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-gray-50">
          <h3 className="font-bold text-gray-900">מנוי</h3>
        </div>
        <div className="px-4 py-4">
          {membership ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {membership.membership_plans?.name_he}
                </span>
                <Badge color="green">פעיל</Badge>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                תוקף: {formatShortDate(membership.starts_at)} – {formatShortDate(membership.ends_at)}
              </div>
              {membership.membership_plans?.sessions_per_week && (
                <div className="text-sm text-gray-400 mt-0.5">
                  עד {membership.membership_plans.sessions_per_week} שיעורים קבוצתיים בשבוע
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">אין מנוי פעיל</span>
                <Badge color="gray">לא פעיל</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                פנה למאמן לרכישת מנוי
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Unpaid balance */}
      {totalUnpaid > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <div className="flex items-start gap-2">
            <CreditCard className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-orange-700">יתרה לתשלום: {formatCurrency(totalUnpaid)}</div>
              <div className="text-xs text-orange-500 mt-0.5">
                {unpaidPayments.map((p) => p.description).filter(Boolean).join(' · ')}
              </div>
              <p className="text-xs text-orange-500 mt-1">
                אנא צור קשר עם המאמן לסדר את התשלום
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Goals & injuries */}
      {(client?.goals || client?.injuries) && (
        <Card>
          {client.goals && (
            <div className="flex gap-2 mb-3">
              <Target className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-500 mb-0.5">המטרות שלי</div>
                <div className="text-sm text-gray-700">{client.goals}</div>
              </div>
            </div>
          )}
          {client.injuries && (
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-500 mb-0.5">פציעות / מגבלות</div>
                <div className="text-sm text-orange-700">{client.injuries}</div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-xl transition-colors"
      >
        <LogOut className="w-4 h-4" />
        יציאה מהמערכת
      </button>

      <p className="text-center text-xs text-gray-300">{APP_NAME}</p>
    </div>
  )
}
