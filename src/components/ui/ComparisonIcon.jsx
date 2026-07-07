import { Check, X, Minus, HelpCircle } from "lucide-react";

const statusMap = {
  yes: { Icon: Check, wrap: "bg-sage-100 text-sage-600" },
  no: { Icon: X, wrap: "bg-rose-100 text-rose-500" },
  partial: { Icon: Minus, wrap: "bg-amber-100 text-amber-600" },
  unclear: { Icon: HelpCircle, wrap: "bg-brand-100 text-brand-500" },
};

export default function ComparisonIcon({ status, note, size = "md" }) {
  const { Icon, wrap } = statusMap[status] ?? statusMap.unclear;
  const dims = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  return (
    <span className="inline-flex flex-col items-center gap-1" title={note}>
      <span className={`inline-flex items-center justify-center rounded-full ${dims} ${wrap}`}>
        <Icon size={size === "sm" ? 14 : 18} strokeWidth={2.5} />
      </span>
    </span>
  );
}
