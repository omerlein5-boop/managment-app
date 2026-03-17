'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function AddBookingToSession({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function loadClients() {
    const { data } = await supabase
      .from('clients')
      .select('id, full_name, phone')
      .eq('is_active', true)
      .order('full_name')

    // Filter out already-booked clients
    const { data: existing } = await supabase
      .from('bookings')
      .select('client_id')
      .eq('session_id', sessionId)
      .in('status', ['confirmed', 'pending'])

    const existingIds = new Set(existing?.map((b: any) => b.client_id) ?? [])
    setClients((data ?? []).filter((c: any) => !existingIds.has(c.id)))
  }

  async function handleOpen() {
    setLoading(true)
    await loadClients()
    setLoading(false)
    setOpen(true)
  }

  async function addClient(clientId: string) {
    setSaving(clientId)
    try {
      const { error } = await (supabase.from('bookings') as any).insert({
        session_id: sessionId,
        client_id: clientId,
        status: 'confirmed',
        booked_by: 'admin',
      })
      if (error) throw error
      setClients((prev) => prev.filter((c) => c.id !== clientId))
      router.refresh()
    } catch (err) {
      alert('שגיאה בהוספת התלמיד')
    } finally {
      setSaving(null)
    }
  }

  const filtered = clients.filter((c) =>
    c.full_name.includes(search) || c.phone.includes(search)
  )

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <UserPlus className="w-4 h-4" />
        הוסף תלמיד
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="הוסף תלמיד לשיעור">
        <div className="space-y-3">
          <input
            type="text"
            placeholder="חפש תלמיד..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          />

          {loading ? (
            <div className="py-6 text-center text-gray-400 text-sm">טוען...</div>
          ) : filtered.length === 0 ? (
            <div className="py-6 text-center text-gray-400 text-sm">אין תלמידים להוסיף</div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filtered.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-sm">{client.full_name}</div>
                    <div className="text-xs text-gray-400">{client.phone}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addClient(client.id)}
                    disabled={saving === client.id}
                  >
                    {saving === client.id ? '...' : 'הוסף'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
