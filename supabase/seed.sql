-- ============================================================
-- Seed Data for Boxing Coach App
-- ============================================================
-- IMPORTANT: Run schema.sql and policies.sql first.
-- This seed uses service_role or is run via Supabase dashboard.
-- Replace UUIDs as needed if re-seeding.

-- ============================================================
-- LOCATIONS
-- ============================================================
INSERT INTO locations (id, name, address) VALUES
  ('11111111-0000-0000-0000-000000000001', 'סטודיו בוקסינג מרכזי', 'רחוב הרצל 42, תל אביב'),
  ('11111111-0000-0000-0000-000000000002', 'מכון כושר פארק', 'שדרות רוטשילד 15, תל אביב');

-- ============================================================
-- SESSION TYPES
-- ============================================================
INSERT INTO session_types (id, name, name_he, type, price, duration_minutes, max_capacity, color, description) VALUES
  (
    '22222222-0000-0000-0000-000000000001',
    'Group Boxing',
    'בוקסינג קבוצתי',
    'group',
    0,  -- included in monthly membership
    60,
    12,
    '#3B82F6',
    'שיעור בוקסינג קבוצתי - כולל אגרוף, כושר וטכניקה'
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    'Private Lesson',
    'שיעור פרטי',
    'private',
    250,
    60,
    1,
    '#8B5CF6',
    'שיעור פרטי אחד על אחד עם המאמן'
  ),
  (
    '22222222-0000-0000-0000-000000000003',
    'Trial Session',
    'שיעור ניסיון',
    'trial',
    80,
    60,
    12,
    '#10B981',
    'שיעור ניסיון לתלמידים חדשים'
  );

-- ============================================================
-- MEMBERSHIP PLANS
-- ============================================================
INSERT INTO membership_plans (id, name, name_he, type, price, sessions_per_week, validity_days, description) VALUES
  (
    '33333333-0000-0000-0000-000000000001',
    'Monthly Group Membership',
    'מנוי חודשי קבוצתי',
    'monthly_group',
    400,
    2,
    30,
    'מנוי חודשי הכולל עד 2 שיעורים קבוצתיים בשבוע'
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    'Private Lesson Pack - 4',
    'חבילת שיעורים פרטיים - 4',
    'session_pack',
    900,
    NULL,
    60,
    'חבילה של 4 שיעורים פרטיים (חיסכון של 100₪)'
  );

-- ============================================================
-- AUTH USERS (for demo - created via Supabase Auth API in practice)
-- These are placeholder UUIDs - in real setup, create users via Supabase Auth
-- then update profiles with correct UUIDs
-- ============================================================

-- NOTE: In production, auth users are created via Supabase Auth.
-- Here we create profiles directly with known UUIDs for seeding.
-- When setting up for real, create auth users first, then run the client inserts below.

-- For demo purposes, insert profiles directly (bypassing auth trigger):
-- Admin profile (you need to create this auth user first)
INSERT INTO profiles (id, role, full_name, phone) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'admin', 'יוסי המאמן', '050-1234567');

-- Client profiles (linked auth users)
INSERT INTO profiles (id, role, full_name, phone) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'client', 'יונתן לוי', '052-1111111'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'client', 'אבי כהן', '052-2222222'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'client', 'שירה ברוך', '052-3333333'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'client', 'מאיה גולן', '052-4444444'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'client', 'ניר שמעוני', '052-5555555'),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'client', 'הילה אברהם', '052-6666666'),
  ('bbbbbbbb-0000-0000-0000-000000000007', 'client', 'רן בן-דוד', '052-7777777'),
  ('bbbbbbbb-0000-0000-0000-000000000008', 'client', 'דור לוי', '052-8888888'),
  ('bbbbbbbb-0000-0000-0000-000000000009', 'client', 'נועה דוד', '052-9999999'),
  ('bbbbbbbb-0000-0000-0000-000000000010', 'client', 'עומר כץ', '052-0000001');

