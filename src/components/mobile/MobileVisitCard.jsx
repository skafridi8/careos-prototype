import { Users2, ChevronRight } from "lucide-react";
import { clientById } from "../../data/clients";
import { carerById } from "../../data/carers";
import { formatTime } from "../../utils/dates";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import { careSettingMeta } from "../../data/clients";

const statusBadge = {
  completed: { label: "Completed", color: "sage" },
  upcoming: { label: "Upcoming", color: "brand" },
  "in-progress": { label: "In progress", color: "amber" },
  missed: { label: "Missed", color: "rose" },
};

export default function MobileVisitCard({ visit, status, onClick, currentCarerId, isNew }) {
  const client = clientById(visit.clientId);
  const partner = visit.carerIds.find((id) => id !== currentCarerId);
  const partnerCarer = partner ? carerById(partner) : null;
  const badge = statusBadge[status] ?? statusBadge.upcoming;
  const setting = careSettingMeta[client.careSetting];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3.5 text-left shadow-sm active:scale-[0.99] ${
        isNew ? "border-brand-300 ring-2 ring-brand-200" : "border-brand-100"
      }`}
    >
      <Avatar initials={client.initials} color={client.avatarColor} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-950">
            {formatTime(visit.start)}
            {isNew && (
              <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-700">
                New
              </span>
            )}
          </span>
          <Badge color={badge.color} className="shrink-0">{badge.label}</Badge>
        </div>
        <div className="truncate text-sm font-medium text-brand-900">{client.name}</div>
        <div className="mt-0.5 truncate text-xs text-brand-900/50">{visit.type}</div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <Badge color={setting.color} className="text-[10px]">{setting.label}</Badge>
          {partnerCarer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              <Users2 size={11} />
              With {partnerCarer.name.split(" ")[0]}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="shrink-0 text-brand-900/30" />
    </button>
  );
}
