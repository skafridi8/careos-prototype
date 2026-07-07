import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { formatRelativeTime } from "../../utils/dates";

export default function OfflineStatusBar({ syncState, pendingChanges, onToggle, lastPublishedAt }) {
  const syncedText = lastPublishedAt
    ? `Rota synced · updated ${formatRelativeTime(lastPublishedAt)}`
    : "Synced just now";
  const config = {
    synced: { icon: Wifi, text: syncedText, classes: "bg-sage-100 text-sage-700" },
    offline: {
      icon: WifiOff,
      text: pendingChanges > 0 ? `Offline — ${pendingChanges} change${pendingChanges === 1 ? "" : "s"} pending sync` : "Offline — working locally",
      classes: "bg-amber-100 text-amber-700",
    },
    syncing: { icon: RefreshCw, text: "Syncing changes…", classes: "bg-brand-100 text-brand-700" },
  };
  const { icon: Icon, text, classes } = config[syncState] ?? config.synced;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={syncState === "syncing"}
      className={`sticky top-0 z-10 flex w-full items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium ${classes}`}
    >
      <Icon size={13} className={syncState === "syncing" ? "animate-spin" : ""} />
      {text}
    </button>
  );
}
