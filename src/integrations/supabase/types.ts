export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          message: string
          response: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          message: string
          response?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          message?: string
          response?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fixture_stats: {
        Row: {
          created_at: string
          fixture_id: number | null
          fouls: number | null
          id: string
          passes_accurate: number | null
          passes_total: number | null
          possession_percentage: number | null
          red_cards: number | null
          shots_on_goal: number | null
          shots_total: number | null
          team_id: number | null
          updated_at: string
          yellow_cards: number | null
        }
        Insert: {
          created_at?: string
          fixture_id?: number | null
          fouls?: number | null
          id?: string
          passes_accurate?: number | null
          passes_total?: number | null
          possession_percentage?: number | null
          red_cards?: number | null
          shots_on_goal?: number | null
          shots_total?: number | null
          team_id?: number | null
          updated_at?: string
          yellow_cards?: number | null
        }
        Update: {
          created_at?: string
          fixture_id?: number | null
          fouls?: number | null
          id?: string
          passes_accurate?: number | null
          passes_total?: number | null
          possession_percentage?: number | null
          red_cards?: number | null
          shots_on_goal?: number | null
          shots_total?: number | null
          team_id?: number | null
          updated_at?: string
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fixture_stats_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixture_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      fixtures: {
        Row: {
          away_goals: number | null
          away_team_id: number | null
          created_at: string
          elapsed: number | null
          fixture_date: string
          home_goals: number | null
          home_team_id: number | null
          id: number
          league_id: number | null
          season: number
          status: string
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          away_goals?: number | null
          away_team_id?: number | null
          created_at?: string
          elapsed?: number | null
          fixture_date: string
          home_goals?: number | null
          home_team_id?: number | null
          id: number
          league_id?: number | null
          season: number
          status?: string
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          away_goals?: number | null
          away_team_id?: number | null
          created_at?: string
          elapsed?: number | null
          fixture_date?: string
          home_goals?: number | null
          home_team_id?: number | null
          id?: number
          league_id?: number | null
          season?: number
          status?: string
          updated_at?: string
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          country: string
          created_at: string
          end_date: string | null
          id: number
          is_current: boolean | null
          logo: string | null
          name: string
          season: number
          start_date: string | null
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          end_date?: string | null
          id: number
          is_current?: boolean | null
          logo?: string | null
          name: string
          season: number
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          end_date?: string | null
          id?: number
          is_current?: boolean | null
          logo?: string | null
          name?: string
          season?: number
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      odds: {
        Row: {
          away_odds: number | null
          bookmaker: string
          created_at: string
          draw_odds: number | null
          fixture_id: number | null
          home_odds: number | null
          id: string
          is_live: boolean | null
          odds_type: string
          updated_at: string
        }
        Insert: {
          away_odds?: number | null
          bookmaker: string
          created_at?: string
          draw_odds?: number | null
          fixture_id?: number | null
          home_odds?: number | null
          id?: string
          is_live?: boolean | null
          odds_type?: string
          updated_at?: string
        }
        Update: {
          away_odds?: number | null
          bookmaker?: string
          created_at?: string
          draw_odds?: number | null
          fixture_id?: number | null
          home_odds?: number | null
          id?: string
          is_live?: boolean | null
          odds_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odds_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      team_stats: {
        Row: {
          created_at: string
          draws: number | null
          form: string | null
          games_played: number | null
          goals_against: number | null
          goals_for: number | null
          id: string
          league_id: number | null
          losses: number | null
          red_cards: number | null
          season: number
          team_id: number | null
          updated_at: string
          wins: number | null
          yellow_cards: number | null
        }
        Insert: {
          created_at?: string
          draws?: number | null
          form?: string | null
          games_played?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          league_id?: number | null
          losses?: number | null
          red_cards?: number | null
          season: number
          team_id?: number | null
          updated_at?: string
          wins?: number | null
          yellow_cards?: number | null
        }
        Update: {
          created_at?: string
          draws?: number | null
          form?: string | null
          games_played?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          league_id?: number | null
          losses?: number | null
          red_cards?: number | null
          season?: number
          team_id?: number | null
          updated_at?: string
          wins?: number | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_stats_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          country: string | null
          created_at: string
          founded: number | null
          id: number
          logo: string | null
          name: string
          updated_at: string
          venue_capacity: number | null
          venue_name: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          founded?: number | null
          id: number
          logo?: string | null
          name: string
          updated_at?: string
          venue_capacity?: number | null
          venue_name?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          founded?: number | null
          id?: number
          logo?: string | null
          name?: string
          updated_at?: string
          venue_capacity?: number | null
          venue_name?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          favorite_leagues: number[] | null
          favorite_teams: number[] | null
          id: string
          last_fixture_id: number | null
          last_league_id: number | null
          last_season: number | null
          last_team_id: number | null
          timezone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          favorite_leagues?: number[] | null
          favorite_teams?: number[] | null
          id?: string
          last_fixture_id?: number | null
          last_league_id?: number | null
          last_season?: number | null
          last_team_id?: number | null
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          favorite_leagues?: number[] | null
          favorite_teams?: number[] | null
          id?: string
          last_fixture_id?: number | null
          last_league_id?: number | null
          last_season?: number | null
          last_team_id?: number | null
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
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
