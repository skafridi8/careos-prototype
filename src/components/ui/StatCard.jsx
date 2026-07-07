import Card from "./Card";
import { statCardClasses } from "./colors";

export default function StatCard({ label, value, sublabel, tone = "brand", icon: Icon }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-brand-900/60">{label}</span>
        {Icon && <Icon size={18} className={statCardClasses[tone] ?? statCardClasses.brand} />}
      </div>
      <span className={`text-3xl font-semibold ${statCardClasses[tone] ?? statCardClasses.brand}`}>{value}</span>
      {sublabel && <span className="text-xs text-brand-900/50">{sublabel}</span>}
    </Card>
  );
}
