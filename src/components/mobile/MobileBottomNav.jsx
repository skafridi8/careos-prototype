import { CalendarCheck, MessageCircle, ShieldCheck, ClipboardList } from "lucide-react";

const tabs = [
  { id: "today", label: "Today", icon: CalendarCheck },
  { id: "assistant", label: "Assistant", icon: MessageCircle },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "records", label: "Records", icon: ClipboardList },
];

export default function MobileBottomNav({ active, onChange }) {
  return (
    <div className="flex shrink-0 items-center justify-around border-t border-brand-100 bg-white px-1 py-1.5">
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition ${
              isActive ? "text-brand-700" : "text-brand-900/40"
            }`}
          >
            <t.icon size={18} className={isActive ? "text-brand-600" : "text-brand-900/40"} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
