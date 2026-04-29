export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          iyzico_customer_ref: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          iyzico_customer_ref?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          iyzico_customer_ref?: string | null;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          status: string;
          iyzico_subscription_ref: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: string;
          status?: string;
          iyzico_subscription_ref?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: string;
          status?: string;
          iyzico_subscription_ref?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      scans: {
        Row: {
          id: string;
          user_id: string;
          domain: string;
          status: string;
          score: number | null;
          findings: Json;
          raw_payload: Json | null;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          domain: string;
          status: string;
          score?: number | null;
          findings?: Json;
          raw_payload?: Json | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          domain?: string;
          status?: string;
          score?: number | null;
          findings?: Json;
          raw_payload?: Json | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
    };
  };
}
