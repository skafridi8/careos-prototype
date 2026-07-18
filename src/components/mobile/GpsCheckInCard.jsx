import { useEffect, useState } from "react";
import { MapPin, LogIn, LogOut, Loader2, CheckCircle2, Users2 } from "lucide-react";
import { carerById } from "../../data/carers";
import {
  logVisitEvent,
  fetchTodaysLogsForVisit,
  subscribeToVisitLogInserts,
} from "../../lib/visitLogsApi";

function clock(iso) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Real GPS visit verification on the carer's phone. Start/End request browser
 * geolocation and write genuine check_in/check_out rows to visit_logs — the
 * office live board and the family portal react to the same inserts over
 * Realtime. On a double-up visit each carer logs independently: this card only
 * ever writes rows for the current carer, and shows the partner's state.
 */
export default function GpsCheckInCard({ visit, currentCarerId }) {
  const [logs, setLogs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchTodaysLogsForVisit(visit.id)
      .then((data) => !cancelled && setLogs(data))
      .catch((err) => {
        console.error("Failed to load visit logs", err);
        if (!cancelled) setLogs([]);
      });
    const unsubscribe = subscribeToVisitLogInserts((log) => {
      if (cancelled || log.visit_id !== visit.id) return;
      setLogs((prev) => (prev?.some((l) => l.id === log.id) ? prev : [...(prev ?? []), log]));
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [visit.id]);

  const mine = (logs ?? []).filter((l) => l.carer_id === currentCarerId);
  const myCheckIn = mine.find((l) => l.event_type === "check_in");
  const myCheckOut = mine.find((l) => l.event_type === "check_out");
  const partnerLogs = (logs ?? []).filter((l) => l.carer_id !== currentCarerId);

  async function log(eventType) {
    setBusy(true);
    setError(null);
    try {
      const row = await logVisitEvent({ visitId: visit.id, carerId: currentCarerId, eventType });
      setLogs((prev) => (prev?.some((l) => l.id === row.id) ? prev : [...(prev ?? []), row]));
    } catch (err) {
      console.error("Check-in failed", err);
      setError("Couldn't record that — check you're signed in and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-3.5">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-900/40">
        <MapPin size={13} className="text-brand-500" /> GPS visit verification
      </div>

      {logs === null ? (
        <div className="flex items-center gap-2 py-1 text-sm text-brand-900/40">
          <Loader2 size={14} className="animate-spin" /> Checking today's record…
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {myCheckIn && (
            <div className="flex items-center gap-2 text-xs text-sage-700">
              <CheckCircle2 size={14} className="shrink-0 text-sage-500" />
              Checked in {clock(myCheckIn.recorded_at)}
              {myCheckIn.latitude != null ? " · location verified" : " · location unavailable"}
              {myCheckOut && ` — checked out ${clock(myCheckOut.recorded_at)}`}
            </div>
          )}

          {visit.requiresTwo && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
              <Users2 size={14} className="mt-0.5 shrink-0 text-amber-600" />
              <span>
                {partnerLogs.length === 0
                  ? "Your partner hasn't checked in yet — you can still log independently."
                  : partnerLogs
                      .map(
                        (l) =>
                          `${carerById(l.carer_id)?.name.split(" ")[0] ?? "Partner"} ${
                            l.event_type === "check_in" ? "checked in" : "checked out"
                          } ${clock(l.recorded_at)}`,
                      )
                      .join(" · ")}
              </span>
            </div>
          )}

          {error && <div className="text-xs font-medium text-rose-500">{error}</div>}

          {!myCheckIn ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => log("check_in")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-sage-600 py-2.5 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
              {busy ? "Getting your location…" : "Start visit (GPS check-in)"}
            </button>
          ) : !myCheckOut ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => log("check_out")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
              {busy ? "Getting your location…" : "End visit (GPS check-out)"}
            </button>
          ) : (
            <div className="rounded-2xl bg-sage-50 py-2.5 text-center text-sm font-semibold text-sage-700">
              Visit record complete ✓
            </div>
          )}

          <div className="text-[11px] text-brand-900/35">
            Your check-in is timestamped with your location and appears instantly on the office live
            board{visit.requiresTwo ? " — each carer on a double-up logs their own record" : ""}.
          </div>
        </div>
      )}
    </div>
  );
}
