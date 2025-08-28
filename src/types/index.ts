
import { Database } from "@/integrations/supabase/types";

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Site = Database['public']['Tables']['sites']['Row'];
export type SiteConfig = Database['public']['Tables']['site_configs']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
