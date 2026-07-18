import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const options = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "system", icon: Monitor, label: "System" },
  { value: "dark", icon: Moon, label: "Dark" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-brand-100/60 p-0.5">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          title={`${label} theme`}
          aria-label={`${label} theme`}
          onClick={() => setTheme(value)}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${
            theme === value
              ? "bg-white text-brand-700 shadow-card"
              : "text-brand-900/40 hover:text-brand-900/70"
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
