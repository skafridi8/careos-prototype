import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Pill,
  CalendarX,
  Sparkles,
  Lock,
  Loader2,
  Crown,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import StatCard from "../../components/ui/StatCard";
import {
  fetchQualitySummary,
  fetchQualityDaily,
  fetchCarerWorkload,
  fetchSubscriptionStatus,
} from "../../lib/analyticsApi";

const CHART_COLORS = {
  brand: "#3a84d1",
  sage: "#4f8965",
  amber: "#e19b3d",
  rose: "#dd6d70",
};

const RANGES = [30, 60, 90];

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #dbe9fa",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(33,59,97,0.08)",
};

function scoreTone(score) {
  if (score >= 85) return "sage";
  if (score >= 70) return "brand";
  if (score >= 50) return "amber";
  return "rose";
}

function formatDayTick(day) {
  return new Date(day).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Upgrade prompt shown in place of the premium dashboards when the agency has
// no active subscription — the gate itself is the subscription check against
// the customer_subscriptions table written by the Stripe webhook.
function UpgradePrompt() {
  return (
    <Card className="flex flex-col items-center gap-3 bg-gradient-to-r from-amber-50 to-brand-50 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-white">
        <Lock size={22} />
      </span>
      <div className="text-lg font-semibold text-brand-950">Advanced analytics is a premium feature</div>
      <p className="max-w-md text-sm text-brand-900/60">
        Unlock 90-day care quality trends, staff punctuality and workload analytics, and AI risk
        insights across your whole client base with a Tendly subscription.
      </p>
      <Link
        to="/subscribe"
        className="mt-1 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        <Crown size={15} />
        Upgrade now
      </Link>
    </Card>
  );
}

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState(null);
  const [workload, setWorkload] = useState([]);
  const [subscription, setSubscription] = useState(undefined); // undefined = checking
  const [range, setRange] = useState(30);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchQualitySummary(), fetchCarerWorkload(), fetchSubscriptionStatus()])
      .then(([s, w, sub]) => {
        if (cancelled) return;
        setSummary(s);
        setWorkload(w);
        setSubscription(sub);
      })
      .catch((err) => {
        console.error("Failed to load analytics", err);
        if (!cancelled) {
          setError("Couldn't load analytics. Check the Phase 0 schema has been applied in Supabase.");
          setSubscription(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Real date-filtered query per range — not a client-side slice of one dataset.
  useEffect(() => {
    let cancelled = false;
    setDaily(null);
    fetchQualityDaily(range)
      .then((d) => !cancelled && setDaily(d))
      .catch((err) => console.error("Failed to load daily series", err));
    return () => {
      cancelled = true;
    };
  }, [range]);

  const subscribed = Boolean(subscription);
  const maxHours = Math.max(1, ...workload.map((w) => Number(w.scheduled_hours_30d) || 0));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-brand-950">Analytics</h1>
          <p className="text-sm text-brand-900/50">
            Care quality, staff performance and compliance — computed live from visit logs, care
            notes and AI insights.
          </p>
        </div>
        {subscription && (
          <Badge color="sage">
            <Crown size={12} /> Premium active · {subscription.plan} plan
          </Badge>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-500">{error}</div>
      )}

      {summary && (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
          <StatCard
            label="Care Quality Score"
            value={summary.care_quality_score}
            sublabel="Weighted from completion, punctuality, med logging, reviews & risk"
            tone={scoreTone(summary.care_quality_score)}
            icon={BarChart3}
          />
          <StatCard
            label="Visit completion"
            value={`${summary.completion_pct}%`}
            sublabel="Last 30 days"
            tone="brand"
            icon={CheckCircle2}
          />
          <StatCard
            label="On-time arrivals"
            value={`${summary.on_time_pct}%`}
            sublabel="Within 15 min of schedule"
            tone={summary.on_time_pct >= 85 ? "sage" : "amber"}
            icon={Clock3}
          />
          <StatCard
            label="Medication logging"
            value={`${summary.medication_log_pct}%`}
            sublabel="Med visits with a logged call"
            tone="brand"
            icon={Pill}
          />
          <StatCard
            label="Overdue plan reviews"
            value={summary.overdue_plan_reviews}
            sublabel={`of ${summary.total_clients} clients`}
            tone={summary.overdue_plan_reviews > 0 ? "rose" : "sage"}
            icon={CalendarX}
          />
          <StatCard
            label="Open risk insights"
            value={summary.open_insights}
            sublabel={`${summary.open_high_insights} high severity`}
            tone={summary.open_high_insights > 0 ? "amber" : "sage"}
            icon={Sparkles}
          />
        </div>
      )}

      {subscription === undefined ? (
        <Card className="flex items-center justify-center gap-2 py-10 text-sm text-brand-900/40">
          <Loader2 size={16} className="animate-spin" /> Loading dashboards…
        </Card>
      ) : !subscribed ? (
        <UpgradePrompt />
      ) : (
        <>
          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-900/40">
                Care quality trend
              </h2>
              <div className="flex gap-1.5">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      range === r
                        ? "bg-brand-600 text-white"
                        : "bg-brand-50 text-brand-900/60 hover:bg-brand-100"
                    }`}
                  >
                    {r} days
                  </button>
                ))}
              </div>
            </div>
            {daily === null ? (
              <div className="flex h-64 items-center justify-center gap-2 text-sm text-brand-900/40">
                <Loader2 size={16} className="animate-spin" /> Loading trend…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={daily} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe9fa" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={formatDayTick}
                    tick={{ fontSize: 11, fill: "#213b61aa" }}
                    minTickGap={30}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#213b61aa" }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={formatDayTick} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="completion_pct" name="Completion %" stroke={CHART_COLORS.brand} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="on_time_pct" name="On time %" stroke={CHART_COLORS.sage} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="medication_log_pct" name="Med logging %" stroke={CHART_COLORS.amber} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          <div className="flex flex-wrap gap-5">
            <Card className="min-w-0 flex-[3] basis-[420px]">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-900/40">
                Visits & punctuality by carer (30 days)
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={workload} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe9fa" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(n) => n.split(" ")[0]}
                    tick={{ fontSize: 11, fill: "#213b61aa" }}
                  />
                  <YAxis yAxisId="visits" tick={{ fontSize: 11, fill: "#213b61aa" }} />
                  <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: "#213b61aa" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="visits" dataKey="visits_30d" name="Visits" fill={CHART_COLORS.brand} radius={[6, 6, 0, 0]} maxBarSize={38} />
                  <Line yAxisId="pct" type="monotone" dataKey="on_time_pct" name="On time %" stroke={CHART_COLORS.amber} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            <Card className="min-w-0 flex-[2] basis-[300px]">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-900/40">
                Workload balance (scheduled hours, 30 days)
              </h2>
              <div className="flex flex-col gap-2.5">
                {workload.map((w) => {
                  const hours = Number(w.scheduled_hours_30d) || 0;
                  return (
                    <div key={w.carer_id} className="text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-brand-950">{w.name}</span>
                        <span className="text-xs text-brand-900/50">{hours}h</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-brand-50">
                        <div
                          className="h-full rounded-full bg-brand-400"
                          style={{ width: `${(hours / maxHours) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-brand-900/45">
                A wide spread here means visits are unevenly distributed — use the AI auto-allocator
                on the Roster to rebalance.
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
