import Card from "./Card";
import { statCardClasses, softBgClasses } from "./colors";

export default function StatCard({ label, value, sublabel, tone = "brand", icon: Icon }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium tracking-tight text-brand-900/55">{label}</span>
        {Icon && (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-xl ${softBgClasses[tone] ?? softBgClasses.brand} ${statCardClasses[tone] ?? statCardClasses.brand}`}
          >
            <Icon size={16} />
          </span>
        )}
      </div>
      <span
        className={`text-3xl font-bold tracking-tight tabular-nums ${statCardClasses[tone] ?? statCardClasses.brand}`}
      >
        {value}
      </span>
      {sublabel && <span className="text-xs text-brand-900/50">{sublabel}</span>}
    </Card>
  );
}
