import { useEffect, useState } from "react";
import { AlertTriangle, Clock3, MapPin, Sparkles, Users, X } from "lucide-react";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import { clientById } from "../../data/clients";
import { carerById } from "../../data/carers";
import { statusMeta } from "../../data/visits";
import { skillLabel } from "../../data/rostering";
import { useRoster } from "../../context/RosterContext";
import { suggestCarers, visitZone } from "../../utils/rosterEngine";
import { fetchLiveSuggestionStats } from "../../lib/visitLogsApi";
import { formatDayLabel, formatTime } from "../../utils/dates";

const reasonTone = {
  sage: "bg-sage-50 text-sage-700",
  amber: "bg-amber-50 text-amber-600",
  muted: "bg-brand-50 text-brand-900/50",
};

export default function VisitDrawer() {
  const { selectedVisit: visit, closeVisit, visits, sickCarerIds, analysis, assignCarer, unassignCarer, showToast } = useRoster();
  // 30-day GPS continuity/proximity stats from Supabase, folded into the
  // suggestion ranking. Loaded once; suggestions still work without it.
  const [liveStats, setLiveStats] = useState(null);
  useEffect(() => {
    fetchLiveSuggestionStats()
      .then(setLiveStats)
      .catch((err) => console.warn("Live suggestion stats unavailable:", err.message));
  }, []);
  if (!visit) return null;

  const client = clientById(visit.clientId);
  const status = statusMeta[visit.status];
  const issues = analysis.byVisit.get(visit.id) ?? [];
  const editable = visit.status === "upcoming" || visit.status === "unallocated" || visit.status === "in-progress";
  const slots = visit.requiresTwo ? 2 : 1;
  const canAdd = editable && (visit.carerIds.length < slots || !visit.requiresTwo);
  const suggestions = canAdd ? suggestCarers(visit, visits, sickCarerIds, [], liveStats) : [];

  function handleAssign(carer, match) {
    assignCarer(visit.id, carer.id);
    showToast(`${carer.name} assigned to ${client.preferredName} — ${match}% match ✓`, "sage");
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close" onClick={closeVisit} className="absolute inset-0 bg-brand-950/20" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-brand-100 p-5">
          <div className="flex items-center gap-3">
            <Avatar initials={client.initials} color={client.avatarColor} />
            <div>
              <div className="text-base font-semibold text-brand-950">{client.name}</div>
              <div className="text-xs text-brand-900/50">{visit.type}</div>
            </div>
          </div>
          <button type="button" onClick={closeVisit} className="rounded-lg p-1.5 text-brand-900/40 transition hover:bg-brand-50">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          {/* When & where */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={status.color}>{status.label}</Badge>
            <Badge color="brand">
              {formatDayLabel(visit.start)} · {formatTime(visit.start)}–{formatTime(visit.end)}
            </Badge>
            <Badge color="brand">
              <MapPin size={11} /> {client.location} ({visitZone(visit)})
            </Badge>
          </div>

          {/* Requirements */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-900/40">Visit requirements</h3>
            <div className="flex flex-wrap gap-2">
              {visit.requiresTwo && (
                <Badge color="amber">
                  <Users size={11} /> Double-up — 2 carers
                </Badge>
              )}
              {visit.requiredSkills.map((s) => (
                <Badge key={s} color="brand">
                  {skillLabel(s)}
                </Badge>
              ))}
              {visit.timeCritical && (
                <Badge color="rose">
                  <Clock3 size={11} /> Time-critical ±30 min
                </Badge>
              )}
              {!visit.requiresTwo && !visit.requiredSkills.length && !visit.timeCritical && (
                <span className="text-xs text-brand-900/40">No special requirements</span>
              )}
            </div>
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                <AlertTriangle size={13} /> Needs attention
              </h3>
              <ul className="flex flex-col gap-1.5">
                {issues.map((issue, i) => (
                  <li key={i} className={`text-xs ${issue.severity === "error" ? "text-rose-500" : "text-amber-600"}`}>
                    {issue.severity === "error" ? "● " : "○ "}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Assigned carers */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-900/40">
              Assigned carer{slots > 1 ? "s" : ""} ({visit.carerIds.length}/{slots})
            </h3>
            {visit.carerIds.length === 0 && (
              <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/50 p-3 text-xs text-rose-500">
                No carer assigned — pick an AI suggestion below.
              </div>
            )}
            <div className="flex flex-col gap-2">
              {visit.carerIds.map((id) => {
                const carer = carerById(id);
                return (
                  <div key={id} className="flex items-center gap-2.5 rounded-xl border border-brand-100 p-2.5">
                    <Avatar initials={carer.initials} color={carer.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-brand-950">{carer.name}</div>
                      <div className="text-[11px] text-brand-900/45">
                        {carer.role} · {carer.availabilityLabel}
                      </div>
                    </div>
                    {editable && (
                      <button
                        type="button"
                        onClick={() => {
                          unassignCarer(visit.id, id);
                          showToast(`${carer.name} removed from this visit`, "brand");
                        }}
                        className="rounded-lg px-2 py-1 text-[11px] font-medium text-rose-400 transition hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI suggestions */}
          {editable && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600">
                <Sparkles size={13} /> AI suggested carers
              </h3>
              {!canAdd ? (
                <p className="text-xs text-brand-900/40">Both slots are filled — remove a carer to see swap suggestions.</p>
              ) : suggestions.length === 0 ? (
                <p className="text-xs text-brand-900/40">No conflict-free carers available for this slot.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {suggestions.map(({ carer, match, reasons }, idx) => (
                    <div
                      key={carer.id}
                      className={`rounded-xl border p-3 ${idx === 0 ? "border-amber-200 bg-amber-50/40" : "border-brand-100"}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={carer.initials} color={carer.color} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-brand-950">{carer.name}</span>
                            {idx === 0 && (
                              <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                Best match
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-brand-900/45">{carer.role}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${idx === 0 ? "text-amber-600" : "text-brand-700"}`}>{match}%</div>
                          <button
                            type="button"
                            onClick={() => handleAssign(carer, match)}
                            className="mt-0.5 rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-brand-700"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {reasons.map((r, i) => (
                          <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${reasonTone[r.tone]}`}>
                            {r.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Client context for the scheduler */}
          {client.preferences?.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-900/40">Scheduling preferences</h3>
              <ul className="flex flex-col gap-1">
                {client.preferences.map((p, i) => (
                  <li key={i} className="text-xs text-brand-900/55">
                    · {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
