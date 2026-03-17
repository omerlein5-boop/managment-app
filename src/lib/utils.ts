import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatRelative, isToday, isTomorrow, parseISO, startOfWeek } from 'date-fns'
import { he } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date in Hebrew-friendly style: יום א׳ 17.03 | 18:00
export function formatSessionDate(dateStr: string): string {
  const date = parseISO(dateStr)
  return format(date, 'EEEE, d בMMMM', { locale: he })
}

export function formatTime(dateStr: string): string {
  const date = parseISO(dateStr)
  return format(date, 'HH:mm')
}

export function formatShortDate(dateStr: string): string {
  const date = parseISO(dateStr)
  return format(date, 'dd.MM.yyyy')
}

export function formatDateHe(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'היום'
  if (isTomorrow(date)) return 'מחר'
  return format(date, 'EEEE, d בMMMM', { locale: he })
}

export function formatMonthYear(dateStr: string): string {
  const date = parseISO(dateStr)
  return format(date, 'MMMM yyyy', { locale: he })
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('he-IL')}₪`
}

export function getWeekStart(date: Date = new Date()): Date {
  // Israeli week starts on Sunday
  return startOfWeek(date, { weekStartsOn: 0 })
}

export function getSessionStatus(session: {
  starts_at: string
  status: string
  capacity: number
  booking_count?: number
}): { label: string; color: string } {
  if (session.status === 'canceled') return { label: 'בוטל', color: 'red' }
  if (session.status === 'completed') return { label: 'הסתיים', color: 'gray' }

  const now = new Date()
  const start = parseISO(session.starts_at)

  if (start < now) return { label: 'הסתיים', color: 'gray' }

  const booked = session.booking_count ?? 0
  const spotsLeft = session.capacity - booked

  if (spotsLeft === 0) return { label: 'מלא', color: 'red' }
  if (spotsLeft <= 2) return { label: `נשארו ${spotsLeft} מקומות`, color: 'orange' }
  return { label: `${spotsLeft} מקומות פנויים`, color: 'green' }
}

export function getMembershipStatusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case 'active': return { label: 'פעיל', color: 'green' }
    case 'expired': return { label: 'פג תוקף', color: 'red' }
    case 'suspended': return { label: 'מושהה', color: 'orange' }
    case 'canceled': return { label: 'בוטל', color: 'gray' }
    default: return { label: status, color: 'gray' }
  }
}

export function getPaymentMethodLabel(method: string | null): string {
  switch (method) {
    case 'cash': return 'מזומן'
    case 'transfer': return 'העברה בנקאית'
    case 'bit': return 'ביט'
    case 'credit_card': return 'כרטיס אשראי'
    case 'other': return 'אחר'
    default: return '-'
  }
}

export function getBookingStatusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case 'confirmed': return { label: 'מאושר', color: 'green' }
    case 'pending': return { label: 'ממתין', color: 'yellow' }
    case 'canceled': return { label: 'בוטל', color: 'gray' }
    case 'no_show': return { label: 'לא הגיע', color: 'red' }
    case 'waitlisted': return { label: 'רשימת המתנה', color: 'blue' }
    default: return { label: status, color: 'gray' }
  }
}

export function getAttendanceStatusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case 'present': return { label: 'נוכח', color: 'green' }
    case 'absent': return { label: 'נעדר', color: 'red' }
    case 'canceled': return { label: 'ביטל', color: 'gray' }
    case 'no_show': return { label: 'לא הגיע', color: 'orange' }
    default: return { label: status, color: 'gray' }
  }
}

export function getDayName(dateStr: string): string {
  const date = parseISO(dateStr)
  return format(date, 'EEEE', { locale: he })
}

export function isCancellable(startsAt: string, windowHours = 4): boolean {
  const now = new Date()
  const start = parseISO(startsAt)
  const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60)
  return diffHours >= windowHours
}
