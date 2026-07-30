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
          area: string
          created_at: string
          dimensao: string | null
          eixo: string
          id: string
          meta: string | null
          nome: string
          percentual_progresso: number
          prazo: string
          responsavel: string
          setores: string
          status: Database["public"]["Enums"]["status_acao"]
          updated_at: string
        }
        Insert: {
          area?: string
          created_at?: string
          dimensao?: string | null
          eixo: string
          id?: string
          meta?: string | null
          nome: string
          percentual_progresso?: number
          prazo: string
          responsavel: string
          setores?: string
          status?: Database["public"]["Enums"]["status_acao"]
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          dimensao?: string | null
          eixo?: string
          id?: string
          meta?: string | null
          nome?: string
          percentual_progresso?: number
          prazo?: string
          responsavel?: string
          setores?: string
          status?: Database["public"]["Enums"]["status_acao"]
          updated_at?: string
        }
        Relationships: []
      }
      ambiente_dimensoes: {
        Row: {
          ambiente_id: string
          dimensao_id: string
          id: string
        }
        Insert: {
          ambiente_id: string
          dimensao_id: string
          id?: string
        }
        Update: {
          ambiente_id?: string
          dimensao_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambiente_dimensoes_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: false
            referencedRelation: "ambientes_avaliacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambiente_dimensoes_dimensao_id_fkey"
            columns: ["dimensao_id"]
            isOneToOne: false
            referencedRelation: "dimensoes_avaliacao"
            referencedColumns: ["id"]
          },
        ]
      }
      ambiente_perfis: {
        Row: {
          ambiente_id: string
          id: string
          perfil: Database["public"]["Enums"]["perfil_avaliacao"]
        }
        Insert: {
          ambiente_id: string
          id?: string
          perfil: Database["public"]["Enums"]["perfil_avaliacao"]
        }
        Update: {
          ambiente_id?: string
          id?: string
          perfil?: Database["public"]["Enums"]["perfil_avaliacao"]
        }
        Relationships: [
          {
            foreignKeyName: "ambiente_perfis_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: false
            referencedRelation: "ambientes_avaliacao"
            referencedColumns: ["id"]
          },
        ]
      }
      ambientes_avaliacao: {
        Row: {
          ativo: boolean
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          nivel: Database["public"]["Enums"]["nivel_avaliacao"]
          nome: string
          prorrogado_ate: string | null
          semestre_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          nivel?: Database["public"]["Enums"]["nivel_avaliacao"]
          nome: string
          prorrogado_ate?: string | null
          semestre_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          nivel?: Database["public"]["Enums"]["nivel_avaliacao"]
          nome?: string
          prorrogado_ate?: string | null
          semestre_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambientes_avaliacao_semestre_id_fkey"
            columns: ["semestre_id"]
            isOneToOne: false
            referencedRelation: "semestres_letivos"
            referencedColumns: ["id"]
          },
        ]
      }
      areas_avaliacao: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          dimensao_id: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          dimensao_id: string
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          dimensao_id?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_avaliacao_dimensao_id_fkey"
            columns: ["dimensao_id"]
            isOneToOne: false
            referencedRelation: "dimensoes_avaliacao"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          exibir_home: boolean
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
          exibir_home?: boolean
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
          exibir_home?: boolean
          id?: string
          responsavel?: string
          status?: Database["public"]["Enums"]["status_avaliacao"]
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      avaliadores_sessao: {
        Row: {
          ambiente_id: string
          codigo_turma: string
          completado: boolean
          cpf: string
          created_at: string
          curso: string
          email: string
          id: string
          matricula: string
          nivel: string
          nome: string
          perfil: string
          periodo: string
          semestre: string
          token: string
        }
        Insert: {
          ambiente_id: string
          codigo_turma?: string
          completado?: boolean
          cpf?: string
          created_at?: string
          curso?: string
          email?: string
          id?: string
          matricula: string
          nivel?: string
          nome: string
          perfil: string
          periodo?: string
          semestre?: string
          token?: string
        }
        Update: {
          ambiente_id?: string
          codigo_turma?: string
          completado?: boolean
          cpf?: string
          created_at?: string
          curso?: string
          email?: string
          id?: string
          matricula?: string
          nivel?: string
          nome?: string
          perfil?: string
          periodo?: string
          semestre?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliadores_sessao_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: false
            referencedRelation: "ambientes_avaliacao"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          modalidade: string
          nome: string
          semestre_id: string
          sigla: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          modalidade?: string
          nome: string
          semestre_id: string
          sigla?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          modalidade?: string
          nome?: string
          semestre_id?: string
          sigla?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_semestre_id_fkey"
            columns: ["semestre_id"]
            isOneToOne: false
            referencedRelation: "semestres_letivos"
            referencedColumns: ["id"]
          },
        ]
      }
      dimensoes_avaliacao: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      disciplinas: {
        Row: {
          ativo: boolean
          carga_horaria: number
          codigo: string
          created_at: string
          id: string
          nome: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          carga_horaria?: number
          codigo?: string
          created_at?: string
          id?: string
          nome: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          carga_horaria?: number
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      importacoes: {
        Row: {
          created_at: string
          id: string
          nome_arquivo: string
          observacoes: string | null
          perfil: string
          periodo: string
          total_registros: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_arquivo: string
          observacoes?: string | null
          perfil: string
          periodo: string
          total_registros?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_arquivo?: string
          observacoes?: string | null
          perfil?: string
          periodo?: string
          total_registros?: number
          updated_at?: string
        }
        Relationships: []
      }
      mapeamentos_campos: {
        Row: {
          ambiente_id: string
          campo_arquivo: string
          campo_sistema: string
          created_at: string
          id: string
          perfil: Database["public"]["Enums"]["perfil_avaliacao"]
        }
        Insert: {
          ambiente_id: string
          campo_arquivo: string
          campo_sistema: string
          created_at?: string
          id?: string
          perfil: Database["public"]["Enums"]["perfil_avaliacao"]
        }
        Update: {
          ambiente_id?: string
          campo_arquivo?: string
          campo_sistema?: string
          created_at?: string
          id?: string
          perfil?: Database["public"]["Enums"]["perfil_avaliacao"]
        }
        Relationships: [
          {
            foreignKeyName: "mapeamentos_campos_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: false
            referencedRelation: "ambientes_avaliacao"
            referencedColumns: ["id"]
          },
        ]
      }
      periodos: {
        Row: {
          ativo: boolean
          created_at: string
          curso_id: string
          id: string
          nome: string
          numero: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          curso_id: string
          id?: string
          nome?: string
          numero?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          curso_id?: string
          id?: string
          nome?: string
          numero?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aprovado: boolean
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          aprovado?: boolean
          created_at?: string
          email: string
          id: string
          nome?: string
          updated_at?: string
        }
        Update: {
          aprovado?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      questoes_avaliacao: {
        Row: {
          area_id: string | null
          ativo: boolean
          created_at: string
          dimensao_id: string
          id: string
          ordem: number
          texto: string
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          ativo?: boolean
          created_at?: string
          dimensao_id: string
          id?: string
          ordem?: number
          texto: string
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          ativo?: boolean
          created_at?: string
          dimensao_id?: string
          id?: string
          ordem?: number
          texto?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_avaliacao_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_avaliacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questoes_avaliacao_dimensao_id_fkey"
            columns: ["dimensao_id"]
            isOneToOne: false
            referencedRelation: "dimensoes_avaliacao"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios: {
        Row: {
          campos_selecionados: Json
          configuracao: Json | null
          created_at: string
          descricao: string | null
          filtros: Json | null
          id: string
          tabela_origem: string
          tipo_grafico: string
          titulo: string
          updated_at: string
        }
        Insert: {
          campos_selecionados?: Json
          configuracao?: Json | null
          created_at?: string
          descricao?: string | null
          filtros?: Json | null
          id?: string
          tabela_origem: string
          tipo_grafico?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          campos_selecionados?: Json
          configuracao?: Json | null
          created_at?: string
          descricao?: string | null
          filtros?: Json | null
          id?: string
          tabela_origem?: string
          tipo_grafico?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      respostas_avaliacao: {
        Row: {
          ambiente_id: string
          created_at: string
          dimensao_id: string
          id: string
          nota: number
          observacao: string | null
          questao_id: string
          sessao_id: string
        }
        Insert: {
          ambiente_id: string
          created_at?: string
          dimensao_id: string
          id?: string
          nota: number
          observacao?: string | null
          questao_id: string
          sessao_id: string
        }
        Update: {
          ambiente_id?: string
          created_at?: string
          dimensao_id?: string
          id?: string
          nota?: number
          observacao?: string | null
          questao_id?: string
          sessao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "respostas_avaliacao_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: false
            referencedRelation: "ambientes_avaliacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_avaliacao_dimensao_id_fkey"
            columns: ["dimensao_id"]
            isOneToOne: false
            referencedRelation: "dimensoes_avaliacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_avaliacao_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questoes_avaliacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_avaliacao_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "avaliadores_sessao"
            referencedColumns: ["id"]
          },
        ]
      }
      resultados: {
        Row: {
          area: string
          atende_parcialmente: number
          bom: number
          conceito: string
          created_at: string
          curso: string
          dimensao: string
          excelente: number
          id: string
          importacao_id: string | null
          media: number
          muito_ruim: number
          nao_se_aplica: number
          nivel: string
          regular: number
          semestre: string
          texto_questao: string
          tipo_avaliacao: string
          total: number
        }
        Insert: {
          area?: string
          atende_parcialmente?: number
          bom?: number
          conceito?: string
          created_at?: string
          curso?: string
          dimensao?: string
          excelente?: number
          id?: string
          importacao_id?: string | null
          media?: number
          muito_ruim?: number
          nao_se_aplica?: number
          nivel?: string
          regular?: number
          semestre?: string
          texto_questao?: string
          tipo_avaliacao?: string
          total?: number
        }
        Update: {
          area?: string
          atende_parcialmente?: number
          bom?: number
          conceito?: string
          created_at?: string
          curso?: string
          dimensao?: string
          excelente?: number
          id?: string
          importacao_id?: string | null
          media?: number
          muito_ruim?: number
          nao_se_aplica?: number
          nivel?: string
          regular?: number
          semestre?: string
          texto_questao?: string
          tipo_avaliacao?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "resultados_importacao_id_fkey"
            columns: ["importacao_id"]
            isOneToOne: false
            referencedRelation: "importacoes"
            referencedColumns: ["id"]
          },
        ]
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
      semestres_letivos: {
        Row: {
          ano: number
          ativo: boolean
          created_at: string
          id: string
          nome: string
          periodo: number
          updated_at: string
        }
        Insert: {
          ano: number
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          periodo: number
          updated_at?: string
        }
        Update: {
          ano?: number
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          periodo?: number
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
      turmas: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          curso_id: string | null
          id: string
          nome: string
          periodo_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          curso_id?: string | null
          id?: string
          nome: string
          periodo_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          curso_id?: string | null
          id?: string
          nome?: string
          periodo_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      nivel_avaliacao: "presencial" | "ead"
      perfil_avaliacao: "professor" | "aluno" | "colaborador" | "coordenador"
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
      app_role: ["admin", "user"],
      nivel_avaliacao: ["presencial", "ead"],
      perfil_avaliacao: ["professor", "aluno", "colaborador", "coordenador"],
      status_acao: ["nao_iniciada", "em_andamento", "concluida"],
      status_avaliacao: ["planejado", "em_execucao", "concluido"],
      status_reuniao: ["agendada", "realizada", "cancelada"],
      tipo_setor: ["departamento", "coordenacao", "setor"],
      tipo_usuario: ["coordenador", "gestor", "admin_cpa"],
    },
  },
} as const
