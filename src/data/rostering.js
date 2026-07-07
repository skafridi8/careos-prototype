// Shared reference data for the rostering engine.

// Which travel zone each client lives in (matches carers' `zone` field).
export const clientZones = {
  "margaret-hendricks": "BS6",
  "arthur-whitfield": "BS7",
  "priya-nair": "BS5",
  "winifred-okafor": "BS4",
  "doris-cameron": "Willowbrook",
  "kenneth-osei": "Willowbrook",
  "elsie-marchetti": "Willowbrook",
  "daniel-reyes": "Aspen",
};

// Typical drive times in minutes between zones. Same zone = short hop;
// same building (Willowbrook / Aspen) = no travel.
const TRAVEL_MINUTES = {
  "BS4|BS5": 15,
  "BS4|BS6": 20,
  "BS4|BS7": 20,
  "BS4|Willowbrook": 25,
  "BS4|Aspen": 15,
  "BS5|BS6": 20,
  "BS5|BS7": 18,
  "BS5|Willowbrook": 20,
  "BS5|Aspen": 15,
  "BS6|BS7": 12,
  "BS6|Willowbrook": 25,
  "BS6|Aspen": 20,
  "BS7|Willowbrook": 22,
  "BS7|Aspen": 20,
  "Willowbrook|Aspen": 25,
};

export function travelMinutes(zoneA, zoneB) {
  if (!zoneA || !zoneB) return 15;
  if (zoneA === zoneB) return zoneA === "Willowbrook" || zoneA === "Aspen" ? 0 : 10;
  return TRAVEL_MINUTES[`${zoneA}|${zoneB}`] ?? TRAVEL_MINUTES[`${zoneB}|${zoneA}`] ?? 20;
}

export const skillMeta = {
  medication: { label: "Medication-trained" },
  hoist: { label: "Hoist-trained" },
  dementia: { label: "Dementia care" },
  parkinsons: { label: "Parkinson's care" },
  diabetes: { label: "Diabetes care" },
  dysphagia: { label: "Dysphagia (SALT)" },
  "learning-disability": { label: "Learning disability support" },
};

export function skillLabel(id) {
  return skillMeta[id]?.label ?? id;
}
