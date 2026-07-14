import { carers } from "./carers";
import { addDays } from "../utils/dates";

const now = new Date();

const skillLabels = {
  medication: "Medication Administration",
  hoist: "Moving & Handling (Hoist)",
  dementia: "Dementia Care",
  diabetes: "Diabetes Care",
  parkinsons: "Parkinson's Care",
  "learning-disability": "Learning Disability Support",
  dysphagia: "Dysphagia & Safe Swallowing",
};

const mandatory = ["Safeguarding Adults", "Basic Life Support", "Fire Safety"];

// Deterministic-but-varied demo expiry offsets (days from now) keyed by carer id, so the
// compliance screen has a healthy mix of overdue / due-soon / valid certificates.
const offsetsByCarer = {
  sarah: [-6, 12, 40, 90, 200],
  aaron: [3, 25, 70, 150],
  fatima: [-14, 8, 55, 120, 300],
  james: [18, 45, 100],
  grace: [-2, 5, 30, 80, 250, 320],
  liam: [10, 60, 140],
};

function buildCertsFor(carer) {
  const labels = [...mandatory, ...carer.skills.map((s) => skillLabels[s] ?? s)];
  const offsets = offsetsByCarer[carer.id] ?? labels.map((_, i) => 30 + i * 20);
  return labels.map((label, i) => {
    const offset = offsets[i % offsets.length];
    const expiry = addDays(now, offset);
    const status = offset < 0 ? "overdue" : offset <= 21 ? "due-soon" : "valid";
    return { id: `${carer.id}-cert-${i}`, label, expiry, status };
  });
}

export const carerTrainingRecords = Object.fromEntries(carers.map((c) => [c.id, buildCertsFor(c)]));

export function trainingForCarer(carerId) {
  return carerTrainingRecords[carerId] ?? [];
}

export const trainingStatusMeta = {
  overdue: { label: "Overdue", color: "rose" },
  "due-soon": { label: "Due soon", color: "amber" },
  valid: { label: "Valid", color: "sage" },
};
