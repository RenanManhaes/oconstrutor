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
      access_logs: {
        Row: {
          accessed_at: string
          content_id: string
          content_type: string
          id: string
          user_id: string
        }
        Insert: {
          accessed_at?: string
          content_id: string
          content_type: string
          id?: string
          user_id: string
        }
        Update: {
          accessed_at?: string
          content_id?: string
          content_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active: boolean
          created_at: string
          id: string
          message: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          message: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          message?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      encontro_ai_insights: {
        Row: {
          created_at: string
          encontro_id: string
          id: string
          insight: string
          pillar_id: string | null
          progress_score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          encontro_id: string
          id?: string
          insight: string
          pillar_id?: string | null
          progress_score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          encontro_id?: string
          id?: string
          insight?: string
          pillar_id?: string | null
          progress_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encontro_ai_insights_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encontro_ai_insights_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "journey_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      encontro_attendance: {
        Row: {
          encontro_id: string
          id: string
          marked_at: string
          status: string
          user_id: string
        }
        Insert: {
          encontro_id: string
          id?: string
          marked_at?: string
          status?: string
          user_id: string
        }
        Update: {
          encontro_id?: string
          id?: string
          marked_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encontro_attendance_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontros"
            referencedColumns: ["id"]
          },
        ]
      }
      encontro_checklist: {
        Row: {
          completed: boolean
          created_at: string
          encontro_id: string
          id: string
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          encontro_id: string
          id?: string
          sort_order?: number
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          encontro_id?: string
          id?: string
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encontro_checklist_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontros"
            referencedColumns: ["id"]
          },
        ]
      }
      encontro_materials: {
        Row: {
          encontro_id: string
          id: string
          material_id: string
          sort_order: number
        }
        Insert: {
          encontro_id: string
          id?: string
          material_id: string
          sort_order?: number
        }
        Update: {
          encontro_id?: string
          id?: string
          material_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "encontro_materials_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encontro_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      encontro_notes: {
        Row: {
          actions: string | null
          created_at: string
          encontro_id: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: string | null
          created_at?: string
          encontro_id: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: string | null
          created_at?: string
          encontro_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encontro_notes_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontros"
            referencedColumns: ["id"]
          },
        ]
      }
      encontros: {
        Row: {
          created_at: string
          date: string | null
          description: string | null
          end_time: string | null
          id: string
          sort_order: number
          start_time: string | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          sort_order?: number
          start_time?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          sort_order?: number
          start_time?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      guest_signups: {
        Row: {
          converted_user_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          invite_id: string
          notes: string | null
          phone: string | null
          status: string
        }
        Insert: {
          converted_user_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          invite_id: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          converted_user_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          invite_id?: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_signups_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "public_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_stages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          journey_id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          journey_id: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          journey_id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_stages_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          module_id: string | null
          sort_order: number
          stage_id: string | null
          status: string
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          module_id?: string | null
          sort_order?: number
          stage_id?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          module_id?: string | null
          sort_order?: number
          stage_id?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "journey_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          sort_order: number
          stage_id: string | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          sort_order?: number
          stage_id?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          sort_order?: number
          stage_id?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "journey_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          reference_id: string | null
          tipo: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          reference_id?: string | null
          tipo?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          reference_id?: string | null
          tipo?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          last_sign_in_at: string | null
          lgpd_accepted_at: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_sign_in_at?: string | null
          lgpd_accepted_at?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_sign_in_at?: string | null
          lgpd_accepted_at?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_invites: {
        Row: {
          active: boolean
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          encontro_id: string
          expires_at: string | null
          id: string
          max_signups: number | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          encontro_id: string
          expires_at?: string | null
          id?: string
          max_signups?: number | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          encontro_id?: string
          expires_at?: string | null
          id?: string
          max_signups?: number | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_invites_encontro_id_fkey"
            columns: ["encontro_id"]
            isOneToOne: false
            referencedRelation: "encontros"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          id: string
          instruction: string | null
          module_id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          instruction?: string | null
          module_id: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          instruction?: string | null
          module_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          notes: string | null
          paid_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          accessed_at: string
          completed: boolean
          created_at: string
          id: string
          material_id: string | null
          module_id: string | null
          response_text: string | null
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accessed_at?: string
          completed?: boolean
          created_at?: string
          id?: string
          material_id?: string | null
          module_id?: string | null
          response_text?: string | null
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accessed_at?: string
          completed?: boolean
          created_at?: string
          id?: string
          material_id?: string | null
          module_id?: string | null
          response_text?: string | null
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_next_public_invite: {
        Args: never
        Returns: {
          encontro_date: string
          encontro_start_time: string
          encontro_title: string
          invite_title: string
          slug: string
          spots_remaining: number
        }[]
      }
      get_public_invite_secure: {
        Args: { _slug: string }
        Returns: {
          encontro_date: string
          encontro_description: string
          encontro_end_time: string
          encontro_start_time: string
          encontro_thumbnail_url: string
          encontro_title: string
          invite_cover_url: string
          invite_description: string
          invite_id: string
          invite_title: string
          spots_remaining: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_guest_signup_secure: {
        Args: {
          _email: string
          _full_name: string
          _phone?: string
          _slug: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "cliente" | "convidado"
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
      app_role: ["admin", "cliente", "convidado"],
    },
  },
} as const
