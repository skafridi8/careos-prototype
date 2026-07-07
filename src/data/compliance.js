import { clients, clientById } from "./clients";
import { visits } from "./visits";
import { carerById } from "./carers";
import { addDays } from "../utils/dates";

const now = new Date();

function carerNames(carerIds) {
  return carerIds.map((id) => carerById(id)?.name).filter(Boolean).join(" & ");
}

function visitNoteFor(visit) {
  const client = clientById(visit.clientId);
  const who = carerNames(visit.carerIds);
  const name = client?.preferredName ?? "the client";

  if (visit.type.includes("Medication")) {
    return { action: "Medication administered", kind: "medication-log", text: `${who} administered scheduled medication for ${name}. No adverse reaction noted.` };
  }
  if (visit.type.includes("Double-Up")) {
    return { action: "Double-up visit completed", kind: "visit-completed", text: `${who} completed a double-up hoist transfer and personal care visit for ${name}.` };
  }
  if (visit.type.includes("Personal Care")) {
    return { action: "Personal care completed", kind: "care-note", text: `${who} completed personal care for ${name}. No concerns raised during the visit.` };
  }
  if (visit.type.includes("Welfare")) {
    return { action: "Welfare check completed", kind: "visit-completed", text: `${who} completed a welfare check for ${name}. Client reported feeling well.` };
  }
  if (visit.type.includes("Community Support")) {
    return { action: "Community support visit completed", kind: "care-note", text: `${who} supported ${name} with weekly budgeting and meal planning.` };
  }
  return { action: "Visit completed", kind: "visit-completed", text: `${who} completed a scheduled visit for ${name}.` };
}

function buildVisitActivity() {
  const finished = visits
    .filter((v) => v.status === "completed" || v.status === "missed")
    .sort((a, b) => b.end.getTime() - a.end.getTime())
    .slice(0, 14);

  return finished.map((visit) => {
    const client = clientById(visit.clientId);
    if (visit.status === "missed") {
      return {
        id: `activity-${visit.id}`,
        timestamp: visit.end,
        actor: carerNames(visit.carerIds) || "Unassigned",
        clientId: visit.clientId,
        type: "missed-visit",
        action: "Visit missed",
        text: `${visit.type} for ${client?.preferredName} was not checked in or completed.`,
      };
    }
    const note = visitNoteFor(visit);
    return {
      id: `activity-${visit.id}`,
      timestamp: visit.end,
      actor: carerNames(visit.carerIds),
      clientId: visit.clientId,
      type: note.kind,
      action: note.action,
      text: note.text,
    };
  });
}

const scheduleChangeActivity = [
  {
    id: "activity-sched-1",
    timestamp: addDays(now, -1),
    actor: "Care Coordinator — Rachel Ford",
    clientId: "priya-nair",
    type: "schedule-change",
    action: "Visit rescheduled",
    text: "Priya Nair's Tuesday visit moved from 10:00 to 10:30 to align with a physiotherapy session running over.",
  },
  {
    id: "activity-sched-2",
    timestamp: addDays(now, -2),
    actor: "Care Coordinator — Rachel Ford",
    clientId: "doris-cameron",
    type: "schedule-change",
    action: "Carer reassigned",
    text: "Doris Cameron's evening double-up visit reassigned from Aaron Mitchell to Liam Foster (Aaron on leave).",
  },
];

const planUpdateActivity = [
  {
    id: "activity-plan-1",
    timestamp: clientById("margaret-hendricks").carePlan.lastUpdated,
    actor: "Senior Carer — Sarah Jenkins",
    clientId: "margaret-hendricks",
    type: "plan-update",
    action: "Care plan updated",
    text: "Mobility section revised after a stairs safety review — non-slip mats confirmed fitted in the bathroom.",
  },
  {
    id: "activity-plan-2",
    timestamp: clientById("priya-nair").carePlan.lastUpdated,
    actor: "Care Coordinator — Rachel Ford",
    clientId: "priya-nair",
    type: "plan-update",
    action: "Care plan updated",
    text: "Stroke recovery goals updated following latest physiotherapy progress report.",
  },
  {
    id: "activity-plan-3",
    timestamp: clientById("elsie-marchetti").carePlan.lastUpdated,
    actor: "Senior Carer — Fatima Malik",
    clientId: "elsie-marchetti",
    type: "plan-update",
    action: "Care plan updated",
    text: "Added note on strict Madopar timing after a freezing episode observed during a doorway transfer.",
  },
];

