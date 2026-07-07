import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { formatWeekday, formatDate } from "../../utils/dates";
import Avatar from "../ui/Avatar";
import MobileVisitCard from "./MobileVisitCard";

function CarerSwitcher({ carer, carers, onSwitchCarer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-2xl border border-brand-100 bg-white p-2.5 text-left shadow-sm"
      >
        <Avatar initials={carer.initials} color={carer.color} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-brand-950">{carer.name}</div>
          <div className="text-[11px] text-brand-900/45">{carer.role}</div>
        </div>
        <ChevronDown size={16} className={`shrink-0 text-brand-900/40 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="fixed inset-0 z-10" />
          <div className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-lg">
            <div className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-brand-900/35">
              Demo · view another carer's phone
            </div>
            <div className="flex flex-col p-1">
              {carers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSwitchCarer(c.id);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2.5 rounded-xl px-2 py-2 text-left transition ${
                    c.id === carer.id ? "bg-brand-50" : "hover:bg-brand-50"
                  }`}
                >
                  <Avatar initials={c.initials} color={c.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-brand-950">{c.name}</div>
                    <div className="truncate text-[11px] text-brand-900/45">{c.role}</div>
                  </div>
                  {c.id === carer.id && <Check size={15} className="shrink-0 text-brand-600" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function MobileToday({ carer, carers, visits, overrides, highlight, onSwitchCarer, onSelectVisit }) {
  const today = new Date();

  return (
    <div className="flex flex-col gap-4 p-4">
      <CarerSwitcher carer={carer} carers={carers} onSwitchCarer={onSwitchCarer} />

      <div>
        <div className="text-xs font-medium text-brand-900/45">
          {formatWeekday(today)}, {formatDate(today)}
        </div>
        <h1 className="text-xl font-semibold text-brand-950">Hi {carer.name.split(" ")[0]}</h1>
        <p className="text-sm text-brand-900/50">
          {visits.length === 0
            ? "No visits on your round today"
            : `You have ${visits.length} visit${visits.length === 1 ? "" : "s"} today`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {visits.map((visit) => {
          const status = overrides.has(visit.id) ? "completed" : visit.status;
          return (
            <MobileVisitCard
              key={visit.id}
              visit={visit}
              status={status}
              isNew={highlight?.has(visit.id)}
              currentCarerId={carer.id}
              onClick={() => onSelectVisit(visit.id)}
            />
          );
        })}
        {visits.length === 0 && (
          <div className="rounded-2xl border border-dashed border-brand-200 p-6 text-center text-sm text-brand-900/40">
            No visits scheduled for today. Your round updates automatically when the office publishes the rota.
          </div>
        )}
      </div>
    </div>
  );
}
