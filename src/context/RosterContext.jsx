import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
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
  carerRequests: [], // time-off / shift-swap / flagged-issue requests raised by carers (via mobile AI assistant)
  carerNotes: [], // free-text visit notes carers submit via the mobile AI assistant, cited in AI Care Notes
  carerTimesheets: [], // demo-only timesheet entries submitted from the mobile Records tab
  carerTrainingLogs: [], // demo-only training-log entries submitted from the mobile Records tab
  notifications: [], // per-carer alerts raised when a manager allocates/changes something for them — surfaced on their mobile app only
};

let logId = 0;
function logEntry(text, tone = "brand") {
  return { id: `log-${++logId}`, text, tone };
}

let requestId = 0;
let noteId = 0;
let recordId = 0;
let notificationId = 0;

function notify(carerId, message) {
  return { id: `notif-${++notificationId}`, carerId, message, createdAt: Date.now(), read: false };
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
        notifications: [
          notify(carerId, `You've been assigned to ${visitLabel(visit)}`),
          ...state.notifications,
        ],
      };
    }
    case "unassign": {
      const { visitId, carerId } = action;
      const visit = state.visits.find((v) => v.id === visitId);
      return {
        ...state,
        visits: withoutCarer(state.visits, visitId, carerId),
        changeLog: [...state.changeLog, logEntry(`${visitLabel(visit)} — ${carerById(carerId).name} removed`, "rose")],
        notifications: [
          notify(carerId, `You've been removed from ${visitLabel(visit)}`),
          ...state.notifications,
        ],
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
        notifications: [notify(carerId, "The office has marked you off sick and is arranging cover."), ...state.notifications],
      };
    }
    case "mark-fit": {
      const carer = carerById(action.carerId);
      return {
        ...state,
        sickCarerIds: state.sickCarerIds.filter((id) => id !== action.carerId),
        changeLog: [...state.changeLog, logEntry(`${carer.name} marked fit for work`, "sage")],
        notifications: [notify(action.carerId, "The office has marked you fit for work again."), ...state.notifications],
      };
    }
    case "auto-allocate": {
      const { plan, visits } = action.result;
      const entries = plan.map((p) =>
        logEntry(`AI: ${p.clientName} · ${formatDayLabel(p.start)} ${formatTime(p.start)} — ${p.carerName} (${p.match}% match)`, "amber"),
      );
      const notifications = plan.map((p) =>
        notify(p.carerId, `You've been allocated ${p.clientName} · ${formatDayLabel(p.start)} ${formatTime(p.start)}`),
      );
      return { ...state, visits, changeLog: [...state.changeLog, ...entries], notifications: [...notifications, ...state.notifications] };
    }
    case "publish":
      return {
        ...state,
        publishedVisits: state.visits,
        changeLog: [],
        lastPublishedAt: Date.now(),
        publishBump: state.publishBump + 1,
      };
    case "add-carer-request": {
      const { requestType, carerId, payload } = action;
      const request = {
        id: `req-${++requestId}`,
        type: requestType, // 'time-off' | 'shift-swap' | 'flag'
        carerId,
        payload,
        status: "pending",
        createdAt: Date.now(),
      };
      const carer = carerById(carerId);
      const labelByType = { "time-off": "requested time off", "shift-swap": "requested a shift swap", flag: "flagged an issue" };
      return {
        ...state,
        carerRequests: [request, ...state.carerRequests],
        changeLog: [...state.changeLog, logEntry(`${carer?.name ?? "A carer"} ${labelByType[requestType] ?? "raised a request"}`, "amber")],
      };
    }
    case "resolve-carer-request": {
      const { requestId: id, resolution } = action; // resolution: 'approved' | 'declined'
      const request = state.carerRequests.find((r) => r.id === id);
      if (!request) return state;
      const carer = carerById(request.carerId);
      return {
        ...state,
        carerRequests: state.carerRequests.map((r) => (r.id === id ? { ...r, status: resolution } : r)),
        changeLog: [
          ...state.changeLog,
          logEntry(`${carer?.name ?? "Carer"}'s request ${resolution}`, resolution === "approved" ? "sage" : "rose"),
        ],
        notifications: [
          notify(request.carerId, `Your request was ${resolution} by the office.`),
          ...state.notifications,
        ],
      };
    }
    case "add-carer-note": {
      const { carerId, clientId, visitId, text } = action;
      const note = { id: `note-${++noteId}`, carerId, clientId, visitId, text, createdAt: Date.now(), read: false };
      return { ...state, carerNotes: [note, ...state.carerNotes] };
    }
    case "mark-carer-notes-seen":
      return { ...state, carerNotes: state.carerNotes.map((n) => (n.read ? n : { ...n, read: true })) };
    case "add-carer-timesheet": {
      const entry = { id: `ts-${++recordId}`, createdAt: Date.now(), ...action.entry };
      return { ...state, carerTimesheets: [entry, ...state.carerTimesheets] };
    }
    case "add-carer-training-log": {
      const entry = { id: `tr-${++recordId}`, createdAt: Date.now(), ...action.entry };
      return { ...state, carerTrainingLogs: [entry, ...state.carerTrainingLogs] };
    }
    case "mark-notifications-read": {
      const { carerId } = action;
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.carerId === carerId ? { ...n, read: true } : n)),
      };
    }
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

  const showToast = useCallback((text, tone = "sage", options = {}) => {
    clearTimeout(toastTimer.current);
    setToast({ text, tone, to: options.to, actionLabel: options.actionLabel });
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  const {
    visits,
    publishedVisits,
    sickCarerIds,
    changeLog,
    lastPublishedAt,
    publishBump,
    carerRequests,
    carerNotes,
    carerTimesheets,
    carerTrainingLogs,
    notifications,
  } = state;

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

  // Point the manager at wherever something just happened, instead of making them go hunting for it.
  const prevNoteCount = useRef(carerNotes.length);
  const prevRequestCount = useRef(carerRequests.length);
  useEffect(() => {
    if (carerNotes.length > prevNoteCount.current) {
      const note = carerNotes[0];
      const carer = carerById(note.carerId);
      showToast(`${carer?.name ?? "A carer"} added a note`, "amber", { to: "/app/ai", actionLabel: "View in AI Care Notes" });
    }
    prevNoteCount.current = carerNotes.length;
  }, [carerNotes, showToast]);
  useEffect(() => {
    if (carerRequests.length > prevRequestCount.current) {
      const request = carerRequests[0];
      const carer = carerById(request.carerId);
      const labelByType = { "time-off": "requested time off", "shift-swap": "requested a shift swap", flag: "flagged an issue" };
      showToast(`${carer?.name ?? "A carer"} ${labelByType[request.type] ?? "raised a request"}`, "amber", {
        to: "/app/roster",
        actionLabel: "View in Rostering",
      });
    }
    prevRequestCount.current = carerRequests.length;
  }, [carerRequests, showToast]);

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
      carerRequests,
      pendingCarerRequests: carerRequests.filter((r) => r.status === "pending").length,
      addCarerRequest: (requestType, carerId, payload = {}) => dispatch({ type: "add-carer-request", requestType, carerId, payload }),
      resolveCarerRequest: (requestId, resolution) => dispatch({ type: "resolve-carer-request", requestId, resolution }),
      carerNotes,
      addCarerNote: (carerId, clientId, visitId, text) => dispatch({ type: "add-carer-note", carerId, clientId, visitId, text }),
      unseenCarerNotesCount: carerNotes.filter((n) => !n.read).length,
      markCarerNotesSeen: () => dispatch({ type: "mark-carer-notes-seen" }),
      carerTimesheets,
      addCarerTimesheet: (entry) => dispatch({ type: "add-carer-timesheet", entry }),
      carerTrainingLogs,
      addCarerTrainingLog: (entry) => dispatch({ type: "add-carer-training-log", entry }),
      notifications,
      notificationsForCarer: (carerId) => notifications.filter((n) => n.carerId === carerId),
      unreadNotificationCount: (carerId) =>
        notifications.filter((n) => n.carerId === carerId && !n.read).length,
      markNotificationsRead: (carerId) => dispatch({ type: "mark-notifications-read", carerId }),
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
      carerRequests,
      carerNotes,
      carerTimesheets,
      carerTrainingLogs,
      notifications,
    ],
  );

  return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
}

export function useRoster() {
  const ctx = useContext(RosterContext);
  if (!ctx) throw new Error("useRoster must be used inside RosterProvider");
  return ctx;
}
