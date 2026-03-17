-- ============================================================
-- Boxing Coach App - Database Schema
-- ============================================================
-- Run this in your Supabase SQL editor FIRST, then policies.sql, then seed.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'client')) DEFAULT 'client',
  full_name   TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLIENTS (student / member detail)
-- ============================================================
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- linked if they have an app account
  full_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  goals       TEXT,
  injuries    TEXT,
  notes       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SESSION TYPES (templates for kinds of sessions)
-- ============================================================
CREATE TABLE session_types (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,       -- English
  name_he           TEXT NOT NULL,       -- Hebrew
  type              TEXT NOT NULL CHECK (type IN ('group', 'private', 'trial', 'drop_in')),
  price             INTEGER NOT NULL,    -- in shekels
  duration_minutes  INTEGER NOT NULL DEFAULT 60,
  max_capacity      INTEGER,             -- NULL = unlimited (for private)
  color             TEXT DEFAULT '#3B82F6', -- for calendar display
  is_active         BOOLEAN DEFAULT TRUE,
  description       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SESSIONS (actual class instances)
-- ============================================================
CREATE TABLE sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type_id     UUID REFERENCES session_types(id) NOT NULL,
  location_id         UUID REFERENCES locations(id),
  coach_id            UUID REFERENCES profiles(id),
  starts_at           TIMESTAMPTZ NOT NULL,
  ends_at             TIMESTAMPTZ NOT NULL,
  capacity            INTEGER NOT NULL,
  status              TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'canceled')),
  notes               TEXT,
  recurring_group_id  UUID,  -- groups recurring instances together
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  client_id             UUID REFERENCES clients(id) NOT NULL,
  status                TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'canceled', 'no_show', 'waitlisted')),
  booked_by             TEXT DEFAULT 'client' CHECK (booked_by IN ('client', 'admin')),
  canceled_at           TIMESTAMPTZ,
  cancellation_reason   TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, client_id)
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID REFERENCES bookings(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES sessions(id) NOT NULL,
  client_id   UUID REFERENCES clients(id) NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('present', 'absent', 'canceled', 'no_show')),
  marked_at   TIMESTAMPTZ DEFAULT NOW(),
  marked_by   UUID REFERENCES profiles(id),
  notes       TEXT,
  UNIQUE(session_id, client_id)
);

-- ============================================================
-- MEMBERSHIP PLANS (product catalog)
-- ============================================================
CREATE TABLE membership_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  name_he           TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('monthly_group', 'session_pack', 'trial', 'drop_in')),
  price             INTEGER NOT NULL,   -- in shekels
  sessions_per_week INTEGER,           -- monthly_group: max per week
  sessions_total    INTEGER,           -- session_pack: total sessions
  validity_days     INTEGER NOT NULL,  -- how long the plan is valid
  is_active         BOOLEAN DEFAULT TRUE,
  description       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLIENT MEMBERSHIPS (active plan instances)
-- ============================================================
CREATE TABLE client_memberships (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID REFERENCES clients(id) NOT NULL,
  plan_id             UUID REFERENCES membership_plans(id) NOT NULL,
  starts_at           DATE NOT NULL,
  ends_at             DATE NOT NULL,
  status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'canceled')),
  sessions_remaining  INTEGER,         -- for packs; NULL for monthly
  price_paid          INTEGER,         -- actual amount paid (may differ from plan price)
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES clients(id) NOT NULL,
  membership_id   UUID REFERENCES client_memberships(id),
  booking_id      UUID REFERENCES bookings(id),
  amount          INTEGER NOT NULL,    -- in shekels
  status          TEXT DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'partial', 'refunded')),
  payment_method  TEXT CHECK (payment_method IN ('cash', 'transfer', 'bit', 'credit_card', 'other')),
  paid_at         TIMESTAMPTZ,
  due_date        DATE,
  description     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WAITLIST
-- ============================================================
CREATE TABLE waitlist_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  client_id   UUID REFERENCES clients(id) NOT NULL,
  position    INTEGER NOT NULL,
  status      TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'promoted', 'canceled')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, client_id)
);

-- ============================================================
-- NOTES (internal coach notes per client)
-- ============================================================
CREATE TABLE notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) NOT NULL,
  author_id   UUID REFERENCES profiles(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_sessions_starts_at ON sessions(starts_at);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_bookings_session_id ON bookings(session_id);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_attendance_session_id ON attendance(session_id);
CREATE INDEX idx_attendance_client_id ON attendance(client_id);
CREATE INDEX idx_client_memberships_client_id ON client_memberships(client_id);
CREATE INDEX idx_client_memberships_status ON client_memberships(status);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER client_memberships_updated_at BEFORE UPDATE ON client_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: get booking count for a session
CREATE OR REPLACE FUNCTION get_session_booking_count(session_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM bookings
  WHERE session_id = session_uuid AND status IN ('confirmed', 'pending');
$$ LANGUAGE sql STABLE;

-- Function: check if client has active membership
CREATE OR REPLACE FUNCTION client_has_active_membership(client_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM client_memberships
    WHERE client_id = client_uuid
      AND status = 'active'
      AND starts_at <= CURRENT_DATE
      AND ends_at >= CURRENT_DATE
  );
$$ LANGUAGE sql STABLE;

-- Function: get client weekly group bookings count
CREATE OR REPLACE FUNCTION client_weekly_group_bookings(client_uuid UUID, week_start DATE)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM bookings b
  JOIN sessions s ON b.session_id = s.id
  JOIN session_types st ON s.session_type_id = st.id
  WHERE b.client_id = client_uuid
    AND b.status IN ('confirmed', 'pending')
    AND st.type = 'group'
    AND s.starts_at >= week_start::TIMESTAMPTZ
    AND s.starts_at < (week_start + INTERVAL '7 days')::TIMESTAMPTZ;
$$ LANGUAGE sql STABLE;

-- Auto-expire memberships
CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS void AS $$
  UPDATE client_memberships
  SET status = 'expired'
  WHERE status = 'active' AND ends_at < CURRENT_DATE;
$$ LANGUAGE sql;

-- Handle new auth user: create profile automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
