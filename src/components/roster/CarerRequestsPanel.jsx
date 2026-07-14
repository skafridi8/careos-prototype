import { Bot, Calendar, Check, Flag, Repeat, X } from "lucide-react";
import { useRoster } from "../../context/RosterContext";
import { carerById } from "../../data/carers";
import Card from "../ui/Card";
import { formatRelativeTime } from "../../utils/dates";

const typeMeta = {
  "time-off": { label: "Time off", icon: Calendar, color: "text-brand-600" },
  "shift-swap": { label: "Shift swap", icon: Repeat, color: "text-amber-600" },
  flag: { label: "Flagged issue", icon: Flag, color: "text-rose-500" },
};

function requestDetail(request) {
  const { type, payload } = request;
  if (payload.summary) return payload.summary;
  if (type === "time-off") return payload.dates ? `Requesting ${payload.dates}` : "Requesting time off";
  if (type === "shift-swap") return "Cover needed for a visit";
  return payload.description || "No details given";
}

export default function CarerRequestsPanel() {
  const { carerRequests, resolveCarerRequest } = useRoster();
  const pending = carerRequests.filter((r) => r.status === "pending");

  if (pending.length === 0) return null;

  return (
    <Card padded={false} className="border-brand-200">
      <div className="flex items-center gap-2 border-b border-brand-100 bg-brand-50/60 px-4 py-2.5 rounded-t-2xl">
        <Bot size={15} className="text-brand-600" />
        <span className="text-sm font-semibold text-brand-800">
          {pending.length} carer request{pending.length === 1 ? "" : "s"} from the mobile AI assistant
        </span>
      </div>
      <ul className="divide-y divide-brand-50">
        {pending.map((r) => {
          const meta = typeMeta[r.type] ?? typeMeta.flag;
          const carer = carerById(r.carerId);
          return (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <meta.icon size={15} className={`shrink-0 ${meta.color}`} />
              <span className="min-w-0 flex-1 truncate text-sm text-brand-900/70">
                <span className="font-medium text-brand-950">{carer?.name ?? "Carer"}</span> — {meta.label.toLowerCase()}:{" "}
                {requestDetail(r)}
                <span className="ml-1.5 text-xs text-brand-900/35">· {formatRelativeTime(r.createdAt)}</span>
              </span>
              <button
                type="button"
                onClick={() => resolveCarerRequest(r.id, "approved")}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-700 transition hover:bg-sage-100"
              >
                <Check size={12} /> Approve
              </button>
              <button
                type="button"
                onClick={() => resolveCarerRequest(r.id, "declined")}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
              >
                <X size={12} /> Decline
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
