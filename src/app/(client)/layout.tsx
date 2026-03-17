import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/client/BottomNav'
import { APP_NAME } from '@/lib/constants'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-3.5 sticky top-0 z-30">
        <h1 className="text-base font-bold text-gray-900 text-center">{APP_NAME}</h1>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-24">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
