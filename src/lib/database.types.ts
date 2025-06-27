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
      clients: {
        Row: {
          address: string | null
          company_name: string
          contact_name: string | null
          created_at: string | null
          email: string
          freelancer_id: string
          id: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string | null
          email: string
          freelancer_id: string
          id?: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string | null
          email?: string
          freelancer_id?: string
          id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          }
        ]
      }
      freelancers: {
        Row: {
          address: string
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          website: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          website?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          rate: number
        }
        Insert: {
          amount?: number
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          rate?: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          }
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string | null
          date_issued: string
          due_date: string
          freelancer_id: string
          id: string
          invoice_number: string
          notes: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date_issued: string
          due_date: string
          freelancer_id: string
          id?: string
          invoice_number: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date_issued?: string
          due_date?: string
          freelancer_id?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          }
        ]
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