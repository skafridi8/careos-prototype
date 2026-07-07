import { useMemo, useState } from "react";
import { AlertTriangle, Clock3, Thermometer, Users } from "lucide-react";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import { carers } from "../../data/carers";
import { clientById } from "../../data/clients";
import { isSameDate } from "../../data/visits";
import { useRoster } from "../../context/RosterContext";
import { checkAssignment, needsAllocation, scheduledHours } from "../../utils/rosterEngine";
import { startOfWeek, addDays, formatTime, isSameDay } from "../../utils/dates";

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 21;
const PX_PER_MIN = 2;
const LANE_WIDTH = (DAY_END_HOUR - DAY_START_HOUR) * 60 * PX_PER_MIN;
const LABEL_COL = "w-52";

function minutesFromDayStart(date) {
  return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
}

function blockStyle(visit) {
  const left = minutesFromDayStart(visit.start) * PX_PER_MIN;
  const width = Math.max(((visit.end.getTime() - visit.start.getTime()) / 60000) * PX_PER_MIN, 58);
  return { left, width };
}

const statusBlockClasses = {
  upcoming: "border-brand-200 bg-white hover:border-brand-400",
  "in-progress": "border-amber-300 bg-amber-50 hover:border-amber-400",
  completed: "border-sage-200 bg-sage-50/70 opacity-70",
  unallocated: "border-dashed border-rose-300 bg-rose-50 hover:border-rose-400",
  missed: "border-rose-200 bg-rose-50 opacity-70",
};

