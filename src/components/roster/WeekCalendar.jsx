import { startOfWeek, addDays, formatDayLabel, isSameDay } from "../../utils/dates";
import { isSameDate } from "../../data/visits";
import { useRoster } from "../../context/RosterContext";
import VisitCard from "./VisitCard";

export default function WeekCalendar() {
  const { visits, analysis, openVisit } = useRoster();
  const weekStart = startOfWeek(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
      {days.map((day) => {
        const dayVisits = visits
          .filter((v) => isSameDate(v.start, day))
          .sort((a, b) => a.start.getTime() - b.start.getTime());
        const today = isSameDay(day, new Date());
        return (
          <div key={day.toISOString()} className={`flex flex-col gap-2 rounded-2xl p-2 ${today ? "bg-brand-100/50" : ""}`}>
            <div className="flex items-center justify-between px-1">
              <span className={`text-xs font-semibold ${today ? "text-brand-700" : "text-brand-900/50"}`}>
                {formatDayLabel(day)}
              </span>
              {today && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white">Today</span>}
            </div>
            <div className="flex max-h-[640px] flex-col gap-2 overflow-y-auto">
              {dayVisits.map((v) => (
                <VisitCard key={v.id} visit={v} issues={analysis.byVisit.get(v.id) ?? []} onOpen={openVisit} />
              ))}
              {dayVisits.length === 0 && <div className="px-1 text-xs text-brand-900/30">No visits</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
