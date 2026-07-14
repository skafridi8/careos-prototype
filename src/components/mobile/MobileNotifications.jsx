import { useState } from "react";
import { Bell, X } from "lucide-react";
import { useRoster } from "../../context/RosterContext";
import { formatRelativeTime } from "../../utils/dates";

export function MobileNotificationsBell({ carerId, open, onToggle }) {
  const { unreadNotificationCount } = useRoster();
  const unread = unreadNotificationCount(carerId);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Notifications"
      className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-brand-900/70 shadow-sm backdrop-blur-sm hover:bg-white"
    >
      <Bell size={17} />
      {unread > 0 && !open && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {unread}
        </span>
      )}
    </button>
  );
}

export default function MobileNotificationsPanel({ carerId, onClose }) {
  const { notificationsForCarer } = useRoster();
  const items = notificationsForCarer(carerId);

  return (
    <div className="mx-3 mt-2 max-h-64 overflow-y-auto rounded-xl border border-brand-100 bg-white p-2 shadow-sm">
      <div className="flex items-center justify-between px-1.5 pb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-900/40">Notifications</span>
        <button type="button" onClick={onClose} className="text-brand-900/40 hover:text-brand-700">
          <X size={14} />
        </button>
      </div>
      {items.length === 0 ? (
        <div className="px-1.5 py-4 text-center text-xs text-brand-900/40">Nothing yet — updates from the office will show up here.</div>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((n) => (
            <div key={n.id} className="rounded-lg bg-brand-50/60 px-2.5 py-2 text-xs text-brand-900/80">
              <div>{n.message}</div>
              <div className="mt-0.5 text-brand-900/40">{formatRelativeTime(n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
