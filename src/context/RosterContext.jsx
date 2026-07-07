import { createContext, useCallback, useContext, useMemo, useReducer, useRef, useState } from "react";
import { visits as initialVisits, isSameDate } from "../data/visits";
import { carerById } from "../data/carers";
import { clientById } from "../data/clients";
import { formatDayLabel, formatTime } from "../utils/dates";
import {
  analyseRota,
  continuityPercent,
  needsAllocation,
  planAutoAllocation,
  utilisationPercent,
  withAssignment,
  withoutCarer,
} from "../utils/rosterEngine";

const RosterContext = createContext(null);

const initialState = {
  visits: initialVisits, // office working copy (what the coordinator edits)
  publishedVisits: initialVisits, // snapshot the carers' phones show
  sickCarerIds: [],
  changeLog: [],
  lastPublishedAt: Date.now(),
  publishBump: 0, // increments on every publish so the mobile app can react
};

let logId = 0;
function logEntry(text, tone = "brand") {
  return { id: `log-${++logId}`, text, tone };
}

// Which visits changed assignment/status between two rota snapshots.
function changedBetween(prev, next) {
  const key = (v) => `${[...v.carerIds].sort().join(",")}|${v.status}`;
  const prevMap = new Map(prev.map((v) => [v.id, key(v)]));
  return next.filter((v) => prevMap.get(v.id) !== key(v)).map((v) => v.id);
}

function visitLabel(visit) {
  return `${clientById(visit.clientId).name} · ${formatDayLabel(visit.start)} ${formatTime(visit.start)}`;
}

function reducer(state, action) {
  switch (action.type) {
    case "assign": {
      const { visitId, carerId, replaceCarerId } = action;
      const visit = state.visits.find((v) => v.id === visitId);
      const carer = carerById(carerId);
      const text = replaceCarerId
        ? `${visitLabel(visit)} — reassigned from ${carerById(replaceCarerId).name} to ${carer.name}`
        : `${visitLabel(visit)} — assigned to ${carer.name}`;
      return {
        ...state,
        visits: withAssignment(state.visits, visitId, carerId, replaceCarerId),
        changeLog: [...state.changeLog, logEntry(text)],
      };
    }
    case "unassign": {
      const { visitId, carerId } = action;
      const visit = state.visits.find((v) => v.id === visitId);
      return {
        ...state,
        visits: withoutCarer(state.visits, visitId, carerId),
        changeLog: [...state.changeLog, logEntry(`${visitLabel(visit)} — ${carerById(carerId).name} removed`, "rose")],
      };
    }
    case "mark-sick": {
      const { carerId } = action;
      const carer = carerById(carerId);
      let affected = 0;
      const visits = state.visits.map((v) => {
        if (v.status !== "upcoming" || !v.carerIds.includes(carerId)) return v;
        affected++;
        const carerIds = v.carerIds.filter((id) => id !== carerId);
        return { ...v, carerIds, status: carerIds.length === 0 ? "unallocated" : v.status };
      });
      return {
        ...state,
        visits,
        sickCarerIds: [...state.sickCarerIds, carerId],
        changeLog: [
          ...state.changeLog,
          logEntry(`${carer.name} marked off sick — ${affected} upcoming visit${affected === 1 ? "" : "s"} need cover`, "rose"),
        ],
      };
    }
    case "mark-fit": {
      const carer = carerById(action.carerId);
      return {
        ...state,
        sickCarerIds: state.sickCarerIds.filter((id) => id !== action.carerId),
        changeLog: [...state.changeLog, logEntry(`${carer.name} marked fit for work`, "sage")],
      };
    }
    case "auto-allocate": {
      const { plan, visits } = action.result;
      const entries = plan.map((p) =>
        logEntry(`AI: ${p.clientName} · ${formatDayLabel(p.start)} ${formatTime(p.start)} — ${p.carerName} (${p.match}% match)`, "amber"),
      );
      return { ...state, visits, changeLog: [...state.changeLog, ...entries] };
    }
    case "publish":
      return {
        ...state,
        publishedVisits: state.visits,
        changeLog: [],
        lastPublishedAt: Date.now(),
        publishBump: state.publishBump + 1,
      };
    case "reset":
      return { ...initialState, lastPublishedAt: Date.now(), publishBump: state.publishBump + 1 };
    default:
      return state;
  }
}

export function RosterProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((text, tone = "sage") => {
    clearTimeout(toastTimer.current);
    setToast({ text, tone });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const { visits, publishedVisits, sickCarerIds, changeLog, lastPublishedAt, publishBump } = state;

  // What still differs between the office's working copy and the carers' phones.
  const pendingPublish = useMemo(
    () => changedBetween(publishedVisits, visits).length,
    [publishedVisits, visits],
  );

  const publishedVisitsForCarer = useCallback(
    (carerId, date) =>
      publishedVisits.filter(
        (v) => v.carerIds.includes(carerId) && (!date || isSameDate(v.start, date)),
      ),
    [publishedVisits],
  );

  const analysis = useMemo(() => analyseRota(visits, sickCarerIds), [visits, sickCarerIds]);
  const metrics = useMemo(
    () => ({
      total: visits.filter((v) => v.status !== "missed").length,
      unallocated: visits.filter(needsAllocation).length,
      continuity: continuityPercent(visits),
      utilisation: utilisationPercent(visits),
    }),
    [visits],
  );

  const autoAllocate = useCallback(() => {
    const result = planAutoAllocation(visits, sickCarerIds);
    if (!result.plan.length) {
      showToast("Nothing to allocate — the rota is already fully covered ✓", "sage");
      return;
    }
    dispatch({ type: "auto-allocate", result });
    showToast(`AI allocated ${result.plan.length} visit${result.plan.length === 1 ? "" : "s"} — no blocking conflicts`, "sage");
  }, [visits, sickCarerIds, showToast]);

  const value = useMemo(
    () => ({
      visits,
      publishedVisits,
      publishedVisitsForCarer,
      lastPublishedAt,
      publishBump,
      pendingPublish,
      sickCarerIds,
      changeLog,
      analysis,
      metrics,
      selectedVisit: visits.find((v) => v.id === selectedVisitId) ?? null,
      openVisit: setSelectedVisitId,
      closeVisit: () => setSelectedVisitId(null),
      toast,
      showToast,
      assignCarer: (visitId, carerId, replaceCarerId = null) => dispatch({ type: "assign", visitId, carerId, replaceCarerId }),
      unassignCarer: (visitId, carerId) => dispatch({ type: "unassign", visitId, carerId }),
      markSick: (carerId) => dispatch({ type: "mark-sick", carerId }),
      markFit: (carerId) => dispatch({ type: "mark-fit", carerId }),
      autoAllocate,
      publish: () => dispatch({ type: "publish" }),
      resetDemo: () => {
        dispatch({ type: "reset" });
        setSelectedVisitId(null);
        showToast("Demo reset — rota restored to the published week", "brand");
      },
    }),
    [
      visits,
      publishedVisits,
      publishedVisitsForCarer,
      lastPublishedAt,
      publishBump,
      pendingPublish,
      sickCarerIds,
      changeLog,
      analysis,
      metrics,
      selectedVisitId,
      toast,
      showToast,
      autoAllocate,
    ],
  );

  return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
}

export function useRoster() {
  const ctx = useContext(RosterContext);
  if (!ctx) throw new Error("useRoster must be used inside RosterProvider");
  return ctx;
}
