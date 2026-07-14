import { useNavigate } from "react-router-dom";
import { useRoster } from "../../context/RosterContext";

const toneClasses = {
  sage: "border-sage-200 bg-sage-50 text-sage-800",
  rose: "border-rose-200 bg-rose-50 text-rose-500",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  brand: "border-brand-200 bg-brand-50 text-brand-800",
};

export default function Toast() {
  const { toast } = useRoster();
  const navigate = useNavigate();
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm font-medium shadow-lg ${toneClasses[toast.tone] ?? toneClasses.brand}`}
      >
        <span className="pointer-events-none">{toast.text}</span>
        {toast.to && (
          <button
            type="button"
            onClick={() => navigate(toast.to)}
            className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold underline-offset-2 hover:underline"
          >
            {toast.actionLabel ?? "View"}
          </button>
        )}
      </div>
    </div>
  );
}