export const auditLog = [...buildVisitActivity(), ...scheduleChangeActivity, ...planUpdateActivity].sort(
  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
);

export const activityTypeMeta = {
  "visit-completed": { label: "Visit", color: "brand" },
  "care-note": { label: "Care Note", color: "sage" },
  "medication-log": { label: "Medication", color: "amber" },
  "schedule-change": { label: "Rostering", color: "brand" },
  "plan-update": { label: "Care Plan", color: "sage" },
  "missed-visit": { label: "Missed Visit", color: "rose" },
};

// ---- Stat cards ----

const finishedVisits = visits.filter((v) => v.end.getTime() <= Date.now());
const completedVisits = finishedVisits.filter((v) => v.status === "completed");
const missedVisits = finishedVisits.filter((v) => v.status === "missed");
const onTimePct = finishedVisits.length ? Math.round((completedVisits.length / finishedVisits.length) * 100) : 100;

const medicationVisitsFinished = finishedVisits.filter((v) => v.type.includes("Medication"));
const medicationCompleted = medicationVisitsFinished.filter((v) => v.status === "completed");
const medicationPct = medicationVisitsFinished.length
  ? Math.round((medicationCompleted.length / medicationVisitsFinished.length) * 100)
  : 100;

export const overdueReviewClients = clients.filter((c) => new Date(c.carePlan.reviewDate).getTime() < Date.now());
export const reviewsDueSoonClients = clients.filter((c) => {
  const t = new Date(c.carePlan.reviewDate).getTime();
  return t >= Date.now() && t <= addDays(now, 5).getTime();
});

export const complianceStats = [
  {
    id: "visits-on-time",
    label: "Visits completed on time",
    value: `${onTimePct}%`,
    sublabel: `${completedVisits.length} of ${finishedVisits.length} visits this week`,
    tone: onTimePct >= 95 ? "sage" : onTimePct >= 85 ? "amber" : "rose",
  },
  {
    id: "medication-logs",
    label: "Medication logs completed",
    value: `${medicationPct}%`,
    sublabel: `${medicationCompleted.length} of ${medicationVisitsFinished.length} medication visits`,
    tone: medicationPct >= 95 ? "sage" : medicationPct >= 85 ? "amber" : "rose",
  },
  {
    id: "overdue-reviews",
    label: "Overdue care plan reviews",
    value: String(overdueReviewClients.length),
    sublabel: overdueReviewClients.length ? overdueReviewClients.map((c) => c.preferredName).join(", ") : "None outstanding",
    tone: overdueReviewClients.length ? "rose" : "sage",
  },
  {
    id: "missed-visits",
    label: "Missed visits this week",
    value: String(missedVisits.length),
    sublabel: missedVisits.length ? "Escalated to coordinator" : "None this week",
    tone: missedVisits.length ? "rose" : "sage",
  },
];

// ---- Alerts panel ----

export const alerts = [
  ...missedVisits.map((v) => ({
    id: `alert-${v.id}`,
    severity: "high",
    type: "missed-visit",
    clientId: v.clientId,
    timestamp: v.end,
    message: `Missed visit: ${v.type} for ${clientById(v.clientId)?.preferredName} was not completed or checked in.`,
  })),
  ...overdueReviewClients.map((c) => ({
    id: `alert-review-${c.id}`,
    severity: "high",
    type: "overdue-review",
    clientId: c.id,
    timestamp: c.carePlan.reviewDate,
    message: `Care plan review overdue for ${c.preferredName} (due ${new Date(c.carePlan.reviewDate).toLocaleDateString("en-GB")}).`,
  })),
  ...reviewsDueSoonClients.map((c) => ({
    id: `alert-duesoon-${c.id}`,
    severity: "medium",
    type: "review-due-soon",
    clientId: c.id,
    timestamp: c.carePlan.reviewDate,
    message: `Care plan review due soon for ${c.preferredName} (due ${new Date(c.carePlan.reviewDate).toLocaleDateString("en-GB")}).`,
  })),
].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1));

export const alertSeverityMeta = {
  high: { label: "High", color: "rose" },
  medium: { label: "Medium", color: "amber" },
  low: { label: "Low", color: "brand" },
};
