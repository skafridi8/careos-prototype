import { BellRing, X } from "lucide-react";

export default function RotaUpdateBanner({ update, onDismiss }) {
  const { added, removed } = update;
  const parts = [];
  if (added) parts.push(`${added} visit${added === 1 ? "" : "s"} added`);
  if (removed) parts.push(`${removed} removed`);
  const detail = parts.length ? parts.join(" · ") : "No changes to your round";

  return (
    <div className="flex items-center gap-2 bg-brand-600 px-3 py-2 text-white">
      <BellRing size={15} className="shrink-0" />
      <div className="min-w-0 flex-1 text-xs">
        <span className="font-semibold">Rota updated by the office</span>
        <span className="text-white/80"> — {detail}</span>
      </div>
      <button type="button" onClick={onDismiss} className="shrink-0 rounded-full p-0.5 text-white/70 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
}
