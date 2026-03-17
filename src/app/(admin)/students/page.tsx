import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { UserPlus, Search } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import AddStudentButton from '@/components/admin/AddStudentButton'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>
}) {
  const { q, filter } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('clients')
    .select(`
      *,
      client_memberships (
        id, status, starts_at, ends_at,
        membership_plans ( name_he, type )
      ),
      payments ( id, amount, status )
    `)
    .eq('is_active', true)
    .order('full_name')

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  const { data: clients } = await query

  const today = format(new Date(), 'yyyy-MM-dd')

  const enriched = (clients ?? []).map((c: any) => {
    const activeMembership = c.client_memberships?.find(
      (m: any) => m.status === 'active' && m.ends_at >= today
    )
    const unpaidTotal = c.payments
      ?.filter((p: any) => p.status === 'unpaid')
      .reduce((sum: number, p: any) => sum + p.amount, 0) ?? 0

    return { ...c, activeMembership, unpaidTotal }
  })

  const filtered = filter === 'unpaid'
    ? enriched.filter((c: any) => c.unpaidTotal > 0)
    : filter === 'no_membership'
    ? enriched.filter((c: any) => !c.activeMembership)
    : enriched

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">תלמידים</h1>
        <AddStudentButton />
      </div>

      {/* Search + Filters */}
      <div className="mb-4 space-y-2">
        <form className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="חיפוש לפי שם או טלפון..."
            className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white"
          />
        </form>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {[
            { label: 'הכל', value: undefined },
            { label: 'חוב פתוח', value: 'unpaid' },
            { label: 'ללא מנוי', value: 'no_membership' },
          ].map((f) => (
            <Link
              key={f.label}
              href={f.value ? `?filter=${f.value}` : '/students'}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value || (!filter && !f.value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Student count */}
      <p className="text-sm text-gray-400 mb-3">{filtered.length} תלמידים</p>

      {/* Student list */}
      <div className="space-y-2">
        {filtered.map((client: any) => (
          <Link key={client.id} href={`/students/${client.id}`}>
            <Card className="hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{client.full_name}</span>
                    {client.activeMembership ? (
                      <Badge color="green">מנוי פעיל</Badge>
                    ) : (
                      <Badge color="gray">ללא מנוי</Badge>
                    )}
                    {client.unpaidTotal > 0 && (
                      <Badge color="red">חוב {client.unpaidTotal}₪</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 mt-0.5">{client.phone}</div>
                  {client.activeMembership && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {client.activeMembership.membership_plans?.name_he} · עד{' '}
                      {format(new Date(client.activeMembership.ends_at), 'dd.MM.yyyy')}
                    </div>
                  )}
                </div>
                <div className="text-gray-300 text-lg">›</div>
              </div>
            </Card>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <div>לא נמצאו תלמידים</div>
          </div>
        )}
      </div>
    </div>
  )
}
