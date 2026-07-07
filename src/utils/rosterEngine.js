// Rostering engine: conflict detection, carer suggestions and rota metrics.
// Pure functions over the visits array so the UI can re-validate on every change.

import { carers, carerById } from "../data/carers";
import { clientById } from "../data/clients";
import { clientZones, travelMinutes, skillLabel } from "../data/rostering";
import { isSameDate } from "../data/visits";
import { formatTime } from "./dates";

// Client scheduling preferences the engine checks (soft constraints).
const clientGenderPreference = {
  "margaret-hendricks": "female",
};

function overlaps(a, b) {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

function mondayIndex(date) {
  return (new Date(date).getDay() + 6) % 7; // 0 = Monday … 6 = Sunday
}

export function visitZone(visit) {
  return clientZones[visit.clientId];
}

function isActiveVisit(v) {
  return v.status !== "completed" && v.status !== "missed";
}

export function needsAllocation(v) {
  return isActiveVisit(v) && (v.carerIds.length === 0 || (v.requiresTwo && v.carerIds.length < 2));
}

function withinAvailability(carer, visit) {
  const { days, startHour, endHour } = carer.availability;
  if (!days.includes(mondayIndex(visit.start))) return false;
  const startsAt = visit.start.getHours() + visit.start.getMinutes() / 60;
  const endsAt = visit.end.getHours() + visit.end.getMinutes() / 60;
  return startsAt >= startHour && endsAt <= endHour;
}

function carerVisitsOnDay(carerId, visits, date, exceptVisitId) {
  return visits
    .filter((v) => v.id !== exceptVisitId && v.carerIds.includes(carerId) && isSameDate(v.start, date))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

// Travel feasibility from the carer's neighbouring visits on the same day.
// Returns null when fine, or a description of the tight leg.
function travelProblem(carerId, visit, visits) {
  const carer = carerById(carerId);
  const dayVisits = carerVisitsOnDay(carerId, visits, visit.start, visit.id);
  const zone = visitZone(visit);

  const prev = [...dayVisits].reverse().find((v) => v.end.getTime() <= visit.start.getTime());
  if (prev) {
    const gapMin = (visit.start.getTime() - prev.end.getTime()) / 60000;
    const needed = travelMinutes(visitZone(prev), zone);
    if (gapMin < needed) {
      return `only ${Math.round(gapMin)} min after ${clientById(prev.clientId).name.split(" ")[0]} at ${formatTime(prev.end)} (~${needed} min travel)`;
    }
  }
  const next = dayVisits.find((v) => v.start.getTime() >= visit.end.getTime());
  if (next) {
    const gapMin = (next.start.getTime() - visit.end.getTime()) / 60000;
    const needed = travelMinutes(zone, visitZone(next));
    if (gapMin < needed) {
      return `only ${Math.round(gapMin)} min before ${clientById(next.clientId).name.split(" ")[0]} at ${formatTime(next.start)} (~${needed} min travel)`;
    }
  }
  void carer;
  return null;
}

// All issues on a single visit. severity: "error" (must fix) | "warning" (review).
export function visitIssues(visit, visits, sickCarerIds = []) {
  if (!isActiveVisit(visit)) return [];
  const issues = [];
  const client = clientById(visit.clientId);

  if (visit.carerIds.length === 0) {
    issues.push({ severity: "error", code: "unallocated", message: `No carer assigned for ${client.name}` });
    return issues;
  }
  if (visit.requiresTwo && visit.carerIds.length < 2) {
    issues.push({ severity: "error", code: "double-up", message: "Double-up visit — needs a second hoist-trained carer" });
  }

  for (const carerId of visit.carerIds) {
    const carer = carerById(carerId);
    if (!carer) continue;

    if (sickCarerIds.includes(carerId)) {
      issues.push({ severity: "error", code: "sick", message: `${carer.name} is off sick` });
    }

    for (const skill of visit.requiredSkills) {
      if (!carer.skills.includes(skill)) {
        issues.push({ severity: "error", code: "skill", message: `${carer.name} is not ${skillLabel(skill).toLowerCase()}` });
      }
    }

    const clash = visits.find(
      (v) => v.id !== visit.id && isActiveVisit(v) && v.carerIds.includes(carerId) && overlaps(v, visit),
    );
    if (clash) {
      issues.push({
        severity: "error",
        code: "overlap",
        message: `${carer.name} is double-booked — ${clientById(clash.clientId).name} at ${formatTime(clash.start)}`,
      });
    }

    if (!withinAvailability(carer, visit)) {
      issues.push({ severity: "warning", code: "availability", message: `Outside ${carer.name.split(" ")[0]}'s working pattern (${carer.availabilityLabel})` });
    }

    const travel = travelProblem(carerId, visit, visits);
    if (travel) {
      issues.push({ severity: "warning", code: "travel", message: `Tight travel for ${carer.name.split(" ")[0]} — ${travel}` });
    }

    const preferred = clientGenderPreference[visit.clientId];
    if (preferred && carer.gender !== preferred) {
      issues.push({ severity: "warning", code: "preference", message: `${client.preferredName} prefers ${preferred} carers` });
    }
  }

  return issues;
}

// Map of visitId -> issues, plus aggregate counts for the KPI strip.
export function analyseRota(visits, sickCarerIds = []) {
  const byVisit = new Map();
  let errors = 0;
  let warnings = 0;
  for (const v of visits) {
    const issues = visitIssues(v, visits, sickCarerIds);
    if (issues.length) {
      byVisit.set(v.id, issues);
      errors += issues.filter((i) => i.severity === "error").length;
      warnings += issues.filter((i) => i.severity === "warning").length;
    }
  }
  return { byVisit, errors, warnings };
}

// Hard validation for an assignment attempt (drag-drop or suggestion click).
export function checkAssignment(visit, carerId, visits, sickCarerIds = []) {
  const carer = carerById(carerId);
  const errors = [];
  const warnings = [];

  if (visit.carerIds.includes(carerId)) {
    errors.push(`${carer.name} is already assigned to this visit`);
  }
  if (sickCarerIds.includes(carerId)) {
    errors.push(`${carer.name} is off sick`);
  }
  for (const skill of visit.requiredSkills) {
    if (!carer.skills.includes(skill)) {
      errors.push(`${carer.name} is not ${skillLabel(skill).toLowerCase()} — required for this visit`);
    }
  }
  const clash = visits.find(
    (v) => v.id !== visit.id && isActiveVisit(v) && v.carerIds.includes(carerId) && overlaps(v, visit),
  );
  if (clash) {
    errors.push(`${carer.name} already has ${clientById(clash.clientId).name} at ${formatTime(clash.start)}`);
  }

  if (!withinAvailability(carer, visit)) {
    warnings.push(`Outside ${carer.name.split(" ")[0]}'s working pattern (${carer.availabilityLabel})`);
  }
  const preferred = clientGenderPreference[visit.clientId];
  if (preferred && carer.gender !== preferred) {
    warnings.push(`${clientById(visit.clientId).preferredName} prefers ${preferred} carers`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

function familiarity(carerId, clientId, visits) {
  return visits.filter((v) => v.clientId === clientId && v.carerIds.includes(carerId)).length;
}

// Ranked, explainable carer suggestions for a visit. Hard conflicts are
// excluded entirely — the engine never suggests an unsafe match.
export function suggestCarers(visit, visits, sickCarerIds = [], excludeIds = []) {
  const client = clientById(visit.clientId);
  const results = [];

  for (const carer of carers) {
    if (excludeIds.includes(carer.id) || visit.carerIds.includes(carer.id)) continue;
    const check = checkAssignment(visit, carer.id, visits, sickCarerIds);
    if (!check.ok) continue;

    let score = 55;
    const reasons = [];

    const visitCount = familiarity(carer.id, visit.clientId, visits);
    if (visitCount >= 2) {
      score += 25;
      reasons.push({ text: `Regular carer — ${visitCount} visits with ${client.preferredName} this week`, tone: "sage" });
    } else if (visitCount === 1) {
      score += 10;
      reasons.push({ text: `Has visited ${client.preferredName} this week`, tone: "sage" });
    } else {
      reasons.push({ text: `New to ${client.preferredName} — introduction recommended`, tone: "muted" });
    }

    if (visit.requiredSkills.length) {
      score += 8;
      reasons.push({ text: visit.requiredSkills.map((s) => `${skillLabel(s)} ✓`).join(" · "), tone: "sage" });
    }

    if (withinAvailability(carer, visit)) {
      score += 6;
      reasons.push({ text: `Working window fits (${carer.availabilityLabel})`, tone: "sage" });
    } else {
      score -= 18;
      reasons.push({ text: `Outside usual hours (${carer.availabilityLabel})`, tone: "amber" });
    }

    const travel = travelProblem(carer.id, { ...visit, carerIds: [carer.id] }, visits);
    if (travel) {
      score -= 12;
      reasons.push({ text: `Tight travel — ${travel}`, tone: "amber" });
    } else {
      score += 4;
      reasons.push({ text: "Travel time from nearby visits is feasible", tone: "sage" });
    }

    const preferred = clientGenderPreference[visit.clientId];
    if (preferred) {
      if (carer.gender === preferred) {
        score += 6;
        reasons.push({ text: `Matches preference: ${preferred} carer`, tone: "sage" });
      } else {
        score -= 10;
        reasons.push({ text: `${client.preferredName} prefers ${preferred} carers`, tone: "amber" });
      }
    }

    const hours = scheduledHours(carer.id, visits);
    const visitHours = (visit.end.getTime() - visit.start.getTime()) / 3600000;
    if (hours + visitHours <= carer.contractedHours) {
      score += 4;
    } else {
      score -= 6;
      reasons.push({ text: "Slightly over contracted hours this week", tone: "amber" });
    }

    results.push({ carer, match: Math.max(30, Math.min(99, Math.round(score))), reasons });
  }

  return results.sort((a, b) => b.match - a.match).slice(0, 3);
}

export function scheduledHours(carerId, visits) {
  return visits
    .filter((v) => v.status !== "missed" && v.carerIds.includes(carerId))
    .reduce((sum, v) => sum + (v.end.getTime() - v.start.getTime()) / 3600000, 0);
}

export function utilisationPercent(visits) {
  const ratios = carers.map((c) => {
    const hours = scheduledHours(c.id, visits);
    return c.contractedHours ? Math.min(1.15, hours / c.contractedHours) : 0;
  });
  return Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100);
}

// % of allocated visits covered by a carer the client already knows well.
export function continuityPercent(visits) {
  const allocated = visits.filter((v) => v.status !== "missed" && v.carerIds.length > 0);
  if (!allocated.length) return 100;
  const familiar = allocated.filter((v) =>
    v.carerIds.some((cid) => familiarity(cid, v.clientId, visits) >= 2),
  );
  return Math.round((familiar.length / allocated.length) * 100);
}

// Immutably apply an assignment. replaceCarerId swaps a specific slot
// (used when dragging a double-up block between lanes).
export function withAssignment(visits, visitId, carerId, replaceCarerId = null) {
  return visits.map((v) => {
    if (v.id !== visitId) return v;
    let carerIds;
    if (replaceCarerId) {
      carerIds = v.carerIds.map((id) => (id === replaceCarerId ? carerId : id));
    } else if (!v.requiresTwo && v.carerIds.length >= 1) {
      carerIds = [carerId];
    } else {
      carerIds = [...v.carerIds, carerId];
    }
    const status = v.status === "unallocated" ? "upcoming" : v.status;
    return { ...v, carerIds, status };
  });
}

export function withoutCarer(visits, visitId, carerId) {
  return visits.map((v) => {
    if (v.id !== visitId) return v;
    const carerIds = v.carerIds.filter((id) => id !== carerId);
    return { ...v, carerIds, status: carerIds.length === 0 ? "unallocated" : v.status };
  });
}

// Plan conflict-free assignments for every visit that needs cover.
// Applies each pick to a working copy so later picks see earlier ones.
export function planAutoAllocation(visits, sickCarerIds = []) {
  let working = visits;
  const plan = [];
  const pending = working.filter(needsAllocation).sort((a, b) => a.start.getTime() - b.start.getTime());

  for (const visit of pending) {
    const current = working.find((v) => v.id === visit.id);
    const slots = current.requiresTwo ? 2 - current.carerIds.length : current.carerIds.length === 0 ? 1 : 0;
    for (let i = 0; i < slots; i++) {
      const live = working.find((v) => v.id === visit.id);
      const [best] = suggestCarers(live, working, sickCarerIds);
      if (!best) break;
      working = withAssignment(working, visit.id, best.carer.id);
      plan.push({
        visitId: visit.id,
        carerId: best.carer.id,
        carerName: best.carer.name,
        clientName: clientById(visit.clientId).name,
        start: visit.start,
        match: best.match,
      });
    }
  }

  return { plan, visits: working };
}
