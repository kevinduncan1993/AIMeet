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
      businesses: {
        Row: {
          id: string
          name: string
          slug: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          timezone: string
          website: string | null
          description: string | null
          logo_url: string | null
          primary_color: string
          widget_key: string
          subscription_tier: string
          subscription_status: string
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['businesses']['Row'], 'id' | 'created_at' | 'updated_at' | 'widget_key'>
        Update: Partial<Database['public']['Tables']['businesses']['Insert']>
      }
      business_users: {
        Row: {
          id: string
          business_id: string
          user_id: string
          role: 'owner' | 'manager' | 'staff'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['business_users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['business_users']['Insert']>
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
      services: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          duration_minutes: number
          buffer_minutes: number
          price: number | null
          currency: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['services']['Insert']>
      }
      staff_members: {
        Row: {
          id: string
          business_id: string
          user_id: string | null
          name: string
          email: string | null
          phone: string | null
          role: string | null
          is_active: boolean
          google_calendar_id: string | null
          google_access_token: string | null
          google_refresh_token: string | null
          microsoft_calendar_id: string | null
          microsoft_access_token: string | null
          microsoft_refresh_token: string | null
          calendar_sync_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['staff_members']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['staff_members']['Insert']>
      }
      business_hours: {
        Row: {
          id: string
          business_id: string
          staff_member_id: string | null
          day_of_week: number
          start_time: string
          end_time: string
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['business_hours']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['business_hours']['Insert']>
      }
      special_closures: {
        Row: {
          id: string
          business_id: string
          staff_member_id: string | null
          start_date: string
          end_date: string
          reason: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['special_closures']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['special_closures']['Insert']>
      }
      customers: {
        Row: {
          id: string
          business_id: string
          email: string | null
          phone: string | null
          name: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      appointments: {
        Row: {
          id: string
          business_id: string
          customer_id: string
          service_id: string
          staff_member_id: string | null
          start_time: string
          end_time: string
          timezone: string
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          customer_notes: string | null
          internal_notes: string | null
          google_event_id: string | null
          microsoft_event_id: string | null
          confirmation_sent_at: string | null
          reminder_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      faq_items: {
        Row: {
          id: string
          business_id: string
          question: string
          answer: string
          category: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['faq_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['faq_items']['Insert']>
      }
      documents: {
        Row: {
          id: string
          business_id: string
          title: string
          file_url: string | null
          file_type: string | null
          source_url: string | null
          status: 'pending' | 'processing' | 'ready' | 'failed'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      document_chunks: {
        Row: {
          id: string
          business_id: string
          document_id: string | null
          faq_id: string | null
          content: string
          embedding: number[] | null
          source_type: string | null
          chunk_index: number | null
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['document_chunks']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['document_chunks']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          business_id: string
          customer_id: string | null
          session_id: string | null
          channel: string
          metadata: Json
          first_message_at: string | null
          last_message_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          function_call: Json | null
          tokens_used: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          business_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          status: string | null
          tier: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          monthly_conversations_limit: number | null
          monthly_conversations_used: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
    }
  }
}

// Helper types
export type Business = Database['public']['Tables']['businesses']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type StaffMember = Database['public']['Tables']['staff_members']['Row']
export type BusinessHours = Database['public']['Tables']['business_hours']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type FAQItem = Database['public']['Tables']['faq_items']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
