export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Vector = number[];

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          property_id: string | null;
          title: string | null;
          source_type: string | null;
          storage_path: string | null;
          pipeline: string | null;
          status: "parsed" | "pending" | "failed";
          parsed_json: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          title?: string | null;
          source_type?: string | null;
          storage_path?: string | null;
          pipeline?: string | null;
          status?: "parsed" | "pending" | "failed";
          parsed_json?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      properties: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          address_line1: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          units: number | null;
          year_built: number | null;
          latitude: number | null;
          longitude: number | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          address_line1?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          units?: number | null;
          year_built?: number | null;
          latitude?: number | null;
          longitude?: number | null;
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
      };
      financial_facts: {
        Row: {
          id: string;
          created_at: string;
          property_id: string;
          document_id: string | null;
          category: string;
          metric: string;
          period_start: string | null;
          period_end: string | null;
          value: number;
          currency: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          property_id: string;
          document_id?: string | null;
          category: string;
          metric: string;
          period_start?: string | null;
          period_end?: string | null;
          value: number;
          currency?: string | null;
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["financial_facts"]["Insert"]>;
      };
      rent_comps: {
        Row: {
          id: string;
          created_at: string;
          property_id: string;
          comp_property_id: string | null;
          comp_name: string;
          distance_miles: number | null;
          effective_rent: number | null;
          occupancy: number | null;
          unit_mix: Json | null;
          source_document_id: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          property_id: string;
          comp_property_id?: string | null;
          comp_name: string;
          distance_miles?: number | null;
          effective_rent?: number | null;
          occupancy?: number | null;
          unit_mix?: Json | null;
          source_document_id?: string | null;
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["rent_comps"]["Insert"]>;
      };
      sales_comps: {
        Row: {
          id: string;
          created_at: string;
          property_id: string;
          comp_property_id: string | null;
          comp_name: string;
          sale_date: string | null;
          price: number | null;
          price_per_unit: number | null;
          cap_rate: number | null;
          source_document_id: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          property_id: string;
          comp_property_id?: string | null;
          comp_name: string;
          sale_date?: string | null;
          price?: number | null;
          price_per_unit?: number | null;
          cap_rate?: number | null;
          source_document_id?: string | null;
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["sales_comps"]["Insert"]>;
      };
      document_embeddings: {
        Row: {
          id: string;
          created_at: string;
          document_id: string;
          chunk_index: number;
          content: string;
          embedding: Vector;
        };
        Insert: {
          id?: string;
          created_at?: string;
          document_id: string;
          chunk_index: number;
          content: string;
          embedding: Vector;
        };
        Update: Partial<Database["public"]["Tables"]["document_embeddings"]["Insert"]>;
      };
    };
    Functions: {
      match_document_embeddings: {
        Args: {
          query_embedding: number[];
          match_limit?: number;
          match_threshold?: number;
        };
        Returns: {
          id: string;
          document_id: string;
          chunk_index: number;
          content: string;
          score: number;
        }[];
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}
