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
      activities: {
        Row: {
          created_at: string
          created_by: string | null
          detail: string
          id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          detail?: string
          id?: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          detail?: string
          id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      library_settings: {
        Row: {
          created_at: string
          default_monthly_fee: number
          id: string
          library_name: string
          receipt_prefix: string
          total_seats: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_monthly_fee?: number
          id?: string
          library_name?: string
          receipt_prefix?: string
          total_seats?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_monthly_fee?: number
          id?: string
          library_name?: string
          receipt_prefix?: string
          total_seats?: number
          updated_at?: string
        }
        Relationships: []
      }
      library_subscriptions: {
        Row: {
          account_key: string
          amount: number
          billing_day: number
          completed_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          last_payment_at: string | null
          next_renewal_date: string | null
          plan: string
          provider_reference: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_key?: string
          amount?: number
          billing_day?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_payment_at?: string | null
          next_renewal_date?: string | null
          plan?: string
          provider_reference?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_key?: string
          amount?: number
          billing_day?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_payment_at?: string | null
          next_renewal_date?: string | null
          plan?: string
          provider_reference?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          for_month: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          paid_at: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          for_month: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_at?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          for_month?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_at?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      seat_reservations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          seat_number: number
          shift: Database["public"]["Enums"]["seat_shift"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          seat_number: number
          shift?: Database["public"]["Enums"]["seat_shift"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          seat_number?: number
          shift?: Database["public"]["Enums"]["seat_shift"]
        }
        Relationships: []
      }
      students: {
        Row: {
          aadhaar: string | null
          address: string
          created_at: string
          created_by: string | null
          email: string
          id: string
          joining_date: string
          mobile: string
          monthly_fee: number
          name: string
          seat_number: number | null
          security_deposit: number
          shift: Database["public"]["Enums"]["seat_shift"]
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string
        }
        Insert: {
          aadhaar?: string | null
          address?: string
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          joining_date?: string
          mobile?: string
          monthly_fee?: number
          name: string
          seat_number?: number | null
          security_deposit?: number
          shift?: Database["public"]["Enums"]["seat_shift"]
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Update: {
          aadhaar?: string | null
          address?: string
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          joining_date?: string
          mobile?: string
          monthly_fee?: number
          name?: string
          seat_number?: number | null
          security_deposit?: number
          shift?: Database["public"]["Enums"]["seat_shift"]
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      app_role: "admin" | "staff"
      payment_method: "cash" | "upi" | "card" | "bank"
      seat_shift: "morning" | "evening" | "night" | "full_day"
      student_status: "active" | "inactive"
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
    Enums: {
      app_role: ["admin", "staff"],
      payment_method: ["cash", "upi", "card", "bank"],
      seat_shift: ["morning", "evening", "night", "full_day"],
      student_status: ["active", "inactive"],
    },
  },
} as const
