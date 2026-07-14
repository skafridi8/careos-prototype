import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarDays, Clock4, List, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { statusMeta } from "../../data/visits";
import { clientById } from "../../data/clients";
import { carerById } from "../../data/carers";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { useRoster } from "../../context/RosterContext";
import RosterKpis from "../../components/roster/RosterKpis";
import DayTimeline from "../../components/roster/DayTimeline";
import WeekCalendar from "../../components/roster/WeekCalendar";
import VisitDrawer from "../../components/roster/VisitDrawer";
import PublishBar from "../../components/roster/PublishBar";
import Toast from "../../components/roster/Toast";
import CarerRequestsPanel from "../../components/roster/CarerRequestsPanel";
import { formatDayLabel, formatTime } from "../../utils/dates";

const views = [
  { id: "day", label: "Day timeline", icon: Clock4 },
  { id: "week", label: "Week", icon: CalendarDays },
  { id: "list", label: "Visit list", icon: List },
];

const statusFilters = [
  { id: "all", label: "All" },
  { id: "unallocated", label: "Unallocated" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "missed", label: "Missed" },
];

function AttentionPanel() {
  const { analysis, visits, openVisit } = useRoster();
  const entries = [];
  for (const [visitId, issues] of analysis.byVisit) {
    const visit = visits.find((v) => v.id === visitId);
    for (const issue of issues) {
      entries.push({ visit, issue });
    }
  }

  if (entries.length === 0) {
    return (
      <Card className="flex items-center gap-3 bg-sage-50 !py-3">
        <ShieldCheck size={18} className="shrink-0 text-sage-600" />
        <span className="text-sm text-sage-800">
          <span className="font-semibold">No conflicts detected.</span> Every visit is covered, qualified and clash-free — safe to publish.
        </span>
      </Card>
    );
  }

  entries.sort((a, b) => (a.issue.severity === b.issue.severity ? a.visit.start - b.visit.start : a.issue.severity === "error" ? -1 : 1));
  const shown = entries.slice(0, 5);

  return (
    <Card padded={false} className="border-amber-200">
      <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50/60 px-4 py-2.5 rounded-t-2xl">
        <AlertTriangle size={15} className="text-amber-600" />
        <span className="text-sm font-semibold text-amber-700">
          {entries.length} item{entries.length === 1 ? " needs" : "s need"} attention before publishing
        </span>
      </div>
      <ul className="divide-y divide-brand-50">
        {shown.map(({ visit, issue }, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${issue.severity === "error" ? "bg-rose-400" : "bg-amber-400"}`} />
            <span className="min-w-0 flex-1 truncate text-sm text-brand-900/70">
              <span className="font-medium text-brand-950">
                {formatDayLabel(visit.start)} {formatTime(visit.start)}
              </span>{" "}
              — {issue.message}
            </span>
            <button
              type="button"
              onClick={() => openVisit(visit.id)}
              className="shrink-0 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100"
            >
              Resolve
            </button>
          </li>
        ))}
        {entries.length > shown.length && (
          <li className="px-4 py-2 text-xs text-brand-900/40">+ {entries.length - shown.length} more — resolve the items above first</li>
        )}
      </ul>
    </Card>
  );
}

function VisitListView() {
  const { visits, analysis, openVisit } = useRoster();
  const [statusFilter, setStatusFilter] = useState("all");

  const sorted = [...visits].sort((a, b) => a.start.getTime() - b.start.getTime());
  const filtered = statusFilter === "all" ? sorted : sorted.filter((v) => v.status === statusFilter);

  return (
    <Card padded={false}>
      <div className="flex flex-wrap gap-2 border-b border-brand-100 p-4">
        {statusFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              statusFilter === f.id ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-900/60 hover:bg-brand-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-brand-900/40">
            <th className="px-4 py-3 font-medium">Date & time</th>
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Carer(s)</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Flags</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((v) => {
            const client = clientById(v.clientId);
            const status = statusMeta[v.status];
            const issues = analysis.byVisit.get(v.id) ?? [];
            const hasError = issues.some((i) => i.severity === "error");
            return (
              <tr key={v.id} onClick={() => openVisit(v.id)} className="cursor-pointer border-t border-brand-50 transition hover:bg-brand-50/50">
                <td className="px-4 py-3 text-brand-900/70">
                  {formatDayLabel(v.start)}, {formatTime(v.start)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/app/clients/${client.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-brand-950 hover:underline"
                  >
                    {client.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-brand-900/70">
                  {v.carerIds.length === 0 ? (
                    <span className="font-medium text-rose-400">Unassigned</span>
                  ) : (
                    v.carerIds.map((id) => carerById(id)?.name).join(" & ")
                  )}
                  {v.doubleUp && <Badge color="amber" className="ml-2">Double-up</Badge>}
                </td>
                <td className="px-4 py-3 text-brand-900/70">{v.type}</td>
                <td className="px-4 py-3">
                  <Badge color={status.color}>{status.label}</Badge>
                </td>
                <td className="px-4 py-3">
                  {issues.length > 0 && (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${hasError ? "text-rose-500" : "text-amber-600"}`}>
                      <AlertTriangle size={13} /> {issues.length}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

export default function Roster() {
  const [view, setView] = useState("day");
  const { autoAllocate, resetDemo, metrics } = useRoster();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-brand-950">Rostering</h1>
          <p className="text-sm text-brand-900/50">
            AI-assisted scheduling on the same shared record as Care Planning and Compliance.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={autoAllocate}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white shadow-sm transition ${
              metrics.unallocated > 0 ? "bg-amber-400 hover:bg-amber-500" : "bg-amber-300 hover:bg-amber-400"
            }`}
            title="Let the AI fill every uncovered visit with the best conflict-free carer"
          >
            <Sparkles size={15} />
            AI auto-fix
            {metrics.unallocated > 0 && (
              <span className="rounded-full bg-white/25 px-1.5 text-xs font-semibold">{metrics.unallocated}</span>
            )}
          </button>
          <button
            type="button"
            onClick={resetDemo}
            title="Reset the demo data"
            className="rounded-xl border border-brand-100 bg-white p-2 text-brand-900/50 transition hover:bg-brand-50"
          >
            <RotateCcw size={15} />
          </button>
          <div className="inline-flex items-center gap-1 rounded-full bg-brand-100/70 p-1">
            {views.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  view === v.id ? "bg-white text-brand-800 shadow-sm" : "text-brand-900/50"
                }`}
              >
                <v.icon size={15} />
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <RosterKpis />
      <AttentionPanel />
      <CarerRequestsPanel />

      {view === "day" && <DayTimeline />}
      {view === "week" && <WeekCalendar />}
      {view === "list" && <VisitListView />}

      <PublishBar />
      <VisitDrawer />
      <Toast />
    </div>
  );
}
