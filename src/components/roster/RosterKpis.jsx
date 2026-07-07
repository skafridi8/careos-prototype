import { CalendarCheck2, UserX, AlertTriangle, HeartHandshake, Gauge } from "lucide-react";
import Card from "../ui/Card";
import { statCardClasses } from "../ui/colors";
import { useRoster } from "../../context/RosterContext";

function Kpi({ icon: Icon, label, value, sublabel, tone }) {
  return (
    <Card className="flex flex-col gap-1 !p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-brand-900/60">{label}</span>
        <Icon size={16} className={statCardClasses[tone] ?? statCardClasses.brand} />
      </div>
      <span className={`text-2xl font-semibold ${statCardClasses[tone] ?? statCardClasses.brand}`}>{value}</span>
      <span className="text-[11px] leading-tight text-brand-900/50">{sublabel}</span>
    </Card>
  );
}

export default function RosterKpis() {
  const { metrics, analysis } = useRoster();
  const issueCount = analysis.errors + analysis.warnings;

  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
      <Kpi icon={CalendarCheck2} label="Visits this week" value={metrics.total} sublabel="Across 8 clients, 6 carers" tone="brand" />
      <Kpi
        icon={UserX}
        label="Unallocated"
        value={metrics.unallocated}
        sublabel={metrics.unallocated > 0 ? "Needs cover — try AI auto-fix" : "Every visit is covered"}
        tone={metrics.unallocated > 0 ? "rose" : "sage"}
      />
      <Kpi
        icon={AlertTriangle}
        label="Conflicts"
        value={issueCount}
        sublabel={
          issueCount > 0 ? `${analysis.errors} blocking · ${analysis.warnings} to review` : "No clashes detected"
        }
        tone={analysis.errors > 0 ? "rose" : analysis.warnings > 0 ? "amber" : "sage"}
      />
      <Kpi
        icon={HeartHandshake}
        label="Continuity of care"
        value={`${metrics.continuity}%`}
        sublabel="Visits by a familiar carer"
        tone={metrics.continuity >= 85 ? "sage" : "amber"}
      />
      <Kpi
        icon={Gauge}
        label="Carer utilisation"
        value={`${metrics.utilisation}%`}
        sublabel="Scheduled vs contracted hours"
        tone={metrics.utilisation > 100 ? "amber" : "brand"}
      />
    </div>
  );
}