-- ============================================================
-- CLIENTS
-- ============================================================
INSERT INTO clients (id, profile_id, full_name, phone, email, goals, injuries, notes) VALUES
  (
    'cccccccc-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'יונתן לוי', '052-1111111', 'yonatan@example.com',
    'ירידה במשקל ושיפור כושר כללי',
    NULL,
    'תלמיד ותיק, כישרון טבעי לבוקסינג'
  ),
  (
    'cccccccc-0000-0000-0000-000000000002',
    'bbbbbbbb-0000-0000-0000-000000000002',
    'אבי כהן', '052-2222222', 'avi@example.com',
    'הכנה לתחרות חובבים',
    NULL,
    'רוצה להתחרות בעוד 6 חודשים'
  ),
  (
    'cccccccc-0000-0000-0000-000000000003',
    'bbbbbbbb-0000-0000-0000-000000000003',
    'שירה ברוך', '052-3333333', 'shira@example.com',
    'כושר וביטחון עצמי',
    'כאבי גב תחתון קלים - להימנע מהגבהות כבדות',
    'מתחילה - צריכה יחס אישי'
  ),
  (
    'cccccccc-0000-0000-0000-000000000004',
    'bbbbbbbb-0000-0000-0000-000000000004',
    'מאיה גולן', '052-4444444', 'maya@example.com',
    'שיפור טכניקה',
    NULL,
    'רקע בקאיקיו - עוברת לבוקסינג'
  ),
  (
    'cccccccc-0000-0000-0000-000000000005',
    'bbbbbbbb-0000-0000-0000-000000000005',
    'ניר שמעוני', '052-5555555', 'nir@example.com',
    'כושר כללי',
    'ברך ימין - לשים לב בתרגילי רגליים',
    'המנוי שלו פג - צריך התחדשות'
  ),
  (
    'cccccccc-0000-0000-0000-000000000006',
    'bbbbbbbb-0000-0000-0000-000000000006',
    'הילה אברהם', '052-6666666', 'hila@example.com',
    'ירידה במשקל וחיזוק',
    NULL,
    'מגיעה באופן סדיר - מסורה מאוד'
  ),
  (
    'cccccccc-0000-0000-0000-000000000007',
    'bbbbbbbb-0000-0000-0000-000000000007',
    'רן בן-דוד', '052-7777777', 'ran@example.com',
    'שיעורים פרטיים לשיפור טכניקה',
    NULL,
    'מעדיף שיעורים פרטיים'
  ),
  (
    'cccccccc-0000-0000-0000-000000000008',
    'bbbbbbbb-0000-0000-0000-000000000008',
    'דור לוי', '052-8888888', 'dor@example.com',
    'כושר ובריאות',
    'אסטמה - יש אינהלטור',
    'להכיר שיש לו אסטמה'
  ),
  (
    'cccccccc-0000-0000-0000-000000000009',
    'bbbbbbbb-0000-0000-0000-000000000009',
    'נועה דוד', '052-9999999', 'noa@example.com',
    'עצמאות ואסרטיביות',
    NULL,
    'תלמידה חדשה יחסית - 2 חודשים'
  ),
  (
    'cccccccc-0000-0000-0000-000000000010',
    'bbbbbbbb-0000-0000-0000-000000000010',
    'עומר כץ', '052-0000001', 'omer@example.com',
    'כושר כללי',
    NULL,
    'חייב תשלום - לתזכר'
  );

-- ============================================================
-- SESSIONS - Next 4 weeks of group sessions (Sun, Tue, Thu at 18:00)
-- Using relative dates from today for realistic seed data
-- ============================================================

