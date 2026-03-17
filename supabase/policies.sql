-- ============================================================
-- Row Level Security Policies
-- Run AFTER schema.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: is current user an admin/coach?
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'coach')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: get client_id for current user
CREATE OR REPLACE FUNCTION my_client_id()
RETURNS UUID AS $$
  SELECT id FROM clients WHERE profile_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (is_admin());

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE POLICY "Admins can manage all clients"
  ON clients FOR ALL
  USING (is_admin());

CREATE POLICY "Clients can view own record"
  ON clients FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Clients can update own record"
  ON clients FOR UPDATE
  USING (profile_id = auth.uid());

-- ============================================================
-- LOCATIONS (everyone can view)
-- ============================================================
CREATE POLICY "Everyone can view locations"
  ON locations FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage locations"
  ON locations FOR ALL
  USING (is_admin());

-- ============================================================
-- SESSION TYPES (everyone can view active ones)
-- ============================================================
CREATE POLICY "Everyone can view active session types"
  ON session_types FOR SELECT
  USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admins can manage session types"
  ON session_types FOR ALL
  USING (is_admin());

-- ============================================================
-- SESSIONS (authenticated users can view scheduled sessions)
-- ============================================================
CREATE POLICY "Authenticated users can view sessions"
  ON sessions FOR SELECT
  USING (auth.uid() IS NOT NULL AND status != 'canceled' OR is_admin());

CREATE POLICY "Admins can manage sessions"
  ON sessions FOR ALL
  USING (is_admin());

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  USING (is_admin());

CREATE POLICY "Clients can view own bookings"
  ON bookings FOR SELECT
  USING (client_id = my_client_id());

CREATE POLICY "Clients can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (client_id = my_client_id());

CREATE POLICY "Clients can cancel own bookings"
  ON bookings FOR UPDATE
  USING (client_id = my_client_id())
  WITH CHECK (
    client_id = my_client_id()
    AND status = 'canceled'  -- clients can only cancel, not change to other statuses
  );

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE POLICY "Admins can manage all attendance"
  ON attendance FOR ALL
  USING (is_admin());

CREATE POLICY "Clients can view own attendance"
  ON attendance FOR SELECT
  USING (client_id = my_client_id());

-- ============================================================
-- MEMBERSHIP PLANS (everyone can view active ones)
-- ============================================================
CREATE POLICY "Everyone can view active plans"
  ON membership_plans FOR SELECT
  USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admins can manage plans"
  ON membership_plans FOR ALL
  USING (is_admin());

-- ============================================================
-- CLIENT MEMBERSHIPS
-- ============================================================
CREATE POLICY "Admins can manage all memberships"
  ON client_memberships FOR ALL
  USING (is_admin());

CREATE POLICY "Clients can view own membership"
  ON client_memberships FOR SELECT
  USING (client_id = my_client_id());

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE POLICY "Admins can manage all payments"
  ON payments FOR ALL
  USING (is_admin());

CREATE POLICY "Clients can view own payments"
  ON payments FOR SELECT
  USING (client_id = my_client_id());

-- ============================================================
-- WAITLIST
-- ============================================================
CREATE POLICY "Admins can manage waitlist"
  ON waitlist_entries FOR ALL
  USING (is_admin());

CREATE POLICY "Clients can view own waitlist entries"
  ON waitlist_entries FOR SELECT
  USING (client_id = my_client_id());

CREATE POLICY "Clients can join waitlist"
  ON waitlist_entries FOR INSERT
  WITH CHECK (client_id = my_client_id());

-- ============================================================
-- NOTES (admin only)
-- ============================================================
CREATE POLICY "Admins can manage notes"
  ON notes FOR ALL
  USING (is_admin());
