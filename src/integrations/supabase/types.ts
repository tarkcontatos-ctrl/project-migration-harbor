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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agendamento_itens: {
        Row: {
          agendamento_id: string
          id: string
          preco_unitario: number
          quantidade: number
          servico_id: string
          servico_nome: string
          subtotal: number | null
        }
        Insert: {
          agendamento_id: string
          id?: string
          preco_unitario: number
          quantidade?: number
          servico_id: string
          servico_nome: string
          subtotal?: number | null
        }
        Update: {
          agendamento_id?: string
          id?: string
          preco_unitario?: number
          quantidade?: number
          servico_id?: string
          servico_nome?: string
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_itens_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_itens_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamentos: {
        Row: {
          cancelado_em: string | null
          concluido_em: string | null
          criado_em: string
          data_hora: string
          estornado_em: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          local: string
          motivo_estorno: string | null
          status: Database["public"]["Enums"]["agendamento_status"]
          usuario_id: string
          valor_total: number
          veiculo_id: string | null
        }
        Insert: {
          cancelado_em?: string | null
          concluido_em?: string | null
          criado_em?: string
          data_hora: string
          estornado_em?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          local?: string
          motivo_estorno?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"]
          usuario_id: string
          valor_total?: number
          veiculo_id?: string | null
        }
        Update: {
          cancelado_em?: string | null
          concluido_em?: string | null
          criado_em?: string
          data_hora?: string
          estornado_em?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          local?: string
          motivo_estorno?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"]
          usuario_id?: string
          valor_total?: number
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_veiculo_id_usuario_id_fkey"
            columns: ["veiculo_id", "usuario_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id", "usuario_id"]
          },
        ]
      }
      google_password_setup: {
        Row: {
          completed_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_password_setup_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_financeiros: {
        Row: {
          agendamento_id: string
          cliente_id: string
          competencia: string
          criado_em: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: number
          item_id: string
          motivo: string | null
          quantidade: number
          registrado_por: string | null
          servico_id: string
          servico_nome: string
          tipo: Database["public"]["Enums"]["lancamento_tipo"]
          valor: number
        }
        Insert: {
          agendamento_id: string
          cliente_id: string
          competencia: string
          criado_em?: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id?: never
          item_id: string
          motivo?: string | null
          quantidade: number
          registrado_por?: string | null
          servico_id: string
          servico_nome: string
          tipo: Database["public"]["Enums"]["lancamento_tipo"]
          valor: number
        }
        Update: {
          agendamento_id?: string
          cliente_id?: string
          competencia?: string
          criado_em?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: never
          item_id?: string
          motivo?: string | null
          quantidade?: number
          registrado_por?: string | null
          servico_id?: string
          servico_nome?: string
          tipo?: Database["public"]["Enums"]["lancamento_tipo"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_financeiros_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "agendamento_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          criado_em: string
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          criado_em?: string
          id: string
          nome: string
          telefone?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      servicos: {
        Row: {
          ativo: boolean
          descricao: string | null
          duracao_min: number
          id: string
          nome: string
          preco: number
          slug: string
        }
        Insert: {
          ativo?: boolean
          descricao?: string | null
          duracao_min: number
          id?: string
          nome: string
          preco: number
          slug: string
        }
        Update: {
          ativo?: boolean
          descricao?: string | null
          duracao_min?: number
          id?: string
          nome?: string
          preco?: number
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          id: string
          modelo: string
          placa: string
          usuario_id: string
        }
        Insert: {
          id?: string
          modelo: string
          placa: string
          usuario_id: string
        }
        Update: {
          id?: string
          modelo?: string
          placa?: string
          usuario_id?: string
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
      needs_google_password: { Args: never; Returns: boolean }
    }
    Enums: {
      agendamento_status: "agendado" | "concluido" | "cancelado" | "estornado"
      app_role: "cliente" | "funcionario" | "financeiro"
      forma_pagamento: "pix" | "dinheiro" | "cartao_credito" | "cartao_debito"
      lancamento_tipo: "receita" | "estorno"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      agendamento_status: ["agendado", "concluido", "cancelado", "estornado"],
      app_role: ["cliente", "funcionario", "financeiro"],
      forma_pagamento: ["pix", "dinheiro", "cartao_credito", "cartao_debito"],
      lancamento_tipo: ["receita", "estorno"],
    },
  },
} as const
