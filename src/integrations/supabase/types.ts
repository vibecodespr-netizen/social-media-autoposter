export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          brand_id: string | null;
          created_at: string;
          id: string;
          kind: string;
          message: string;
          user_id: string;
        };
        Insert: {
          brand_id?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          message: string;
          user_id: string;
        };
        Update: {
          brand_id?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          message?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
      brands: {
        Row: {
          audience: string | null;
          automation_enabled: boolean;
          banned_topics: string[];
          created_at: string;
          cta: string | null;
          description: string | null;
          id: string;
          industry: string | null;
          language: string | null;
          last_run_at: string | null;
          lock_until: string | null;
          name: string;
          onboarded: boolean;
          paused_reason: string | null;
          platforms: string[];
          posts_per_run: number;
          require_approval: boolean;
          tone: string | null;
          topics: string[];
          user_id: string;
          website: string | null;
        };
        Insert: {
          audience?: string | null;
          automation_enabled?: boolean;
          banned_topics?: string[];
          created_at?: string;
          cta?: string | null;
          description?: string | null;
          id?: string;
          industry?: string | null;
          language?: string | null;
          last_run_at?: string | null;
          lock_until?: string | null;
          name?: string;
          onboarded?: boolean;
          paused_reason?: string | null;
          platforms?: string[];
          posts_per_run?: number;
          require_approval?: boolean;
          tone?: string | null;
          topics?: string[];
          user_id: string;
          website?: string | null;
        };
        Update: {
          audience?: string | null;
          automation_enabled?: boolean;
          banned_topics?: string[];
          created_at?: string;
          cta?: string | null;
          description?: string | null;
          id?: string;
          industry?: string | null;
          language?: string | null;
          last_run_at?: string | null;
          lock_until?: string | null;
          name?: string;
          onboarded?: boolean;
          paused_reason?: string | null;
          platforms?: string[];
          posts_per_run?: number;
          require_approval?: boolean;
          tone?: string | null;
          topics?: string[];
          user_id?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      ideas: {
        Row: {
          brand_id: string;
          created_at: string;
          id: string;
          published_at: string | null;
          source_id: string | null;
          status: string;
          summary: string | null;
          title: string;
          url: string;
          user_id: string;
        };
        Insert: {
          brand_id: string;
          created_at?: string;
          id?: string;
          published_at?: string | null;
          source_id?: string | null;
          status?: string;
          summary?: string | null;
          title: string;
          url: string;
          user_id: string;
        };
        Update: {
          brand_id?: string;
          created_at?: string;
          id?: string;
          published_at?: string | null;
          source_id?: string | null;
          status?: string;
          summary?: string | null;
          title?: string;
          url?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ideas_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ideas_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          brand_id: string;
          content: string;
          created_at: string;
          created_by: string;
          hashtags: string[];
          id: string;
          idea_id: string | null;
          image_prompt: string | null;
          platform: string;
          scheduled_for: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          brand_id: string;
          content: string;
          created_at?: string;
          created_by?: string;
          hashtags?: string[];
          id?: string;
          idea_id?: string | null;
          image_prompt?: string | null;
          platform: string;
          scheduled_for?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          brand_id?: string;
          content?: string;
          created_at?: string;
          created_by?: string;
          hashtags?: string[];
          id?: string;
          idea_id?: string | null;
          image_prompt?: string | null;
          platform?: string;
          scheduled_for?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_idea_id_fkey";
            columns: ["idea_id"];
            isOneToOne: false;
            referencedRelation: "ideas";
            referencedColumns: ["id"];
          },
        ];
      };
      sources: {
        Row: {
          active: boolean;
          brand_id: string;
          created_at: string;
          id: string;
          last_error: string | null;
          last_fetched_at: string | null;
          url: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          brand_id: string;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          last_fetched_at?: string | null;
          url: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          brand_id?: string;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          last_fetched_at?: string | null;
          url?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sources_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      verify_cron_token: { Args: { _token: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
