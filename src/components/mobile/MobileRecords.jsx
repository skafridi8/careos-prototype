import { useState } from "react";
import { Clock3, GraduationCap, Check } from "lucide-react";
import { useRoster } from "../../context/RosterContext";
import { formatDate } from "../../utils/dates";

function SectionTabs({ active, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 self-start rounded-full bg-brand-100/70 p-1">
      {[
        { id: "timesheet", label: "Hours", icon: Clock3 },
        { id: "training", label: "Training", icon: GraduationCap },
      ].map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            active === t.id ? "bg-white text-brand-800 shadow-sm" : "text-brand-900/50"
          }`}
        >
          <t.icon size={13} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function MobileRecords({ carer }) {
  const { carerTimesheets, addCarerTimesheet, carerTrainingLogs, addCarerTrainingLog } = useRoster();
  const [tab, setTab] = useState("timesheet");
  const [hours, setHours] = useState("");
  const [courseName, setCourseName] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const myTimesheets = carerTimesheets.filter((t) => t.carerId === carer.id);
  const myTraining = carerTrainingLogs.filter((t) => t.carerId === carer.id);

  function submitTimesheet(e) {
    e.preventDefault();
    if (!hours) return;
    addCarerTimesheet({ carerId: carer.id, hours: Number(hours) });
    setHours("");
    flashConfirm();
  }

  function submitTraining(e) {
    e.preventDefault();
    if (!courseName.trim()) return;
    addCarerTrainingLog({ carerId: carer.id, course: courseName.trim() });
    setCourseName("");
    flashConfirm();
  }

  function flashConfirm() {
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold text-brand-950">Records</h1>
        <p className="text-sm text-brand-900/50">Log your hours or a completed training course.</p>
      </div>

      <SectionTabs active={tab} onChange={setTab} />

      {tab === "timesheet" ? (
        <form onSubmit={submitTimesheet} className="rounded-2xl border border-brand-100 bg-white p-3.5">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-900/40">
            Hours worked today
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 7.5"
              className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm outline-none focus:border-brand-300"
            />
            <button type="submit" className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Save
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitTraining} className="rounded-2xl border border-brand-100 bg-white p-3.5">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-900/40">
            Course / certification completed
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Moving & Handling refresher"
              className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm outline-none focus:border-brand-300"
            />
            <button type="submit" className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Save
            </button>
          </div>
        </form>
      )}

      {confirmed && (
        <div className="flex items-center gap-1.5 rounded-xl bg-sage-100 px-3 py-2 text-xs font-medium text-sage-700">
          <Check size={13} /> Saved to the office record.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {(tab === "timesheet" ? myTimesheets : myTraining).map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-brand-50 bg-white px-3 py-2.5 text-sm">
            <span className="text-brand-900/80">{tab === "timesheet" ? `${r.hours} hrs` : r.course}</span>
            <span className="text-xs text-brand-900/40">{formatDate(r.createdAt)}</span>
          </div>
        ))}
        {(tab === "timesheet" ? myTimesheets : myTraining).length === 0 && (
          <div className="rounded-2xl border border-dashed border-brand-200 p-5 text-center text-sm text-brand-900/40">
            Nothing logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
