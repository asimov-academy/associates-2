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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      anexos: {
        Row: {
          autor_id: string | null
          created_at: string
          id: string
          movimentacao_id: string | null
          nome: string
          processo_id: string | null
          storage_path: string
          tamanho: number | null
        }
        Insert: {
          autor_id?: string | null
          created_at?: string
          id?: string
          movimentacao_id?: string | null
          nome: string
          processo_id?: string | null
          storage_path: string
          tamanho?: number | null
        }
        Update: {
          autor_id?: string | null
          created_at?: string
          id?: string
          movimentacao_id?: string | null
          nome?: string
          processo_id?: string | null
          storage_path?: string
          tamanho?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anexos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cpf: string
          created_at: string
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          rg: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          rg?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          rg?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      movimentacao_historico: {
        Row: {
          alterado_em: string
          alterado_por_id: string | null
          created_at: string
          data_anterior: string | null
          data_nova: string | null
          descricao_anterior: string | null
          descricao_nova: string | null
          id: string
          movimentacao_id: string
          processo_id: string | null
        }
        Insert: {
          alterado_em?: string
          alterado_por_id?: string | null
          created_at?: string
          data_anterior?: string | null
          data_nova?: string | null
          descricao_anterior?: string | null
          descricao_nova?: string | null
          id?: string
          movimentacao_id: string
          processo_id?: string | null
        }
        Update: {
          alterado_em?: string
          alterado_por_id?: string | null
          created_at?: string
          data_anterior?: string | null
          data_nova?: string | null
          descricao_anterior?: string | null
          descricao_nova?: string | null
          id?: string
          movimentacao_id?: string
          processo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacao_historico_alterado_por_id_fkey"
            columns: ["alterado_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacao_historico_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacao_historico_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes: {
        Row: {
          alterado_em: string | null
          alterado_por_id: string | null
          autor_id: string | null
          data: string
          descricao: string
          id: string
          processo_id: string
          registrado_em: string
        }
        Insert: {
          alterado_em?: string | null
          alterado_por_id?: string | null
          autor_id?: string | null
          data: string
          descricao: string
          id?: string
          processo_id: string
          registrado_em?: string
        }
        Update: {
          alterado_em?: string | null
          alterado_por_id?: string | null
          autor_id?: string | null
          data?: string
          descricao?: string
          id?: string
          processo_id?: string
          registrado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_alterado_por_id_fkey"
            columns: ["alterado_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processo_advogados: {
        Row: {
          advogado_id: string
          processo_id: string
        }
        Insert: {
          advogado_id: string
          processo_id: string
        }
        Update: {
          advogado_id?: string
          processo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processo_advogados_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processo_advogados_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processo_clientes: {
        Row: {
          cliente_id: string
          processo_id: string
        }
        Insert: {
          cliente_id: string
          processo_id: string
        }
        Update: {
          cliente_id?: string
          processo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processo_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processo_clientes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processo_historico: {
        Row: {
          acao: string
          alterado_em: string
          alterado_por_id: string | null
          campo: string | null
          created_at: string
          entidade: string
          id: string
          processo_id: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          acao: string
          alterado_em?: string
          alterado_por_id?: string | null
          campo?: string | null
          created_at?: string
          entidade: string
          id?: string
          processo_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          acao?: string
          alterado_em?: string
          alterado_por_id?: string | null
          campo?: string | null
          created_at?: string
          entidade?: string
          id?: string
          processo_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processo_historico_alterado_por_id_fkey"
            columns: ["alterado_por_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processo_historico_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          acao: string
          concluido: boolean
          created_at: string
          data_final: string | null
          data_inicial: string
          descricao: string | null
          fase: string
          id: string
          instancia: string
          numero: string
          proximo_prazo: string | null
          tipo: string
          updated_at: string
          valor_causa: number | null
          vara: string
          vencido: boolean
        }
        Insert: {
          acao: string
          concluido?: boolean
          created_at?: string
          data_final?: string | null
          data_inicial: string
          descricao?: string | null
          fase: string
          id?: string
          instancia: string
          numero: string
          proximo_prazo?: string | null
          tipo: string
          updated_at?: string
          valor_causa?: number | null
          vara: string
          vencido?: boolean
        }
        Update: {
          acao?: string
          concluido?: boolean
          created_at?: string
          data_final?: string | null
          data_inicial?: string
          descricao?: string | null
          fase?: string
          id?: string
          instancia?: string
          numero?: string
          proximo_prazo?: string | null
          tipo?: string
          updated_at?: string
          valor_causa?: number | null
          vara?: string
          vencido?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area_atuacao: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          oab: string | null
          papel: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area_atuacao?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          oab?: string | null
          papel?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area_atuacao?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          oab?: string | null
          papel?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string | null
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
      current_profile_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_advogado: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "advogado" | "secretaria"
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
      app_role: ["advogado", "secretaria"],
    },
  },
} as const
