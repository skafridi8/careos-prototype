import { startOfWeek, addDays, atTime } from "../utils/dates";

const WEEKDAYS = [0, 1, 2, 3, 4];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

// Recurring visit templates. `days` are offsets from the Monday of the displayed week.
// requiredSkills are hard requirements the rostering engine enforces.
const TEMPLATES = [
  { clientId: "margaret-hendricks", days: WEEKDAYS, start: [8, 0], end: [8, 30], carerIds: ["sarah"], type: "Personal Care & Medication", requiredSkills: ["medication"] },
  { clientId: "doris-cameron", days: ALL_DAYS, start: [9, 15], end: [9, 45], carerIds: ["sarah", "grace"], type: "Double-Up Personal Care & Hoist Transfer", requiredSkills: ["hoist"], requiresTwo: true },
  { clientId: "doris-cameron", days: ALL_DAYS, start: [18, 0], end: [18, 30], carerIds: ["grace", "liam"], type: "Double-Up Personal Care & Hoist Transfer", requiredSkills: ["hoist"], requiresTwo: true },
  { clientId: "winifred-okafor", days: WEEKDAYS, start: [16, 0], end: [16, 20], carerIds: ["sarah"], type: "Medication & Welfare Check", requiredSkills: ["medication"] },
  { clientId: "arthur-whitfield", days: WEEKDAYS, start: [9, 30], end: [10, 0], carerIds: ["aaron"], type: "Personal Care" },
  { clientId: "priya-nair", days: WEEKDAYS, start: [8, 15], end: [8, 35], carerIds: ["aaron"], type: "Medication & Glucose Check", requiredSkills: ["medication"] },
  { clientId: "priya-nair", days: [1, 3], start: [10, 30], end: [11, 0], carerIds: ["fatima"], type: "Personal Care & Mobility Support" },
  { clientId: "kenneth-osei", days: ALL_DAYS, start: [9, 0], end: [9, 30], carerIds: ["fatima"], type: "Personal Care & Skin Check" },
  { clientId: "elsie-marchetti", days: ALL_DAYS, start: [7, 0], end: [7, 20], carerIds: ["fatima"], type: "Medication (Parkinson's timing critical)", requiredSkills: ["medication"], timeCritical: true },
  { clientId: "elsie-marchetti", days: ALL_DAYS, start: [19, 0], end: [19, 20], carerIds: ["james"], type: "Medication (Parkinson's timing critical)", requiredSkills: ["medication"], timeCritical: true },
  { clientId: "daniel-reyes", days: WEEKDAYS, start: [17, 0], end: [17, 30], carerIds: ["james"], type: "Community Support Visit" },
];

function computeStatus(start, end, forceMissed) {
  const now = Date.now();
  if (end.getTime() < now) return forceMissed ? "missed" : "completed";
  if (start.getTime() <= now && now <= end.getTime()) return "in-progress";
  return "upcoming";
}

function generateVisits() {
  const weekStart = startOfWeek(new Date());
  const list = [];
  let counter = 1;

  for (const tpl of TEMPLATES) {
    for (const dayOffset of tpl.days) {
      const day = addDays(weekStart, dayOffset);
      const start = atTime(day, tpl.start[0], tpl.start[1]);
      const end = atTime(day, tpl.end[0], tpl.end[1]);
      list.push({
        id: `v${counter++}`,
        clientId: tpl.clientId,
        carerIds: tpl.carerIds,
        start,
        end,
        type: tpl.type,
        doubleUp: tpl.carerIds.length > 1,
        requiresTwo: Boolean(tpl.requiresTwo),
        requiredSkills: tpl.requiredSkills ?? [],
        timeCritical: Boolean(tpl.timeCritical),
        status: computeStatus(start, end, false),
      });
    }
  }

  // One-off missed visit — always "yesterday" so the compliance alert always has a live example.
  const yesterday = addDays(new Date(), -1);
  const missedStart = atTime(yesterday, 18, 30);
  const missedEnd = atTime(yesterday, 18, 50);
  list.push({
    id: "v-missed-1",
    clientId: "arthur-whitfield",
    carerIds: ["liam"],
    start: missedStart,
    end: missedEnd,
    type: "Evening Medication Check",
    doubleUp: false,
    requiresTwo: false,
    requiredSkills: ["medication"],
    timeCritical: false,
    status: computeStatus(missedStart, missedEnd, true),
  });

  // Two new care-package visits awaiting allocation — always "today" so the
  // rostering demo opens with something for the AI allocator to solve.
  const today = new Date();
  const unallocated = [
    { id: "v-open-1", clientId: "margaret-hendricks", start: atTime(today, 13, 0), end: atTime(today, 13, 30), type: "Lunchtime Welfare & Nutrition Check", requiredSkills: [] },
    { id: "v-open-2", clientId: "daniel-reyes", start: atTime(today, 14, 30), end: atTime(today, 15, 0), type: "Community Outing Support", requiredSkills: [] },
  ];
  for (const v of unallocated) {
    list.push({
      ...v,
      carerIds: [],
      doubleUp: false,
      requiresTwo: false,
      timeCritical: false,
      status: "unallocated",
    });
  }

  return list.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export const visits = generateVisits();

export function visitsForClient(clientId) {
  return visits.filter((v) => v.clientId === clientId);
}

export function visitsForCarer(carerId, date) {
  return visits.filter((v) => v.carerIds.includes(carerId) && (!date || isSameDate(v.start, date)));
}

export function isSameDate(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export const statusMeta = {
  completed: { label: "Completed", color: "sage" },
  upcoming: { label: "Upcoming", color: "brand" },
  "in-progress": { label: "In Progress", color: "amber" },
  missed: { label: "Missed", color: "rose" },
  unallocated: { label: "Unallocated", color: "rose" },
};
