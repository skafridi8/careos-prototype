import { useCallback, useEffect, useState } from "react";
import { HeartPulse, LogOut, CalendarClock, MessageCircle, NotebookPen, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/layout/ThemeToggle";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import MessageThread from "../../components/family/MessageThread";
import {
  fetchMyFamilyLink,
  fetchTodaysVisits,
  fetchTodaysVisitLogs,
  fetchSharedCareNotes,
  subscribeToFamilyChannel,
  formatClockTime,
} from "../../lib/familyApi";

// Live status of one scheduled visit, derived from today's GPS check-in/out
// events. New visit_logs rows arrive over Realtime, so "arrived" / "completed"
// flips without a page refresh.
function visitStatus(visit, logs, firstName) {
  const mine = logs.filter((l) => l.visit_id === visit.id);
  const checkIns = mine.filter((l) => l.event_type === "check_in");
  const checkOuts = mine.filter((l) => l.event_type === "check_out");
  const needed = visit.requires_two ? 2 : 1;

  if (checkOuts.length >= needed) {
    return { label: "Visit completed", color: "sage", detail: `Carer left at ${new Date(checkOuts.at(-1).recorded_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` };
  }
  if (checkIns.length > 0) {
    return { label: `With ${firstName} now`, color: "amber", detail: `Arrived at ${new Date(checkIns[0].recorded_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`, live: true };
  }
  const now = new Date();
  const [h, m] = visit.scheduled_end.split(":").map(Number);
  const end = new Date();
  end.setHours(h, m, 0, 0);
  if (now > end) {
    return { label: "Not yet logged", color: "rose", detail: "The office has been notified" };
  }
  return { label: "Scheduled", color: "brand", detail: `Expected ${formatClockTime(visit.scheduled_start)}–${formatClockTime(visit.scheduled_end)}` };
}

export default function FamilyPortal() {
  const { profile, signOut } = useAuth();
  const [link, setLink] = useState(undefined); // undefined = loading, null = no link
  const [visits, setVisits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notes, setNotes] = useState(null);

  const client = link?.clients;
  const firstName = client?.name?.split(" ")[0] ?? "your relative";

  const refreshLogs = useCallback(async (visitIds) => {
    try {
      setLogs(await fetchTodaysVisitLogs(visitIds));
    } catch (err) {
      console.error("Failed to load visit logs", err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMyFamilyLink()
      .then(async (data) => {
        if (cancelled) return;
        setLink(data ?? null);
        if (!data) return;
        const c = data.clients;
        if (c?.share_visit_status) {
          const v = await fetchTodaysVisits(data.client_id);
          if (cancelled) return;
          setVisits(v);
          refreshLogs(v.map((x) => x.id));
        }
        if (c?.share_care_notes) {
          fetchSharedCareNotes(data.client_id).then((n) => !cancelled && setNotes(n));
        }
      })
      .catch((err) => {
        console.error("Failed to load family link", err);
        if (!cancelled) setLink(null);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshLogs]);

  // Realtime: a carer checking in/out flips the visit status live.
  useEffect(() => {
    if (!link?.client_id || !link.clients?.share_visit_status) return;
    const visitIds = visits.map((v) => v.id);
    const unsubscribe = subscribeToFamilyChannel({
      clientId: link.client_id,
      onVisitLog: (log) => {
        if (visitIds.includes(log.visit_id)) refreshLogs(visitIds);
      },
    });
    return unsubscribe;
  }, [link, visits, refreshLogs]);

  if (link === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 bg-brand-50/40 text-sm text-brand-900/40">
        <Loader2 size={16} className="animate-spin" /> Loading your portal…
      </div>
    );
  }

  if (link === null) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-brand-50/40 p-6 text-center">
        <HeartPulse size={28} className="text-brand-500" />
        <div className="text-lg font-semibold text-brand-950">No linked client found</div>
        <p className="max-w-sm text-sm text-brand-900/55">
          Your account isn't linked to a client yet. Please contact the care agency and they'll connect
          you to your relative's record.
        </p>
        <button type="button" onClick={signOut} className="mt-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-svh">
      <header className="border-b border-brand-100/70 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-sage-600 text-white shadow-card">
              <HeartPulse size={16} />
            </span>
            <span className="font-bold tracking-tight text-brand-950">tendly</span>
            <Badge color="sage">Family Portal</Badge>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden text-sm text-brand-900/50 sm:block">
              {profile?.full_name} · {link.relationship ?? "Family"} of {client.name}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-5 p-5">
        <div>
          <h1 className="text-2xl font-semibold text-brand-950">How {firstName} is doing</h1>
          <p className="text-sm text-brand-900/50">
            Live updates from {firstName}'s care team — visit status, care updates, and a direct line to the office.
          </p>
        </div>

        <div className="flex flex-wrap gap-5">
          <div className="flex min-w-0 flex-[3] basis-[420px] flex-col gap-5">
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <CalendarClock size={16} className="text-brand-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-900/40">Today's visits</h2>
              </div>
              {!client.share_visit_status ? (
                <div className="text-sm text-brand-900/40">
                  Visit status sharing isn't enabled for your account. Ask the care team to switch it on.
                </div>
              ) : visits.length === 0 ? (
                <div className="text-sm text-brand-900/40">No visits scheduled for today.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {visits.map((v) => {
                    const status = visitStatus(v, logs, firstName);
                    const carerNames = (v.visit_assignments ?? [])
                      .map((a) => a.carers?.name?.split(" ")[0])
                      .filter(Boolean);
                    return (
                      <div key={v.id} className="flex items-start gap-3 rounded-xl border border-brand-100 bg-white p-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-brand-950">
                            {formatClockTime(v.scheduled_start)} · {v.visit_type}
                          </div>
                          <div className="text-xs text-brand-900/50">
                            {carerNames.length ? carerNames.join(" & ") : "Carer being confirmed"}
                            {" — "}
                            {status.detail}
                          </div>
                        </div>
                        <Badge color={status.color} className="shrink-0">
                          {status.live && <span className="mr-0.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />}
                          {status.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <div className="mb-3 flex items-center gap-2">
                <NotebookPen size={16} className="text-sage-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-900/40">Care updates</h2>
              </div>
              {!client.share_care_notes ? (
                <div className="text-sm text-brand-900/40">
                  The care team hasn't enabled care-note sharing for {firstName} yet.
                </div>
              ) : notes === null ? (
                <div className="flex items-center gap-2 text-sm text-brand-900/40">
                  <Loader2 size={14} className="animate-spin" /> Loading updates…
                </div>
              ) : notes.length === 0 ? (
                <div className="text-sm text-brand-900/40">No care updates shared yet.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {notes.map((n) => (
                    <div key={n.id} className="flex gap-2.5 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" />
                      <div>
                        <div className="text-brand-900/80">{n.note}</div>
                        <div className="mt-0.5 text-xs text-brand-900/40">
                          {n.carers?.name ?? "Care team"} ·{" "}
                          {new Date(n.noted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="flex min-w-0 flex-[2] basis-[320px] flex-col gap-5">
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <MessageCircle size={16} className="text-brand-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-900/40">Message the care team</h2>
              </div>
              <MessageThread clientId={link.client_id} senderRole="family" heightClass="h-96" />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
