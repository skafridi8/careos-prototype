import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import { clientById } from "../../data/clients";
import { fetchOpenInsightsFeed, fetchRiskScores, formatInsightType, timeAgo } from "../../lib/careData";

const severityColor = { high: "rose", medium: "amber", low: "sage" };
const bandColor = { High: "rose", Medium: "amber", Low: "sage" };

// Prioritized live feed of AI-detected risk insights across all clients,
// shown on the manager dashboard. Reads care_insights/risk_scores directly;
// renders nothing if the Phase 0 schema isn't in place yet.
export default function InsightsFeed() {
  const [insights, setInsights] = useState(null);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchOpenInsightsFeed(), fetchRiskScores()])
      .then(([i, s]) => {
        if (cancelled) return;
        setInsights(i);
        setScores(s);
      })
      .catch((err) => {
        console.warn("Insights feed unavailable:", err.message);
        if (!cancelled) setInsights([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (insights === null || insights.length === 0) return null;

  const top = insights.slice(0, 5);
  const elevated = scores.filter((s) => s.band !== "Low");

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
        </div>
        {elevated.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {elevated.map((s) => (
              <Link key={s.client_id} to={`/app/clients/${s.client_id}`}>
                <Badge color={bandColor[s.band] ?? "brand"}>
                  {clientById(s.client_id)?.name ?? s.client_id} · {s.score}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {top.map((insight) => {
          const client = clientById(insight.client_id);
          return (
            <Link
              key={insight.id}
              to={`/app/clients/${insight.client_id}`}
              className="group flex items-start gap-3 rounded-xl px-2 py-1.5 transition hover:bg-brand-50"
            >
              <Badge color={severityColor[insight.severity] ?? "brand"} className="mt-0.5 shrink-0">
                {insight.severity}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-brand-950">
                  {client?.name ?? insight.client_id}
                  <span className="ml-2 text-xs font-normal text-brand-900/45">
                    {formatInsightType(insight.insight_type)} · {timeAgo(insight.created_at)}
                  </span>
                </div>
                <div className="line-clamp-2 text-xs text-brand-900/55">{insight.description}</div>
              </div>
              <ArrowRight
                size={14}
                className="mt-1 shrink-0 text-brand-300 transition group-hover:text-brand-500"
              />
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
