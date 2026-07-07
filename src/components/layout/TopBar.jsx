import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ViewModeToggle from "./ViewModeToggle";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-brand-100 bg-white/80 px-6 py-3">
      <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-brand-900/50 hover:text-brand-700">
        <ArrowLeft size={15} />
        Why CareOS
      </Link>
      <ViewModeToggle />
    </header>
  );
}
