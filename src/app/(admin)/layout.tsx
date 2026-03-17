import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/admin/Sidebar'
import MobileNav from '@/components/admin/MobileNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex min-h-dvh bg-gray-50">
      <Sidebar />

      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        {children}
      </main>

      <MobileNav />
    </div>
  )
}
