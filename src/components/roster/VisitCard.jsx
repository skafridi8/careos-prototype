import { Link } from "react-router-dom";
import { AlertTriangle, UserPlus } from "lucide-react";
import { clientById } from "../../data/clients";
import { carerById } from "../../data/carers";
import { statusMeta } from "../../data/visits";
import { formatTime } from "../../utils/dates";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";

export default function VisitCard({ visit, issues = [], onOpen }) {
  const client = clientById(visit.clientId);
  const carers = visit.carerIds.map((id) => carerById(id)).filter(Boolean);
  const status = statusMeta[visit.status];
  const hasError = issues.some((i) => i.severity === "error");
  const hasWarning = issues.some((i) => i.severity === "warning");
  const unallocated = visit.carerIds.length === 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(visit.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen?.(visit.id);
      }}
      className={`cursor-pointer rounded-xl border bg-white p-3 shadow-sm transition hover:shadow-md ${
        unallocated ? "border-dashed border-rose-300 bg-rose-50/40" : "border-brand-100"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-900/70">
          {formatTime(visit.start)}–{formatTime(visit.end)}
          {(hasError || hasWarning) && (
            <AlertTriangle size={12} className={hasError ? "text-rose-500" : "text-amber-500"} />
          )}
        </span>
        <Badge color={status.color}>{status.label}</Badge>
      </div>
      <Link
        to={`/app/clients/${client.id}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 block text-sm font-medium text-brand-950 hover:underline"
      >
        {client.name}
      </Link>
      <div className="text-xs text-brand-900/50">{visit.type}</div>

      {unallocated ? (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-50 px-2 py-1.5 text-[11px] font-medium text-rose-500">
          <UserPlus size={12} /> Needs a carer — click to assign
        </div>
      ) : visit.doubleUp ? (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 px-2 py-1.5">
          <div className="flex -space-x-2">
            {carers.map((c) => (
              <Avatar key={c.id} initials={c.initials} color={c.color} size="sm" />
            ))}
          </div>
          <span className="text-[11px] font-medium text-amber-700">
            Double-up: {carers.map((c) => c.name.split(" ")[0]).join(" & ")}
          </span>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-1.5">
          <Avatar initials={carers[0]?.initials} color={carers[0]?.color} size="sm" />
          <span className="text-xs text-brand-900/60">{carers[0]?.name}</span>
        </div>
      )}
    </div>
  );
}
