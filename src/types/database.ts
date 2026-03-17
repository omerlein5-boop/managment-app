export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'coach' | 'client'
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'admin' | 'coach' | 'client'
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          role?: 'admin' | 'coach' | 'client'
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          profile_id: string | null
          full_name: string
          phone: string
          email: string | null
          goals: string | null
          injuries: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          full_name: string
          phone: string
          email?: string | null
          goals?: string | null
          injuries?: string | null
          notes?: string | null
          is_active?: boolean
        }
        Update: {
          profile_id?: string | null
          full_name?: string
          phone?: string
          email?: string | null
          goals?: string | null
          injuries?: string | null
          notes?: string | null
          is_active?: boolean
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          address: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          is_active?: boolean
        }
        Update: {
          name?: string
          address?: string | null
          is_active?: boolean
        }
      }
      session_types: {
        Row: {
          id: string
          name: string
          name_he: string
          type: 'group' | 'private' | 'trial' | 'drop_in'
          price: number
          duration_minutes: number
          max_capacity: number | null
          color: string
          is_active: boolean
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_he: string
          type: 'group' | 'private' | 'trial' | 'drop_in'
          price: number
          duration_minutes?: number
          max_capacity?: number | null
          color?: string
          is_active?: boolean
          description?: string | null
        }
        Update: {
          name?: string
          name_he?: string
          type?: 'group' | 'private' | 'trial' | 'drop_in'
          price?: number
          duration_minutes?: number
          max_capacity?: number | null
          color?: string
          is_active?: boolean
          description?: string | null
        }
      }
      sessions: {
        Row: {
          id: string
          session_type_id: string
          location_id: string | null
          coach_id: string | null
          starts_at: string
          ends_at: string
          capacity: number
          status: 'scheduled' | 'in_progress' | 'completed' | 'canceled'
          notes: string | null
          recurring_group_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_type_id: string
          location_id?: string | null
          coach_id?: string | null
          starts_at: string
          ends_at: string
          capacity: number
          status?: 'scheduled' | 'in_progress' | 'completed' | 'canceled'
          notes?: string | null
          recurring_group_id?: string | null
        }
        Update: {
          session_type_id?: string
          location_id?: string | null
          coach_id?: string | null
          starts_at?: string
          ends_at?: string
          capacity?: number
          status?: 'scheduled' | 'in_progress' | 'completed' | 'canceled'
          notes?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          session_id: string
          client_id: string
          status: 'confirmed' | 'pending' | 'canceled' | 'no_show' | 'waitlisted'
          booked_by: 'client' | 'admin'
          canceled_at: string | null
          cancellation_reason: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          client_id: string
          status?: 'confirmed' | 'pending' | 'canceled' | 'no_show' | 'waitlisted'
          booked_by?: 'client' | 'admin'
          notes?: string | null
        }
        Update: {
          status?: 'confirmed' | 'pending' | 'canceled' | 'no_show' | 'waitlisted'
          canceled_at?: string | null
          cancellation_reason?: string | null
          notes?: string | null
        }
      }
      attendance: {
        Row: {
          id: string
          booking_id: string | null
          session_id: string
          client_id: string
          status: 'present' | 'absent' | 'canceled' | 'no_show'
          marked_at: string
          marked_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          booking_id?: string | null
          session_id: string
          client_id: string
          status: 'present' | 'absent' | 'canceled' | 'no_show'
          marked_by?: string | null
          notes?: string | null
        }
        Update: {
          status?: 'present' | 'absent' | 'canceled' | 'no_show'
          notes?: string | null
        }
      }
      membership_plans: {
        Row: {
          id: string
          name: string
          name_he: string
          type: 'monthly_group' | 'session_pack' | 'trial' | 'drop_in'
          price: number
          sessions_per_week: number | null
          sessions_total: number | null
          validity_days: number
          is_active: boolean
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_he: string
          type: 'monthly_group' | 'session_pack' | 'trial' | 'drop_in'
          price: number
          sessions_per_week?: number | null
          sessions_total?: number | null
          validity_days: number
          is_active?: boolean
          description?: string | null
        }
        Update: {
          name?: string
          name_he?: string
          price?: number
          sessions_per_week?: number | null
          sessions_total?: number | null
          validity_days?: number
          is_active?: boolean
          description?: string | null
        }
      }
      client_memberships: {
        Row: {
          id: string
          client_id: string
          plan_id: string
          starts_at: string
          ends_at: string
          status: 'active' | 'expired' | 'suspended' | 'canceled'
          sessions_remaining: number | null
          price_paid: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          plan_id: string
          starts_at: string
          ends_at: string
          status?: 'active' | 'expired' | 'suspended' | 'canceled'
          sessions_remaining?: number | null
          price_paid?: number | null
          notes?: string | null
        }
        Update: {
          starts_at?: string
          ends_at?: string
          status?: 'active' | 'expired' | 'suspended' | 'canceled'
          sessions_remaining?: number | null
          price_paid?: number | null
          notes?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          client_id: string
          membership_id: string | null
          booking_id: string | null
          amount: number
          status: 'paid' | 'unpaid' | 'partial' | 'refunded'
          payment_method: 'cash' | 'transfer' | 'bit' | 'credit_card' | 'other' | null
          paid_at: string | null
          due_date: string | null
          description: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          membership_id?: string | null
          booking_id?: string | null
          amount: number
          status?: 'paid' | 'unpaid' | 'partial' | 'refunded'
          payment_method?: 'cash' | 'transfer' | 'bit' | 'credit_card' | 'other' | null
          paid_at?: string | null
          due_date?: string | null
          description?: string | null
          notes?: string | null
        }
        Update: {
          amount?: number
          status?: 'paid' | 'unpaid' | 'partial' | 'refunded'
          payment_method?: 'cash' | 'transfer' | 'bit' | 'credit_card' | 'other' | null
          paid_at?: string | null
          due_date?: string | null
          description?: string | null
          notes?: string | null
        }
      }
      waitlist_entries: {
        Row: {
          id: string
          session_id: string
          client_id: string
          position: number
          status: 'waiting' | 'promoted' | 'canceled'
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          client_id: string
          position: number
          status?: 'waiting' | 'promoted' | 'canceled'
        }
        Update: {
          position?: number
          status?: 'waiting' | 'promoted' | 'canceled'
        }
      }
      notes: {
        Row: {
          id: string
          client_id: string
          author_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          author_id?: string | null
          content: string
        }
        Update: {
          content?: string
        }
      }
    }
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      my_client_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_session_booking_count: {
        Args: { session_uuid: string }
        Returns: number
      }
      client_has_active_membership: {
        Args: { client_uuid: string }
        Returns: boolean
      }
      client_weekly_group_bookings: {
        Args: { client_uuid: string; week_start: string }
        Returns: number
      }
    }
  }
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type SessionType = Database['public']['Tables']['session_types']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Attendance = Database['public']['Tables']['attendance']['Row']
export type MembershipPlan = Database['public']['Tables']['membership_plans']['Row']
export type ClientMembership = Database['public']['Tables']['client_memberships']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type WaitlistEntry = Database['public']['Tables']['waitlist_entries']['Row']
export type Note = Database['public']['Tables']['notes']['Row']

// Enriched types used across the app
export type SessionWithDetails = Session & {
  session_types: SessionType
  locations: Location | null
  booking_count?: number
}

export type BookingWithDetails = Booking & {
  sessions: SessionWithDetails
  clients: Client
}

export type ClientWithMembership = Client & {
  active_membership?: ClientMembership & { membership_plans: MembershipPlan }
  unpaid_balance?: number
}

export type PaymentMethod = 'cash' | 'transfer' | 'bit' | 'credit_card' | 'other'
export type BookingStatus = 'confirmed' | 'pending' | 'canceled' | 'no_show' | 'waitlisted'
export type AttendanceStatus = 'present' | 'absent' | 'canceled' | 'no_show'
export type MembershipStatus = 'active' | 'expired' | 'suspended' | 'canceled'
