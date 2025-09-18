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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          operation: Database["public"]["Enums"]["audit_operation"]
          record_id: string | null
          table_name: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation: Database["public"]["Enums"]["audit_operation"]
          record_id?: string | null
          table_name: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation?: Database["public"]["Enums"]["audit_operation"]
          record_id?: string | null
          table_name?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          script_id: string
          updated_at: string
          user_id: string
          website_url: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          script_id: string
          updated_at?: string
          user_id: string
          website_url?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          script_id?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_clients_profiles"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      landing_page_data: {
        Row: {
          created_at: string
          field_name: string
          field_value: string | null
          id: string
          landing_page_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_name: string
          field_value?: string | null
          id?: string
          landing_page_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_name?: string
          field_value?: string | null
          id?: string
          landing_page_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_data_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "user_landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_profile_fields: {
        Row: {
          created_at: string
          field_label: string
          field_name: string
          field_order: number
          field_type: string
          id: string
          is_required: boolean
          placeholder: string | null
          profile_id: string
          step_name: string
          step_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_label: string
          field_name: string
          field_order?: number
          field_type?: string
          id?: string
          is_required?: boolean
          placeholder?: string | null
          profile_id: string
          step_name: string
          step_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_label?: string
          field_name?: string
          field_order?: number
          field_type?: string
          id?: string
          is_required?: boolean
          placeholder?: string | null
          profile_id?: string
          step_name?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_profile_fields_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "landing_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_profiles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          ad_content: string | null
          audience: string | null
          campaign: string | null
          client_id: string
          created_at: string
          email: string
          "email-cliente": string | null
          id: string
          message: string | null
          name: string
          origin: string | null
          phone: string
          status: string
          updated_at: string
          website_url: string
        }
        Insert: {
          ad_content?: string | null
          audience?: string | null
          campaign?: string | null
          client_id: string
          created_at?: string
          email: string
          "email-cliente"?: string | null
          id?: string
          message?: string | null
          name: string
          origin?: string | null
          phone: string
          status?: string
          updated_at?: string
          website_url: string
        }
        Update: {
          ad_content?: string | null
          audience?: string | null
          campaign?: string | null
          client_id?: string
          created_at?: string
          email?: string
          "email-cliente"?: string | null
          id?: string
          message?: string | null
          name?: string
          origin?: string | null
          phone?: string
          status?: string
          updated_at?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          website_domain: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
          website_domain?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          website_domain?: string | null
        }
        Relationships: []
      }
      site_configs: {
        Row: {
          attendant_name: string | null
          company_name: string | null
          created_at: string
          default_message: string | null
          email: string | null
          field_capture_page: boolean
          field_email: boolean
          field_message: boolean
          field_name: boolean
          field_phone: boolean
          icon_position: string
          icon_type: string
          id: string
          is_active: boolean
          phone: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          attendant_name?: string | null
          company_name?: string | null
          created_at?: string
          default_message?: string | null
          email?: string | null
          field_capture_page?: boolean
          field_email?: boolean
          field_message?: boolean
          field_name?: boolean
          field_phone?: boolean
          icon_position?: string
          icon_type?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          attendant_name?: string | null
          company_name?: string | null
          created_at?: string
          default_message?: string | null
          email?: string | null
          field_capture_page?: boolean
          field_email?: boolean
          field_message?: boolean
          field_name?: boolean
          field_phone?: boolean
          icon_position?: string
          icon_type?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_configs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          client_id: string
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          plan_type: Database["public"]["Enums"]["plan_type"]
          start_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          plan_type?: Database["public"]["Enums"]["plan_type"]
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          plan_type?: Database["public"]["Enums"]["plan_type"]
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_landing_pages: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          name: string
          profile_id: string
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          name: string
          profile_id: string
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          name?: string
          profile_id?: string
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_landing_pages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "landing_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_plan_end_date: {
        Args: {
          plan_type: Database["public"]["Enums"]["plan_type"]
          start_date?: string
        }
        Returns: string
      }
      client_has_active_plan: {
        Args: { client_uuid: string }
        Returns: boolean
      }
      create_audit_log: {
        Args: {
          p_new_values?: Json
          p_old_values?: Json
          p_operation: Database["public"]["Enums"]["audit_operation"]
          p_record_id: string
          p_table_name: string
        }
        Returns: undefined
      }
      determine_origin_from_url: {
        Args: { url: string }
        Returns: string
      }
      fix_lead_client_associations: {
        Args: Record<PropertyKey, never>
        Returns: {
          corrected_leads: number
          orphaned_leads: number
          total_leads: number
        }[]
      }
      format_whatsapp_number: {
        Args: { input_phone: string }
        Returns: string
      }
      generate_script_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      report_orphaned_leads: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          current_client_id: string
          lead_email: string
          lead_id: string
          lead_name: string
          website_url: string
        }[]
      }
      reprocess_leads_utm_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          processed_count: number
          updated_count: number
        }[]
      }
      update_leads_by_client_email: {
        Args: Record<PropertyKey, never>
        Returns: {
          skipped_null_emails: number
          total_processed: number
          updated_leads: number
        }[]
      }
      update_subscription_plan: {
        Args: {
          new_is_active?: boolean
          new_plan_type: Database["public"]["Enums"]["plan_type"]
          plan_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      audit_operation: "INSERT" | "UPDATE" | "DELETE"
      plan_type:
        | "free_7_days"
        | "one_month"
        | "three_months"
        | "six_months"
        | "one_year"
      user_type: "admin" | "client"
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
      audit_operation: ["INSERT", "UPDATE", "DELETE"],
      plan_type: [
        "free_7_days",
        "one_month",
        "three_months",
        "six_months",
        "one_year",
      ],
      user_type: ["admin", "client"],
    },
  },
} as const
