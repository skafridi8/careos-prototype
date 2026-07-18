import { NavLink } from "react-router-dom";
import {
  ClipboardList,
  CalendarClock,
  ShieldCheck,
  HeartPulse,
  Sparkles,
  GraduationCap,
  UserPlus,
  Clock3,
  Database,
  BarChart3,
  Radio,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRoster } from "../../context/RosterContext";

const navItems = [
  { to: "/app/clients", label: "Care Planning", icon: ClipboardList, managerOnly: true },
  { to: "/app/ai", label: "AI Care Notes", icon: Sparkles, accent: true, managerOnly: true, badgeKey: "ai" },
  { to: "/app/roster", label: "Rostering", icon: CalendarClock, managerOnly: true, badgeKey: "roster" },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, managerOnly: true },
  { to: "/app/live", label: "Live Visits", icon: Radio, managerOnly: true },
  { to: "/app/compliance", label: "Compliance", carerLabel: "My Compliance", icon: ShieldCheck },
];

const formItems = [
  { to: "/app/forms/training", label: "Training log", icon: GraduationCap },
  { to: "/app/forms/client-intake", label: "New client sign-up", icon: UserPlus, managerOnly: true },
  { to: "/app/forms/timesheet", label: "Weekly hours & pay", icon: Clock3 },
  { to: "/app/records", label: "Records", carerLabel: "My Records", icon: Database },
];

export default function Sidebar() {
  const { isManager } = useAuth();
  const { unseenCarerNotesCount, pendingCarerRequests, pendingPublish } = useRoster();
  const visibleNavItems = navItems.filter((item) => isManager || !item.managerOnly);
  const visibleFormItems = formItems.filter((item) => isManager || !item.managerOnly);
  const badgeCounts = isManager
    ? { ai: unseenCarerNotesCount, roster: pendingCarerRequests + (pendingPublish > 0 ? 1 : 0) }
    : {};

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-brand-100/70 bg-white/55 p-5 backdrop-blur-md">
      <div className="flex items-center gap-2.5 px-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-sage-600 text-white shadow-card">
          <HeartPulse size={19} />
        </span>
        <span className="text-[19px] font-bold tracking-tight text-brand-950">tendly</span>
      </div>
      <nav className="flex flex-col gap-1">
        {visibleNavItems.map(({ to, label, carerLabel, icon: Icon, accent, badgeKey }) => {
          const badgeCount = badgeKey ? badgeCounts[badgeKey] : 0;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? accent
                      ? "bg-white text-amber-700 shadow-card ring-1 ring-amber-200/70"
                      : "bg-white text-brand-800 shadow-card ring-1 ring-brand-100"
                    : accent
                      ? "text-amber-700/80 hover:bg-amber-50/70 hover:text-amber-700"
                      : "text-brand-900/55 hover:bg-white/70 hover:text-brand-900/80"
                }`
              }
            >
              <Icon size={18} />
              {isManager ? label : (carerLabel ?? label)}
              {badgeCount > 0 ? (
                <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {badgeCount}
                </span>
              ) : (
                accent && (
                  <span className="ml-auto rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    New
                  </span>
                )
              )}
            </NavLink>
          );
        })}
      </nav>

      <div>
        <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-brand-900/30">Data & forms</p>
        <nav className="flex flex-col gap-1">
          {visibleFormItems.map(({ to, label, carerLabel, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white text-brand-800 shadow-card ring-1 ring-brand-100"
                    : "text-brand-900/55 hover:bg-white/70 hover:text-brand-900/80"
                }`
              }
            >
              <Icon size={18} />
              {isManager ? label : (carerLabel ?? label)}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto rounded-xl bg-gradient-to-br from-sage-50 to-brand-50 p-3 text-xs leading-relaxed text-sage-700 ring-1 ring-sage-100">
        {isManager
          ? "One shared record across care planning, rostering & compliance."
          : "Your schedule, notes and requests all sync from your mobile app."}
      </div>
    </aside>
  );
}
