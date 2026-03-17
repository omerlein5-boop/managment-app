// Root page: middleware redirects admins to /dashboard, clients hit /home
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/home')
}
