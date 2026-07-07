import { Monitor, Smartphone, Columns2 } from "lucide-react";
import { useViewMode } from "../../context/ViewModeContext";

const options = [
  { id: "web", label: "Web", icon: Monitor },
  { id: "split", label: "Both", icon: Columns2 },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

export default function ViewModeToggle() {
  const { viewMode, setViewMode } = useViewMode();
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-brand-100/70 p-1">
      {options.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setViewMode(id)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
            viewMode === id ? "bg-white text-brand-800 shadow-sm" : "text-brand-900/50 hover:text-brand-800"
          }`}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}