-- Week 1 - Group Sessions
INSERT INTO sessions (id, session_type_id, location_id, coach_id, starts_at, ends_at, capacity, status, recurring_group_id) VALUES
  (
    'dddddddd-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    (date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem') + INTERVAL '0 days 18 hours') AT TIME ZONE 'Asia/Jerusalem',
    (date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem') + INTERVAL '0 days 19 hours') AT TIME ZONE 'Asia/Jerusalem',
    12, 'scheduled', 'eeeeeeee-0000-0000-0000-000000000001'
  ),
  (
    'dddddddd-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    (date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem') + INTERVAL '2 days 18 hours') AT TIME ZONE 'Asia/Jerusalem',
    (date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem') + INTERVAL '2 days 19 hours') AT TIME ZONE 'Asia/Jerusalem',
    12, 'scheduled', 'eeeeeeee-0000-0000-0000-000000000002'
  ),
  (
    'dddddddd-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    (date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem') + INTERVAL '4 days 18 hours') AT TIME ZONE 'Asia/Jerusalem',
    (date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem') + INTERVAL '4 days 19 hours') AT TIME ZONE 'Asia/Jerusalem',
    12, 'scheduled', 'eeeeeeee-0000-0000-0000-000000000003'
  ),
  -- Week 2
  (
    'dddddddd-0000-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    (date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem') + INTERVAL '7 days 18 hours') AT TIME ZONE 'Asia/Jerusalem',
    (date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem') + INTERVAL '7 days 19 hours') AT TIME ZONE 'Asia/Jerusalem',
    12, 'scheduled', 'eeeeeeee-0000-0000-0000-000000000001'
  ),
  (
    'dddddddd-0000-0000-0000-000000000005',
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    (date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem') + INTERVAL '9 days 18 hours') AT TIME ZONE 'Asia/Jerusalem',
    (date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem') + INTERVAL '9 days 19 hours') AT TIME ZONE 'Asia/Jerusalem',
    12, 'scheduled', 'eeeeeeee-0000-0000-0000-000000000002'
  ),
  (
    'dddddddd-0000-0000-0000-000000000006',
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    (date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem') + INTERVAL '11 days 18 hours') AT TIME ZONE 'Asia/Jerusalem',
    (date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem') + INTERVAL '11 days 19 hours') AT TIME ZONE 'Asia/Jerusalem',
    12, 'scheduled', 'eeeeeeee-0000-0000-0000-000000000003'
  ),
  -- Private lessons
  (
    'dddddddd-0000-0000-0000-000000000007',
    '22222222-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    (CURRENT_DATE + INTERVAL '1 day 16 hours') AT TIME ZONE 'Asia/Jerusalem',
    (CURRENT_DATE + INTERVAL '1 day 17 hours') AT TIME ZONE 'Asia/Jerusalem',
    1, 'scheduled', NULL
  ),
  (
    'dddddddd-0000-0000-0000-000000000008',
    '22222222-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    (CURRENT_DATE + INTERVAL '3 days 17 hours') AT TIME ZONE 'Asia/Jerusalem',
    (CURRENT_DATE + INTERVAL '3 days 18 hours') AT TIME ZONE 'Asia/Jerusalem',
    1, 'scheduled', NULL
  );

-- ============================================================
-- BOOKINGS (realistic mix for current week sessions)
-- ============================================================
INSERT INTO bookings (session_id, client_id, status, booked_by) VALUES
  -- Sunday group session (session 1) - 7 students booked
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'confirmed', 'client'),
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002', 'confirmed', 'client'),
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000004', 'confirmed', 'client'),
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000006', 'confirmed', 'client'),
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000008', 'confirmed', 'client'),
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000009', 'confirmed', 'client'),
  -- Tuesday group session (session 2) - 5 booked
  ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001', 'confirmed', 'client'),
  ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000002', 'confirmed', 'client'),
  ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000006', 'confirmed', 'client'),
  ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000009', 'confirmed', 'client'),
  -- Thursday group (session 3) - 4 booked
  ('dddddddd-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000002', 'confirmed', 'client'),
  ('dddddddd-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000004', 'confirmed', 'client'),
  ('dddddddd-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000008', 'confirmed', 'client'),
  -- Private lessons
  ('dddddddd-0000-0000-0000-000000000007', 'cccccccc-0000-0000-0000-000000000007', 'confirmed', 'client'),
  ('dddddddd-0000-0000-0000-000000000008', 'cccccccc-0000-0000-0000-000000000003', 'confirmed', 'client');

-- ============================================================
-- CLIENT MEMBERSHIPS
-- ============================================================
INSERT INTO client_memberships (id, client_id, plan_id, starts_at, ends_at, status, price_paid) VALUES
  -- Active monthly memberships
  (
    'ffffffff-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '15 days',
    'active', 400
  ),
  (
    'ffffffff-0000-0000-0000-000000000002',
    'cccccccc-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '20 days',
    'active', 400
  ),
  (
    'ffffffff-0000-0000-0000-000000000003',
    'cccccccc-0000-0000-0000-000000000004',
    '33333333-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '25 days',
    'active', 400
  ),
  (
    'ffffffff-0000-0000-0000-000000000004',
    'cccccccc-0000-0000-0000-000000000006',
    '33333333-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE + INTERVAL '10 days',
    'active', 400
  ),
  (
    'ffffffff-0000-0000-0000-000000000005',
    'cccccccc-0000-0000-0000-000000000008',
    '33333333-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '3 days',
    CURRENT_DATE + INTERVAL '27 days',
    'active', 400
  ),
  (
    'ffffffff-0000-0000-0000-000000000006',
    'cccccccc-0000-0000-0000-000000000009',
    '33333333-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '8 days',
    CURRENT_DATE + INTERVAL '22 days',
    'active', 400
  ),
  -- Expired membership
  (
    'ffffffff-0000-0000-0000-000000000007',
    'cccccccc-0000-0000-0000-000000000005',
    '33333333-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '45 days',
    CURRENT_DATE - INTERVAL '15 days',
    'expired', 400
  ),
  -- Private pack (שירה - 4 session pack, 2 used)
  (
    'ffffffff-0000-0000-0000-000000000008',
    'cccccccc-0000-0000-0000-000000000003',
    '33333333-0000-0000-0000-000000000002',
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE + INTERVAL '40 days',
    'active', 900
  );

-- Update sessions_remaining for שירה's pack
UPDATE client_memberships
SET sessions_remaining = 2
WHERE id = 'ffffffff-0000-0000-0000-000000000008';

-- ============================================================
-- PAYMENTS
-- ============================================================
INSERT INTO payments (client_id, membership_id, amount, status, payment_method, paid_at, description) VALUES
  -- Paid monthly memberships
  ('cccccccc-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000001', 400, 'paid', 'bit', NOW() - INTERVAL '15 days', 'מנוי חודשי - ' || TO_CHAR(CURRENT_DATE - INTERVAL '15 days', 'MM/YYYY')),
  ('cccccccc-0000-0000-0000-000000000002', 'ffffffff-0000-0000-0000-000000000002', 400, 'paid', 'transfer', NOW() - INTERVAL '10 days', 'מנוי חודשי - ' || TO_CHAR(CURRENT_DATE - INTERVAL '10 days', 'MM/YYYY')),
  ('cccccccc-0000-0000-0000-000000000004', 'ffffffff-0000-0000-0000-000000000003', 400, 'paid', 'cash', NOW() - INTERVAL '5 days', 'מנוי חודשי - ' || TO_CHAR(CURRENT_DATE - INTERVAL '5 days', 'MM/YYYY')),
  ('cccccccc-0000-0000-0000-000000000006', 'ffffffff-0000-0000-0000-000000000004', 400, 'paid', 'bit', NOW() - INTERVAL '20 days', 'מנוי חודשי - ' || TO_CHAR(CURRENT_DATE - INTERVAL '20 days', 'MM/YYYY')),
  ('cccccccc-0000-0000-0000-000000000008', 'ffffffff-0000-0000-0000-000000000005', 400, 'paid', 'bit', NOW() - INTERVAL '3 days', 'מנוי חודשי - ' || TO_CHAR(CURRENT_DATE - INTERVAL '3 days', 'MM/YYYY')),
  -- Unpaid
  ('cccccccc-0000-0000-0000-000000000009', 'ffffffff-0000-0000-0000-000000000006', 400, 'unpaid', NULL, NULL, 'מנוי חודשי - ' || TO_CHAR(CURRENT_DATE, 'MM/YYYY')),
  -- עומר - unpaid private lesson
  ('cccccccc-0000-0000-0000-000000000010', NULL, 250, 'unpaid', NULL, NULL, 'שיעור פרטי'),
  -- שירה's pack
  ('cccccccc-0000-0000-0000-000000000003', 'ffffffff-0000-0000-0000-000000000008', 900, 'paid', 'transfer', NOW() - INTERVAL '20 days', 'חבילת 4 שיעורים פרטיים'),
  -- ניר's expired
  ('cccccccc-0000-0000-0000-000000000005', 'ffffffff-0000-0000-0000-000000000007', 400, 'paid', 'cash', NOW() - INTERVAL '45 days', 'מנוי חודשי (פג)');

-- ============================================================
-- NOTES
-- ============================================================
INSERT INTO notes (client_id, author_id, content) VALUES
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'מתאמן ברצינות לקראת תחרות. לשים דגש על עמידה ותנועת רגליים.'),
  ('cccccccc-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000001', 'צלצלתי אליו לגבי חידוש מנוי - אמר שיחזור בשבוע הבא.'),
  ('cccccccc-0000-0000-0000-000000000010', 'aaaaaaaa-0000-0000-0000-000000000001', 'צריך לגבות 250₪ עבור שיעור פרטי מיום שישי.');
