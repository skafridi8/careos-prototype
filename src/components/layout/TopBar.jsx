import { Link } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import ViewModeToggle from "./ViewModeToggle";
import { useAuth } from "../../context/AuthContext";

export default function TopBar() {
  const { profile, isManager, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-brand-100 bg-white/80 px-6 py-3">
      <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-brand-900/50 hover:text-brand-700">
        <ArrowLeft size={15} />
        Why CareOS
      </Link>
      <div className="flex items-center gap-4">
        <ViewModeToggle />
        {profile && (
          <div className="flex items-center gap-3 border-l border-brand-100 pl-4">
            <span className="text-sm text-brand-900/60">
              {profile.full_name || profile.email}
              <span className="ml-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                {isManager ? "Manager" : "Carer"}
              </span>
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-sm font-medium text-brand-900/40 hover:text-rose-600"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
