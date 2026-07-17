import { supabase } from "./supabaseClient";

// Data access for the AI Care Insights feature (care_insights + risk_scores,
// created by supabase/phase0-schema.sql). All reads go through the logged-in
// user's session, so RLS decides what each role can see.

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

export function sortBySeverity(insights) {
  return [...insights].sort(
    (a, b) =>
      (SEVERITY_RANK[a.severity] ?? 3) - (SEVERITY_RANK[b.severity] ?? 3) ||
      new Date(b.created_at) - new Date(a.created_at),
  );
}

export function formatInsightType(type) {
  if (!type) return "Insight";
  const label = type.replaceAll("_", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function timeAgo(iso) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export async function fetchClientInsights(clientId) {
  const { data, error } = await supabase
    .from("care_insights")
    .select("*")
    .eq("client_id", clientId)
    .eq("resolved", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return sortBySeverity(data ?? []);
}

export async function fetchRiskScore(clientId) {
  const { data, error } = await supabase
    .from("risk_scores")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchOpenInsightsFeed(limit = 30) {
  const { data, error } = await supabase
    .from("care_insights")
    .select("*")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return sortBySeverity(data ?? []);
}

export async function fetchRiskScores() {
  const { data, error } = await supabase
    .from("risk_scores")
    .select("*")
    .order("score", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function resolveInsight(insightId) {
  const { error } = await supabase
    .from("care_insights")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", insightId);
  if (error) throw error;
  // Recompute scores so the panel reflects the resolution immediately.
  await supabase.rpc("refresh_risk_scores");
}

// Kick off the server-side Groq analysis of a client's care notes.
export async function generateInsights(clientId) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const res = await fetch("/api/insights/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ clientId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Insight generation failed");
  return body;
}

// Executor for the chatbot's query_care_data tool. Runs with the logged-in
// user's own session, so the assistant can only surface rows the user's role
// is allowed to read under RLS.
export async function executeCareDataQuery(args, { clientNameById } = {}) {
  const nameOf = (id) => clientNameById?.(id) ?? id;

  switch (args.query_type) {
    case "risk_overview": {
      const [scores, insights] = await Promise.all([fetchRiskScores(), fetchOpenInsightsFeed(50)]);
      const openByClient = insights.reduce((acc, i) => {
        acc[i.client_id] = (acc[i.client_id] || 0) + 1;
        return acc;
      }, {});
      const lines = scores.map(
        (s) =>
          `${nameOf(s.client_id)}: risk ${s.score}/100 (${s.band}), ${openByClient[s.client_id] || 0} open insights`,
      );
      return lines.length ? `Current risk overview:\n${lines.join("\n")}` : "No risk scores recorded yet.";
    }
    case "client_insights": {
      if (!args.clientId) return "clientId is required for client_insights.";
      const [insights, score] = await Promise.all([
        fetchClientInsights(args.clientId),
        fetchRiskScore(args.clientId),
      ]);
      const header = score
        ? `Risk score for ${nameOf(args.clientId)}: ${score.score}/100 (${score.band}). Factors: ${JSON.stringify(score.factors)}.`
        : `No risk score recorded for ${nameOf(args.clientId)}.`;
      const lines = insights.map(
        (i) => `- [${i.severity}] ${formatInsightType(i.insight_type)}: ${i.description}`,
      );
      return `${header}\nOpen insights:\n${lines.length ? lines.join("\n") : "none"}`;
    }
    case "recent_notes": {
      if (!args.clientId) return "clientId is required for recent_notes.";
      const { data, error } = await supabase
        .from("care_notes")
        .select("note, noted_at, carer_id")
        .eq("client_id", args.clientId)
        .order("noted_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      if (!data?.length) return `No care notes recorded for ${nameOf(args.clientId)}.`;
      return `Most recent care notes for ${nameOf(args.clientId)}:\n${data
        .map((n) => `- ${new Date(n.noted_at).toLocaleDateString("en-GB")}: ${n.note}`)
        .join("\n")}`;
    }
    default:
      return `Unknown query_type: ${args.query_type}`;
  }
}
