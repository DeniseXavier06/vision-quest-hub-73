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
      acoes: {
        Row: {
          created_at: string
          eixo: string
          id: string
          meta: string | null
          nome: string
          percentual_progresso: number
          prazo: string
          responsavel: string
          status: Database["public"]["Enums"]["status_acao"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          eixo: string
          id?: string
          meta?: string | null
          nome: string
          percentual_progresso?: number
          prazo: string
          responsavel: string
          status?: Database["public"]["Enums"]["status_acao"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          eixo?: string
          id?: string
          meta?: string | null
          nome?: string
          percentual_progresso?: number
          prazo?: string
          responsavel?: string
          status?: Database["public"]["Enums"]["status_acao"]
          updated_at?: string
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          responsavel: string
          status: Database["public"]["Enums"]["status_avaliacao"]
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          responsavel: string
          status?: Database["public"]["Enums"]["status_avaliacao"]
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          responsavel?: string
          status?: Database["public"]["Enums"]["status_avaliacao"]
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      reunioes: {
        Row: {
          created_at: string
          data_hora: string
          id: string
          local: string
          status: Database["public"]["Enums"]["status_reuniao"]
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_hora: string
          id?: string
          local: string
          status?: Database["public"]["Enums"]["status_reuniao"]
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_hora?: string
          id?: string
          local?: string
          status?: Database["public"]["Enums"]["status_reuniao"]
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      setores: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          sigla: string
          tipo: Database["public"]["Enums"]["tipo_setor"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          sigla: string
          tipo?: Database["public"]["Enums"]["tipo_setor"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          sigla?: string
          tipo?: Database["public"]["Enums"]["tipo_setor"]
          updated_at?: string
        }
        Relationships: []
      }
      usuarios_cpa: {
        Row: {
          ativo: boolean
          cargo: string | null
          created_at: string
          departamento: string | null
          email: string
          id: string
          nome: string
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          email: string
          id?: string
          nome: string
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          email?: string
          id?: string
          nome?: string
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string
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
      status_acao: "nao_iniciada" | "em_andamento" | "concluida"
      status_avaliacao: "planejado" | "em_execucao" | "concluido"
      status_reuniao: "agendada" | "realizada" | "cancelada"
      tipo_setor: "departamento" | "coordenacao" | "setor"
      tipo_usuario: "coordenador" | "gestor" | "admin_cpa"
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
      status_acao: ["nao_iniciada", "em_andamento", "concluida"],
      status_avaliacao: ["planejado", "em_execucao", "concluido"],
      status_reuniao: ["agendada", "realizada", "cancelada"],
      tipo_setor: ["departamento", "coordenacao", "setor"],
      tipo_usuario: ["coordenador", "gestor", "admin_cpa"],
    },
  },
} as const
