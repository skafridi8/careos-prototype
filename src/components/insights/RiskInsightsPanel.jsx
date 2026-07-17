import { useCallback, useEffect, useState } from "react";
import { Sparkles, Loader2, Check, RefreshCw } from "lucide-react";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import { useAuth } from "../../context/AuthContext";
import {
  fetchClientInsights,
  fetchRiskScore,
  generateInsights,
  resolveInsight,
  formatInsightType,
  timeAgo,
} from "../../lib/careData";

const severityColor = { high: "rose", medium: "amber", low: "sage" };
const bandColor = { High: "rose", Medium: "amber", Low: "sage" };

const FACTOR_LABELS = {
  open_high_insights: "high-severity insights",
  open_medium_insights: "medium insights",
  open_low_insights: "low insights",
  missed_visits_14d: "missed visits (14d)",
  medication_issues: "medication issues",
};

function factorSummary(factors) {
  if (!factors) return null;
  const parts = Object.entries(FACTOR_LABELS)
    .filter(([key]) => factors[key] > 0)
    .map(([key, label]) => `${factors[key]} ${label}`);
  return parts.length ? parts.join(" · ") : "no active risk factors";
}

export default function RiskInsightsPanel({ clientId, clientName }) {
  const { isManager } = useAuth();
  const [insights, setInsights] = useState(null); // null = loading
  const [riskScore, setRiskScore] = useState(null);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [i, s] = await Promise.all([fetchClientInsights(clientId), fetchRiskScore(clientId)]);
      setInsights(i);
      setRiskScore(s);
      setError(null);
    } catch (err) {
      console.error("Failed to load care insights", err);
      setError("Couldn't load risk insights. Check the Phase 0 schema has been applied in Supabase.");
      setInsights([]);
    }
  }, [clientId]);

  useEffect(() => {
    setInsights(null);
    load();
  }, [load]);

  async function onGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateInsights(clientId);
      setInsights(result.insights ?? []);
      setRiskScore(result.riskScore ?? null);
    } catch (err) {
      console.error("Insight generation failed", err);
      setError(err.message || "AI analysis failed, please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function onResolve(id) {
    setResolvingId(id);
    try {
      await resolveInsight(id);
      await load();
    } catch (err) {
      console.error("Failed to resolve insight", err);
      setError("Couldn't resolve that insight, please try again.");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-white">
            <Sparkles size={14} />
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-900/40">
            AI Risk &amp; Insights
          </h2>
          {riskScore && (
            <Badge color={bandColor[riskScore.band] ?? "brand"}>
              Risk score {riskScore.score}/100 · {riskScore.band}
            </Badge>
          )}
        </div>
        {isManager && (
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {generating ? "Analysing notes…" : "Re-run AI analysis"}
          </button>
        )}
      </div>

      {riskScore?.factors && (
        <div className="mb-3 text-xs text-brand-900/45">
          Score based on: {factorSummary(riskScore.factors)} · updated {timeAgo(riskScore.updated_at)}
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-xl bg-rose-100 px-3 py-2 text-xs font-medium text-rose-500">{error}</div>
      )}

      {insights === null ? (
        <div className="flex items-center gap-2 py-2 text-sm text-brand-900/40">
          <Loader2 size={14} className="animate-spin" /> Loading insights…
        </div>
      ) : insights.length === 0 ? (
        <div className="py-1 text-sm text-brand-900/40">
          No open risk insights for {clientName ?? "this client"}.
          {isManager && " Run the AI analysis to scan their recent care notes."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {insights.map((insight) => (
            <div key={insight.id} className="flex items-start gap-3">
              <Badge color={severityColor[insight.severity] ?? "brand"} className="mt-0.5 shrink-0">
                {insight.severity}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-brand-950">
                  {formatInsightType(insight.insight_type)}
                  <span className="ml-2 text-xs font-normal text-brand-900/40">{timeAgo(insight.created_at)}</span>
                </div>
                <div className="text-xs text-brand-900/55">{insight.description}</div>
              </div>
              {isManager && (
                <button
                  type="button"
                  onClick={() => onResolve(insight.id)}
                  disabled={resolvingId === insight.id}
                  title="Mark as resolved"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-semibold text-sage-700 transition hover:bg-sage-200 disabled:opacity-60"
                >
                  {resolvingId === insight.id ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Check size={11} />
                  )}
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
