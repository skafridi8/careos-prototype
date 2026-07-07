import { NavLink } from "react-router-dom";
import { ClipboardList, CalendarClock, ShieldCheck, HeartPulse, Sparkles } from "lucide-react";

const navItems = [
  { to: "/app/clients", label: "Care Planning", icon: ClipboardList },
  { to: "/app/ai", label: "AI Care Notes", icon: Sparkles, accent: true },
  { to: "/app/roster", label: "Rostering", icon: CalendarClock },
  { to: "/app/compliance", label: "Compliance", icon: ShieldCheck },
];

export default function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-brand-100 bg-white/70 p-5">
      <div className="flex items-center gap-2 px-1">
        <HeartPulse size={22} className="text-brand-500" />
        <span className="text-lg font-semibold text-brand-950">CareOS</span>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, accent }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? accent
                    ? "bg-amber-100 text-amber-800"
                    : "bg-brand-100 text-brand-800"
                  : accent
                    ? "text-amber-700 hover:bg-amber-50"
                    : "text-brand-900/60 hover:bg-brand-50"
              }`
            }
          >
            <Icon size={18} />
            {label}
            {accent && (
              <span className="ml-auto rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                New
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto rounded-xl bg-sage-50 p-3 text-xs text-sage-700">
        One shared record across care planning, rostering & compliance.
      </div>
    </aside>
  );
}
