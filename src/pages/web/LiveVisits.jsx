import { useEffect, useMemo, useState } from "react";
import { MapPin, Radio, LogIn, LogOut, Loader2, ExternalLink } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import { carers, carerById } from "../../data/carers";
import { clientById } from "../../data/clients";
import { fetchTodaysLogs, subscribeToVisitLogInserts } from "../../lib/visitLogsApi";
import RoleTag from "../../components/ui/RoleTag";
import { timeAgo } from "../../lib/careData";

function clock(iso) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function mapsLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

// Current state of one carer, derived from their newest event today:
// an unmatched check_in means they're on that visit right now.
function carerStatus(carerId, logs) {
  const mine = logs.filter((l) => l.carer_id === carerId);
  if (mine.length === 0) return { kind: "idle" };
  const latest = mine[0]; // logs are newest-first
  const clientId = latest.visits?.client_id;
  const client = clientId ? clientById(clientId) : null;
  if (latest.event_type === "check_in") {
    return { kind: "on-visit", client, visitType: latest.visits?.visit_type, since: latest.recorded_at, lat: latest.latitude, lng: latest.longitude };
  }
  return { kind: "between", client, at: latest.recorded_at, lat: latest.latitude, lng: latest.longitude };
}

export default function LiveVisits() {
  const [logs, setLogs] = useState(null);
  const [flashId, setFlashId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchTodaysLogs()
      .then((data) => !cancelled && setLogs(data))
      .catch((err) => {
        console.error("Failed to load visit logs", err);
        if (!cancelled) setLogs([]);
      });
    // Realtime payloads don't include embedded joins, so refetch on insert —
    // still push-driven (no polling), the insert event is just the trigger.
    const unsubscribe = subscribeToVisitLogInserts((log) => {
      if (cancelled) return;
      setFlashId(log.id);
      fetchTodaysLogs().then((data) => !cancelled && setLogs(data));
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const statuses = useMemo(
    () => carers.map((c) => ({ carer: c, status: carerStatus(c.id, logs ?? []) })),
    [logs],
  );
  const onVisitCount = statuses.filter((s) => s.status.kind === "on-visit").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-brand-950">Live visits</h1>
          <p className="text-sm text-brand-900/50">
            Who's where right now — GPS-verified check-ins streaming in from carer phones.
          </p>
        </div>
        <Badge color={onVisitCount > 0 ? "amber" : "brand"}>
          <Radio size={12} className={onVisitCount > 0 ? "animate-pulse" : ""} />
          {onVisitCount > 0 ? `${onVisitCount} carer${onVisitCount === 1 ? "" : "s"} on a visit now` : "Live — listening for check-ins"}
        </Badge>
      </div>

      {logs === null ? (
        <Card className="flex items-center justify-center gap-2 py-10 text-sm text-brand-900/40">
          <Loader2 size={16} className="animate-spin" /> Loading today's activity…
        </Card>
      ) : (
        <div className="flex flex-wrap gap-5">
          <div className="grid min-w-0 flex-[3] basis-[440px] content-start gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {statuses.map(({ carer, status }) => (
              <Card key={carer.id} className="flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <Avatar initials={carer.initials} color={carer.color} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate font-semibold text-brand-950">
                      {carer.name} <RoleTag role="carer" />
                    </div>
                    <div className="text-xs text-brand-900/45">{carer.role}</div>
                  </div>
                </div>

                {status.kind === "on-visit" ? (
                  <>
                    <Badge color="amber">
                      <span className="mr-0.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                      With {status.client?.preferredName ?? "a client"} now
                    </Badge>
                    <div className="text-xs text-brand-900/55">
                      {status.visitType} · arrived {clock(status.since)} ({timeAgo(status.since)})
                    </div>
                  </>
                ) : status.kind === "between" ? (
                  <>
                    <Badge color="sage">Between visits</Badge>
                    <div className="text-xs text-brand-900/55">
                      Left {status.client?.preferredName ?? "last visit"} at {clock(status.at)}
                    </div>
                  </>
                ) : (
                  <>
                    <Badge color="brand">No check-ins yet</Badge>
                    <div className="text-xs text-brand-900/45">Nothing logged today.</div>
                  </>
                )}

                {status.lat != null && (
                  <a
                    href={mapsLink(status.lat, status.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                  >
                    <MapPin size={12} /> Last verified location <ExternalLink size={11} />
                  </a>
                )}
              </Card>
            ))}
          </div>

          <Card className="min-w-0 flex-[2] basis-[300px] self-start">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-900/40">
              Today's check-in stream
            </h2>
            {logs.length === 0 ? (
              <div className="text-sm text-brand-900/40">
                No check-ins yet today. Open the carer phone (view toggle, top right), pick a visit
                and press "Start visit" — it will appear here instantly.
              </div>
            ) : (
              <div className="flex max-h-[520px] flex-col gap-2.5 overflow-y-auto pr-1">
                {logs.map((log) => {
                  const client = log.visits ? clientById(log.visits.client_id) : null;
                  const isIn = log.event_type === "check_in";
                  return (
                    <div
                      key={log.id}
                      className={`flex items-start gap-2.5 rounded-xl p-2 text-sm transition ${
                        flashId === log.id ? "bg-amber-50" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          isIn ? "bg-sage-100 text-sage-600" : "bg-brand-100 text-brand-600"
                        }`}
                      >
                        {isIn ? <LogIn size={13} /> : <LogOut size={13} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-brand-950">
                          {log.carers?.name ?? carerById(log.carer_id)?.name ?? log.carer_id}{" "}
                          <span className="font-normal text-brand-900/55">
                            {isIn ? "arrived at" : "left"} {client?.preferredName ?? "a client"}
                          </span>
                        </div>
                        <div className="text-xs text-brand-900/45">
                          {clock(log.recorded_at)}
                          {log.latitude != null ? " · GPS verified" : " · no location"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
