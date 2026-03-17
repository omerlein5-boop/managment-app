import { redirect } from 'next/navigation'

// The client root just redirects to /home
export default function ClientRoot() {
  redirect('/home')
}
