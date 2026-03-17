export const APP_NAME = process.env.NEXT_PUBLIC_GYM_NAME ?? 'בוקסינג קואצ׳'
export const COACH_NAME = process.env.NEXT_PUBLIC_COACH_NAME ?? 'המאמן'

export const MONTHLY_MEMBERSHIP_PRICE = 400
export const PRIVATE_LESSON_PRICE = 250
export const MAX_WEEKLY_GROUP_SESSIONS = 2
export const CANCELLATION_WINDOW_HOURS = Number(
  process.env.NEXT_PUBLIC_CANCELLATION_WINDOW_HOURS ?? 4
)

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'מזומן' },
  { value: 'transfer', label: 'העברה בנקאית' },
  { value: 'bit', label: 'ביט' },
  { value: 'credit_card', label: 'כרטיס אשראי' },
  { value: 'other', label: 'אחר' },
] as const

export const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

export const SESSION_TYPE_COLORS = {
  group: '#3B82F6',    // blue
  private: '#8B5CF6',  // purple
  trial: '#10B981',    // green
  drop_in: '#F59E0B',  // amber
} as const

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  confirmed: 'מאושר',
  pending: 'ממתין',
  canceled: 'בוטל',
  no_show: 'לא הגיע',
  waitlisted: 'המתנה',
}

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: 'נוכח',
  absent: 'נעדר',
  canceled: 'ביטל',
  no_show: 'לא הגיע',
}

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'לוח בקרה', icon: 'LayoutDashboard' },
  { href: '/schedule', label: 'מערכת שעות', icon: 'Calendar' },
  { href: '/students', label: 'תלמידים', icon: 'Users' },
  { href: '/bookings', label: 'הזמנות', icon: 'ClipboardList' },
  { href: '/attendance', label: 'נוכחות', icon: 'CheckSquare' },
  { href: '/payments', label: 'תשלומים', icon: 'CreditCard' },
  { href: '/reports', label: 'דוחות', icon: 'BarChart2' },
] as const

export const CLIENT_NAV_ITEMS = [
  { href: '/', label: 'בית', icon: 'Home' },
  { href: '/book', label: 'הזמן', icon: 'Plus' },
  { href: '/my-bookings', label: 'ההזמנות שלי', icon: 'Calendar' },
  { href: '/profile', label: 'פרופיל', icon: 'User' },
] as const
