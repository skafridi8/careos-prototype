import { supabase } from "./supabaseClient";

// Data access for the Analytics dashboards. All numbers come from the
// security_invoker Postgres views created in supabase/phase0-schema.sql
// (care_quality_summary, care_quality_daily, carer_workload) — computed
// server-side from visit_logs / visits / clients / care_insights rows,
// never hardcoded.

export async function fetchQualitySummary() {
  const { data, error } = await supabase.from("care_quality_summary").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

// Daily time series for the trend charts. Excludes today: the current day is
// always mid-flight (visits not yet logged), which would render as a fake dip.
export async function fetchQualityDaily(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("care_quality_daily")
    .select("*")
    .gte("day", since.toISOString().slice(0, 10))
    .lt("day", today)
    .order("day");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCarerWorkload() {
  const { data, error } = await supabase.from("carer_workload").select("*");
  if (error) throw error;
  return data ?? [];
}

// Premium gate: is there an active paid subscription for this agency?
// Reads the customer_subscriptions table maintained by the Stripe webhook
// (RLS: manager select only). 'trialing' counts as active, mirroring Stripe.
export async function fetchSubscriptionStatus() {
  const { data, error } = await supabase
    .from("customer_subscriptions")
    .select("plan, status, current_period_end, email")
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}
