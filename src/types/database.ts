/**
 * Hand-authored mirror of the Supabase schema (migrations 0001/0002).
 *
 * After you link a real project, regenerate the canonical version with:
 *   npm run types:gen
 * which runs `supabase gen types typescript --linked`.
 */

export type PlanTier = "free_tier" | "premium_ad_free" | "creator_multistream_saas";
export type BillingStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          is_premium_viewer: boolean;
          is_creator: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          is_premium_viewer?: boolean;
          is_creator?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      stream_configs: {
        Row: {
          id: string;
          creator_id: string;
          stream_key: string;
          livepeer_stream_id: string | null;
          playback_id: string | null;
          is_live: boolean;
          multistream_enabled: boolean;
          twitch_target_url: string | null;
          youtube_target_url: string | null;
          tiktok_target_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          stream_key: string;
          livepeer_stream_id?: string | null;
          playback_id?: string | null;
          is_live?: boolean;
          multistream_enabled?: boolean;
          twitch_target_url?: string | null;
          youtube_target_url?: string | null;
          tiktok_target_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["stream_configs"]["Insert"]>;
      };
      billing_ledger: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan_tier: PlanTier;
          status: BillingStatus;
          current_period_end: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_tier?: PlanTier;
          status?: BillingStatus;
          current_period_end?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["billing_ledger"]["Insert"]>;
      };
      commerce_listings: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          image_url: string | null;
          price_cents: number;
          currency: string;
          stripe_price_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          image_url?: string | null;
          price_cents: number;
          currency?: string;
          stripe_price_id?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["commerce_listings"]["Insert"]>;
      };
    };
    Views: {
      public_streams: {
        Row: {
          creator_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          playback_id: string | null;
          is_live: boolean;
          updated_at: string;
        };
      };
    };
  };
}
