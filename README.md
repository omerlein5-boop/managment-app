# 🥊 Boxing Coach App

מערכת ניהול שיעורי בוקסינג / כושר — Hebrew-first, mobile-first, RTL.

Built for real coaches who want students to book through the app instead of WhatsApp.

---

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Supabase** (Auth + PostgreSQL + RLS)
- **Tailwind CSS** (RTL-aware)
- **Vercel** (deployment target)

---

## Quick Setup

### 1. Clone & install

```bash
git clone <your-repo>
cd boxing-coach
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your `Project URL` and `Anon Key` from **Settings → API**

### 3. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_COACH_NAME=שם המאמן
NEXT_PUBLIC_GYM_NAME=הסטודיו שלי
```

### 4. Run database migrations

In your Supabase **SQL Editor**, run these files **in order**:

```
1. supabase/schema.sql   ← Creates all tables, indexes, functions
2. supabase/policies.sql ← Row Level Security policies
3. supabase/seed.sql     ← Sample data (10 students, sessions, payments)
```

### 5. Create admin user

1. In Supabase → **Authentication → Users** → **Invite user**
2. Enter your email → Invite
3. After signup, run in SQL Editor:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = '<your-user-id>';
   ```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add the same environment variables in Vercel Dashboard → Settings → Environment Variables.

Configure Supabase Auth redirect URLs:
- **Supabase → Authentication → URL Configuration**
- Add `https://your-app.vercel.app/auth/callback` to **Redirect URLs**

---

## Architecture

```
src/
├── app/
│   ├── (auth)/login/          # Magic link login
│   ├── auth/callback/         # Auth callback handler
│   ├── (admin)/               # Admin-only routes
│   │   ├── dashboard/         # Stats, today's sessions, unpaid
│   │   ├── schedule/          # Week view calendar
│   │   ├── students/          # Student list + detail
│   │   ├── bookings/          # All bookings by session
│   │   ├── attendance/        # Attendance history
│   │   ├── payments/          # Payment tracking
│   │   └── reports/           # Revenue, attendance rate
│   ├── (client)/              # Student-facing routes
│   │   ├── home/              # Dashboard with upcoming bookings
│   │   ├── book/              # Session booking flow
│   │   ├── my-bookings/       # Booking history + cancel
│   │   └── profile/           # Profile, membership, balance
│   └── api/                   # REST API routes
├── components/
│   ├── ui/                    # Button, Card, Badge, Modal, Input
│   ├── admin/                 # Admin-specific components
│   ├── client/                # Client-facing components
│   └── shared/                # Shared utilities
├── lib/
│   ├── supabase/              # Client and server Supabase clients
│   ├── utils.ts               # Date formatting, label helpers
│   └── constants.ts           # Prices, limits, labels
├── types/
│   └── database.ts            # Full TypeScript types from schema
└── middleware.ts              # Auth + role-based routing
```

---

## Business Logic

### Booking Rules

| Rule | Implementation |
|------|----------------|
| Group sessions require active membership | Checked in `book/page.tsx` + API |
| Max 2 group sessions/week | Checked against weekly booking count |
| Capacity limit → waitlist | Auto-waitlist when session full |
| Waitlist promotion on cancel | Triggered in `PATCH /api/bookings/[id]` |
| Cancellation window (4h) | Enforced client-side + API |

### Pricing

| Service | Price |
|---------|-------|
| מנוי חודשי קבוצתי | 400₪/month, 2x/week |
| שיעור פרטי | 250₪/session |

---

## V1 Feature Checklist

### Admin
- [x] Dashboard: today's sessions, active members, unpaid, revenue
- [x] Schedule: weekly view with session cards
- [x] Create single or recurring sessions (4, 8, 12+ weeks)
- [x] Student list with search and filters
- [x] Student detail: info, membership, bookings, attendance, payments
- [x] Add student, edit student
- [x] Add membership to student
- [x] Record payment (paid/unpaid, method, date)
- [x] Mark payment as paid inline
- [x] Session detail: attendee list, attendance marking (present/no-show/absent)
- [x] Add student to session manually
- [x] Bookings page: grouped by session, filterable
- [x] Attendance page: 30-day history with attendance rate
- [x] Reports: monthly revenue, vs last month, fill rate, active members

### Client
- [x] Magic link login (no password)
- [x] Home: greeting, membership status, weekly usage, upcoming bookings
- [x] Book: 14-day session list, live spot counts, group/private
- [x] Booking confirmation flow (3 taps max)
- [x] Waitlist joining when full
- [x] My Bookings: upcoming + history, cancel button
- [x] Cancellation enforcement (4-hour window)
- [x] Profile: name, phone, membership status, unpaid balance, goals

---

## Future Features (V2+)

- [ ] Push notifications (session reminders, booking confirmation)
- [ ] WhatsApp Business API integration for reminders
- [ ] Online payment (Stripe / Cardcom / Bit API)
- [ ] Student self-registration with invite link
- [ ] Multiple coaches / locations
- [ ] Drop-in / trial session booking flow
- [ ] Session pack (punch card) tracking
- [ ] Recurring membership auto-renewal reminders
- [ ] Export: PDF reports, Excel student list
- [ ] Coach availability / vacation blocking
- [ ] Admin mobile app (PWA installable)
- [ ] Multi-language (English alongside Hebrew)
- [ ] Email/SMS reminders 24h before session
- [ ] Student progress photos / measurements
- [ ] Class scheduling templates

---

## Notes for Real Usage

**Creating students:**
Admin adds students manually in the Students section. To give a student app access:
1. Supabase → Auth → Invite user (their email)
2. Link their auth account to their client record via `profile_id`

**Payments are manual in V1:**
- Admin records what was paid, when, and how
- System tracks outstanding balance
- No online payment processing in V1

**Auth:**
- Magic link (passwordless) for both admin and clients
- Admin role must be set manually in Supabase after first login
- Middleware enforces role-based routing

---

## Development

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run lint    # Lint check
```

---

## License

Private — for use by the coach who commissioned this system.