function TimelineBlock({ visit, laneCarerId, issues }) {
  const { openVisit } = useRoster();
  const client = clientById(visit.clientId);
  const { left, width } = blockStyle(visit);
  const draggable = visit.status === "upcoming" || visit.status === "unallocated";
  const hasError = issues.some((i) => i.severity === "error");
  const hasWarning = issues.some((i) => i.severity === "warning");

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", JSON.stringify({ visitId: visit.id, fromCarerId: laneCarerId }));
      }}
      onClick={() => openVisit(visit.id)}
      title={`${client.name} — ${visit.type} (${formatTime(visit.start)}–${formatTime(visit.end)})`}
      className={`absolute top-1.5 bottom-1.5 flex flex-col justify-center overflow-hidden rounded-lg border px-2 text-left shadow-sm transition ${
        statusBlockClasses[visit.status] ?? statusBlockClasses.upcoming
      } ${draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
      style={{ left, width }}
    >
      <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-900/60">
        {formatTime(visit.start)}
        {visit.doubleUp && <Users size={10} className="shrink-0 text-amber-500" />}
        {visit.timeCritical && <Clock3 size={10} className="shrink-0 text-rose-400" />}
        {(hasError || hasWarning) && (
          <AlertTriangle size={11} className={`shrink-0 ${hasError ? "text-rose-500" : "text-amber-500"}`} />
        )}
      </span>
      <span className="truncate text-[11px] font-medium text-brand-950">{client.preferredName}</span>
    </button>
  );
}

function HourGrid() {
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);
  return (
    <>
      {hours.map((h) => (
        <div
          key={h}
          className="absolute inset-y-0 border-l border-brand-100/70"
          style={{ left: (h - DAY_START_HOUR) * 60 * PX_PER_MIN }}
        />
      ))}
    </>
  );
}

function NowLine({ day }) {
  if (!isSameDay(day, new Date())) return null;
  const now = new Date();
  const mins = minutesFromDayStart(now);
  if (mins < 0 || mins > (DAY_END_HOUR - DAY_START_HOUR) * 60) return null;
  return (
    <div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-rose-400" style={{ left: mins * PX_PER_MIN }}>
      <div className="absolute -top-0.5 -left-[3px] h-2 w-2 rounded-full bg-rose-400" />
    </div>
  );
}

export default function DayTimeline() {
  const { visits, analysis, sickCarerIds, assignCarer, unassignCarer, markSick, markFit, showToast } = useRoster();
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const [dayOffset, setDayOffset] = useState((new Date().getDay() + 6) % 7); // default to today (Mon = 0)
  const [dragLane, setDragLane] = useState(null);

  const day = addDays(weekStart, dayOffset);
  const dayVisits = visits.filter((v) => isSameDate(v.start, day) && v.status !== "missed");
  const unallocatedVisits = dayVisits.filter((v) => v.carerIds.length === 0);

  function handleDrop(e, targetCarerId) {
    e.preventDefault();
    setDragLane(null);
    let payload;
    try {
      payload = JSON.parse(e.dataTransfer.getData("text/plain"));
    } catch {
      return;
    }
    const { visitId, fromCarerId } = payload;
    if (fromCarerId === targetCarerId) return;
    const visit = visits.find((v) => v.id === visitId);
    if (!visit) return;

    // Dropping on the unallocated lane returns the visit to the pool.
    if (targetCarerId === null) {
      if (!fromCarerId) return;
      unassignCarer(visitId, fromCarerId);
      showToast(`${clientById(visit.clientId).name}'s visit returned to unallocated`, "brand");
      return;
    }

    const check = checkAssignment(visit, targetCarerId, visits, sickCarerIds);
    if (!check.ok) {
      showToast(`Blocked: ${check.errors[0]}`, "rose");
      return;
    }
    assignCarer(visitId, targetCarerId, fromCarerId ?? null);
    if (check.warnings.length) {
      showToast(`Assigned with a note — ${check.warnings[0]}`, "amber");
    } else {
      showToast("Reassigned — no conflicts detected ✓", "sage");
    }
  }

  function laneProps(laneId) {
    return {
      onDragOver: (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      },
      onDragEnter: () => setDragLane(laneId),
      onDragLeave: (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDragLane((l) => (l === laneId ? null : l));
      },
      onDrop: (e) => handleDrop(e, laneId === "unallocated" ? null : laneId),
    };
  }

  function toggleSick(carer) {
    if (sickCarerIds.includes(carer.id)) {
      markFit(carer.id);
      showToast(`${carer.name} marked fit for work`, "sage");
    } else {
      const affected = visits.filter((v) => v.status === "upcoming" && v.carerIds.includes(carer.id)).length;
      markSick(carer.id);
      showToast(`${carer.name} marked off sick — ${affected} visit${affected === 1 ? "" : "s"} moved to unallocated`, "rose");
    }
  }

  return (
    <Card padded={false} className="overflow-hidden">
      {/* Day picker */}
      <div className="flex flex-wrap gap-1.5 border-b border-brand-100 p-3">
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(weekStart, i);
          const dVisits = visits.filter((v) => isSameDate(v.start, d) && v.status !== "missed");
          const needsCover = dVisits.some(needsAllocation);
          const selected = i === dayOffset;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setDayOffset(i)}
              className={`relative rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                selected ? "bg-brand-600 text-white shadow-sm" : "bg-brand-50 text-brand-900/60 hover:bg-brand-100"
              }`}
            >
              {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}
              <span className={`ml-1.5 text-xs ${selected ? "text-white/70" : "text-brand-900/40"}`}>{dVisits.length}</span>
              {needsCover && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-400" />}
            </button>
          );
        })}
        <span className="ml-auto hidden items-center gap-1.5 self-center text-xs text-brand-900/40 sm:flex">
          Drag a visit onto a carer to reassign — the engine blocks unsafe moves
        </span>
      </div>

      <div className="overflow-x-auto">
        <div style={{ width: 208 + LANE_WIDTH }}>
          {/* Time ruler */}
          <div className="flex border-b border-brand-100">
            <div className={`${LABEL_COL} sticky left-0 z-20 shrink-0 border-r border-brand-100 bg-white`} />
            <div className="relative h-7" style={{ width: LANE_WIDTH }}>
              {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i).map((h) => (
                <span
                  key={h}
                  className="absolute top-1.5 text-[10px] font-medium text-brand-900/40"
                  style={{ left: (h - DAY_START_HOUR) * 60 * PX_PER_MIN + 4 }}
                >
                  {String(h).padStart(2, "0")}:00
                </span>
              ))}
            </div>
          </div>

          {/* Unallocated lane */}
          <div className={`flex border-b border-brand-100 ${dragLane === "unallocated" ? "bg-rose-50/60" : "bg-rose-50/25"}`}>
            <div className={`${LABEL_COL} sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-brand-100 bg-rose-50 px-3 py-2`}>
              <AlertTriangle size={15} className="text-rose-400" />
              <div>
                <div className="text-xs font-semibold text-rose-500">Unallocated</div>
                <div className="text-[10px] text-brand-900/40">
                  {unallocatedVisits.length === 0 ? "All covered today" : `${unallocatedVisits.length} visit${unallocatedVisits.length === 1 ? "" : "s"} need cover`}
                </div>
              </div>
            </div>
            <div className="relative h-16" style={{ width: LANE_WIDTH }} {...laneProps("unallocated")}>
              <HourGrid />
              <NowLine day={day} />
              {unallocatedVisits.map((v) => (
                <TimelineBlock key={v.id} visit={v} laneCarerId={null} issues={analysis.byVisit.get(v.id) ?? []} />
              ))}
            </div>
          </div>

          {/* Carer lanes */}
          {carers.map((carer) => {
            const sick = sickCarerIds.includes(carer.id);
            const laneVisits = dayVisits.filter((v) => v.carerIds.includes(carer.id));
            const hours = scheduledHours(carer.id, visits);
            return (
              <div key={carer.id} className={`flex border-b border-brand-50 last:border-b-0 ${dragLane === carer.id ? "bg-brand-50/80" : ""}`}>
                <div
                  className={`${LABEL_COL} sticky left-0 z-20 flex shrink-0 items-center gap-2.5 border-r border-brand-100 bg-white px-3 py-2 ${sick ? "opacity-60" : ""}`}
                >
                  <Avatar initials={carer.initials} color={carer.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-brand-950">{carer.name}</div>
                    <div className="text-[10px] text-brand-900/45">
                      {sick ? (
                        <span className="font-semibold text-rose-500">Off sick</span>
                      ) : (
                        <>
                          {hours.toFixed(1)}h / {carer.contractedHours}h · {carer.zone}
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSick(carer)}
                    title={sick ? "Mark fit for work" : "Mark off sick — visits move to unallocated"}
                    className={`rounded-lg p-1.5 transition ${
                      sick ? "bg-rose-100 text-rose-500 hover:bg-rose-200" : "text-brand-900/30 hover:bg-rose-50 hover:text-rose-400"
                    }`}
                  >
                    <Thermometer size={14} />
                  </button>
                </div>
                <div className={`relative h-16 ${sick ? "bg-brand-50/40" : ""}`} style={{ width: LANE_WIDTH }} {...laneProps(carer.id)}>
                  <HourGrid />
                  <NowLine day={day} />
                  {laneVisits.map((v) => (
                    <TimelineBlock key={`${v.id}-${carer.id}`} visit={v} laneCarerId={carer.id} issues={analysis.byVisit.get(v.id) ?? []} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
