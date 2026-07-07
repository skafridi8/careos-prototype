import { useRoster } from "../../context/RosterContext";

const toneClasses = {
  sage: "border-sage-200 bg-sage-50 text-sage-800",
  rose: "border-rose-200 bg-rose-50 text-rose-500",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  brand: "border-brand-200 bg-brand-50 text-brand-800",
};

export default function Toast() {
  const { toast } = useRoster();
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div className={`rounded-2xl border px-4 py-2.5 text-sm font-medium shadow-lg ${toneClasses[toast.tone] ?? toneClasses.brand}`}>
        {toast.text}
      </div>
    </div>
  );
}
