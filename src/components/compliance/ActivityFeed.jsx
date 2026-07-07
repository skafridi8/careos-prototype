import { Link } from "react-router-dom";
import { CalendarCheck, FileText, Pill, CalendarClock, ClipboardEdit, AlertOctagon } from "lucide-react";
import { auditLog, activityTypeMeta } from "../../data/compliance";
import { clientById } from "../../data/clients";
import { formatRelativeTime } from "../../utils/dates";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

const icons = {
  "visit-completed": CalendarCheck,
  "care-note": FileText,
  "medication-log": Pill,
  "schedule-change": CalendarClock,
  "plan-update": ClipboardEdit,
  "missed-visit": AlertOctagon,
};

export default function ActivityFeed({ limit }) {
  const entries = limit ? auditLog.slice(0, limit) : auditLog;

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-900/40">Activity feed</h2>
        <span className="text-xs text-brand-900/40">Care notes, visits & schedule changes — one timeline</span>
      </div>
      <div className="flex flex-col">
        {entries.map((entry, i) => {
          const Icon = icons[entry.type] ?? FileText;
          const meta = activityTypeMeta[entry.type];
          const client = entry.clientId ? clientById(entry.clientId) : null;
          return (
            <div key={entry.id} className={`flex gap-3 py-3 ${i > 0 ? "border-t border-brand-50" : ""}`}>
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <Icon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-brand-950">{entry.action}</span>
                  <Badge color={meta?.color ?? "brand"}>{meta?.label ?? entry.type}</Badge>
                  {client && (
                    <Link to={`/app/clients/${client.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                      {client.name}
                    </Link>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-brand-900/60">{entry.text}</p>
                <div className="mt-1 text-xs text-brand-900/35">
                  {entry.actor} · {formatRelativeTime(entry.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
