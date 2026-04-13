export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      driver_flags: {
        Row: {
          admin_notes: string | null
          created_at: string
          created_by: string | null
          details: string | null
          driver_id: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          ride_id: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          driver_id: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          ride_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          driver_id?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          ride_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_flags_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_flags_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_flags_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          created_at: string
          driver_id: string
          heading: number | null
          id: string
          lat: number
          lng: number
          recorded_at: string
          source: string
          speed_mph: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          heading?: number | null
          id?: string
          lat: number
          lng: number
          recorded_at?: string
          source?: string
          speed_mph?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          source?: string
          speed_mph?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_safety_certs: {
        Row: {
          cert_number: string | null
          cert_type: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          driver_id: string
          expires_at: string | null
          id: string
          issuing_authority: string | null
          updated_at: string
          updated_by: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          cert_number?: string | null
          cert_type: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          driver_id: string
          expires_at?: string | null
          id?: string
          issuing_authority?: string | null
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          cert_number?: string | null
          cert_type?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          driver_id?: string
          expires_at?: string | null
          id?: string
          issuing_authority?: string | null
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_safety_certs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_child_safe: boolean
          license_plate: string | null
          name: string
          phone: string | null
          rating: number
          status: string
          total_ratings: number
          updated_at: string
          updated_by: string | null
          user_id: string
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          version: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_child_safe?: boolean
          license_plate?: string | null
          name: string
          phone?: string | null
          rating?: number
          status?: string
          total_ratings?: number
          updated_at?: string
          updated_by?: string | null
          user_id: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          version?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_child_safe?: boolean
          license_plate?: string | null
          name?: string
          phone?: string | null
          rating?: number
          status?: string
          total_ratings?: number
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          version?: number
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_primary: boolean
          name: string
          phone: string
          relationship: string | null
          rider_profile_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_primary?: boolean
          name: string
          phone: string
          relationship?: string | null
          rider_profile_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string
          relationship?: string | null
          rider_profile_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_rider_profile_id_fkey"
            columns: ["rider_profile_id"]
            isOneToOne: false
            referencedRelation: "rider_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fare_splits: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          invitee_amount: number
          invitee_id: string
          inviter_amount: number
          inviter_id: string
          responded_at: string | null
          ride_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          invitee_amount: number
          invitee_id: string
          inviter_amount: number
          inviter_id: string
          responded_at?: string | null
          ride_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          invitee_amount?: number
          invitee_id?: string
          inviter_amount?: number
          inviter_id?: string
          responded_at?: string | null
          ride_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fare_splits_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fare_splits_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fare_splits_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          push_enabled: boolean
          sms_enabled: boolean
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          sms_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          sms_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          authorized_at: string | null
          captured_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          payment_method: string | null
          refunded_at: string | null
          ride_id: string
          rider_id: string
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          amount: number
          authorized_at?: string | null
          captured_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          payment_method?: string | null
          refunded_at?: string | null
          ride_id: string
          rider_id: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          amount?: number
          authorized_at?: string | null
          captured_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          payment_method?: string | null
          refunded_at?: string | null
          ride_id?: string
          rider_id?: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_passes: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          expires_at: string
          id: string
          plan_description: string | null
          plan_name: string
          price_paid: number
          purchased_at: string
          rider_id: string
          rides_remaining: number
          rides_total: number
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expires_at: string
          id?: string
          plan_description?: string | null
          plan_name: string
          price_paid: number
          purchased_at?: string
          rider_id: string
          rides_remaining: number
          rides_total: number
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expires_at?: string
          id?: string
          plan_description?: string | null
          plan_name?: string
          price_paid?: number
          purchased_at?: string
          rider_id?: string
          rides_remaining?: number
          rides_total?: number
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ride_passes_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_ratings: {
        Row: {
          created_at: string
          created_by: string | null
          driver_comment: string | null
          driver_gave_rider: number | null
          driver_id: string
          driver_submitted: boolean
          id: string
          ride_id: string
          rider_comment: string | null
          rider_gave_driver: number | null
          rider_id: string
          rider_submitted: boolean
          tip_amount: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          driver_comment?: string | null
          driver_gave_rider?: number | null
          driver_id: string
          driver_submitted?: boolean
          id?: string
          ride_id: string
          rider_comment?: string | null
          rider_gave_driver?: number | null
          rider_id: string
          rider_submitted?: boolean
          tip_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          driver_comment?: string | null
          driver_gave_rider?: number | null
          driver_id?: string
          driver_submitted?: boolean
          id?: string
          ride_id?: string
          rider_comment?: string | null
          rider_gave_driver?: number | null
          rider_id?: string
          rider_submitted?: boolean
          tip_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_ratings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: true
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_ratings_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_status_history: {
        Row: {
          change_reason: string | null
          change_source: string
          changed_at: string
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          ride_id: string
          to_status: string
        }
        Insert: {
          change_reason?: string | null
          change_source: string
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          ride_id: string
          to_status: string
        }
        Update: {
          change_reason?: string | null
          change_source?: string
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          ride_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_status_history_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_stops: {
        Row: {
          address: string
          arrived_at: string | null
          created_at: string
          created_by: string | null
          departed_at: string | null
          id: string
          label: string | null
          lat: number
          lng: number
          ride_id: string
          stop_order: number
          updated_at: string
        }
        Insert: {
          address: string
          arrived_at?: string | null
          created_at?: string
          created_by?: string | null
          departed_at?: string | null
          id?: string
          label?: string | null
          lat: number
          lng: number
          ride_id: string
          stop_order: number
          updated_at?: string
        }
        Update: {
          address?: string
          arrived_at?: string | null
          created_at?: string
          created_by?: string | null
          departed_at?: string | null
          id?: string
          label?: string | null
          lat?: number
          lng?: number
          ride_id?: string
          stop_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_stops_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_profiles: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_child: boolean
          name: string
          notes: string | null
          photo_url: string | null
          rider_id: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_child?: boolean
          name: string
          notes?: string | null
          photo_url?: string | null
          rider_id: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_child?: boolean
          name?: string
          notes?: string | null
          photo_url?: string | null
          rider_id?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "rider_profiles_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      riders: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
          version: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
          version?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      rides: {
        Row: {
          actual_duration_min: number | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          distance_miles: number | null
          driver_arrived_at: string | null
          driver_id: string | null
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          estimated_duration_min: number | null
          fare_estimate: number | null
          fare_final: number | null
          id: string
          is_child_safe_required: boolean
          is_recurring: boolean
          matched_at: string | null
          pickup_address: string
          pickup_at: string | null
          pickup_lat: number
          pickup_lng: number
          pin_attempts: number
          pin_hash: string | null
          prefer_trusted_driver: boolean
          recurrence_rule: string | null
          requested_at: string
          rider_id: string
          rider_profile_id: string | null
          scheduled_for: string | null
          status: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          actual_duration_min?: number | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          distance_miles?: number | null
          driver_arrived_at?: string | null
          driver_id?: string | null
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          estimated_duration_min?: number | null
          fare_estimate?: number | null
          fare_final?: number | null
          id?: string
          is_child_safe_required?: boolean
          is_recurring?: boolean
          matched_at?: string | null
          pickup_address: string
          pickup_at?: string | null
          pickup_lat: number
          pickup_lng: number
          pin_attempts?: number
          pin_hash?: string | null
          prefer_trusted_driver?: boolean
          recurrence_rule?: string | null
          requested_at?: string
          rider_id: string
          rider_profile_id?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          actual_duration_min?: number | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          distance_miles?: number | null
          driver_arrived_at?: string | null
          driver_id?: string | null
          dropoff_address?: string
          dropoff_lat?: number
          dropoff_lng?: number
          estimated_duration_min?: number | null
          fare_estimate?: number | null
          fare_final?: number | null
          id?: string
          is_child_safe_required?: boolean
          is_recurring?: boolean
          matched_at?: string | null
          pickup_address?: string
          pickup_at?: string | null
          pickup_lat?: number
          pickup_lng?: number
          pin_attempts?: number
          pin_hash?: string | null
          prefer_trusted_driver?: boolean
          recurrence_rule?: string | null
          requested_at?: string
          rider_id?: string
          rider_profile_id?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_rider_profile_id_fkey"
            columns: ["rider_profile_id"]
            isOneToOne: false
            referencedRelation: "rider_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_shares: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          is_active: boolean
          last_viewed_at: string | null
          recipient_email: string | null
          recipient_name: string
          recipient_phone: string | null
          ride_id: string
          share_token: string
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          is_active?: boolean
          last_viewed_at?: string | null
          recipient_email?: string | null
          recipient_name: string
          recipient_phone?: string | null
          ride_id: string
          share_token: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          last_viewed_at?: string | null
          recipient_email?: string | null
          recipient_name?: string
          recipient_phone?: string | null
          ride_id?: string
          share_token?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "trip_shares_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_drivers: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          driver_id: string
          id: string
          nickname: string | null
          rider_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          driver_id: string
          id?: string
          nickname?: string | null
          rider_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          driver_id?: string
          id?: string
          nickname?: string | null
          rider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trusted_drivers_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trusted_drivers_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          role: string
          updated_at: string
          updated_by: string | null
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          role: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          role?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          version?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
