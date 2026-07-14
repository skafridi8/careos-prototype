import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ShieldCheck } from "lucide-react";
import { complianceStats } from "../../data/compliance";
import { visits, isSameDate } from "../../data/visits";
import { clients } from "../../data/clients";
import { currentCarer } from "../../data/carers";
import { trainingForCarer, trainingStatusMeta } from "../../data/carerTraining";
import { startOfWeek, addDays, formatDate } from "../../utils/dates";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import ActivityFeed from "../../components/compliance/ActivityFeed";
import AlertsPanel from "../../components/compliance/AlertsPanel";
import { CheckCircle2, Pill, AlertTriangle, XCircle } from "lucide-react";

const statIcons = {
  "visits-on-time": CheckCircle2,
  "medication-logs": Pill,
  "overdue-reviews": AlertTriangle,
  "missed-visits": XCircle,
};

function buildChartData() {
  const weekStart = startOfWeek(new Date());
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((day) => {
    const dayVisits = visits.filter((v) => isSameDate(v.start, day));
    return {
      day: day.toLocaleDateString("en-GB", { weekday: "short" }),
      Completed: dayVisits.filter((v) => v.status === "completed").length,
      Upcoming: dayVisits.filter((v) => v.status === "upcoming" || v.status === "in-progress").length,
      Missed: dayVisits.filter((v) => v.status === "missed").length,
    };
  });
}

function MyCompliance() {
  const certs = trainingForCarer(currentCarer.id);
  const overdue = certs.filter((c) => c.status === "overdue").length;
  const dueSoon = certs.filter((c) => c.status === "due-soon").length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-sage-600" />
          <h1 className="text-2xl font-semibold text-brand-950">My Compliance</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-brand-900/50">
          {overdue > 0
            ? `${overdue} certificate${overdue === 1 ? "" : "s"} overdue — contact the office to book renewal.`
            : dueSoon > 0
              ? `${dueSoon} certificate${dueSoon === 1 ? "" : "s"} due soon.`
              : "All your certifications are up to date."}
        </p>
      </div>

      <Card padded={false} className="overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="border-b border-brand-100">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-brand-900/40">
                Certificate
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-brand-900/40">
                Expiry
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-brand-900/40">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {certs.map((cert) => {
              const meta = trainingStatusMeta[cert.status];
              return (
                <tr key={cert.id}>
                  <td className="px-3 py-2.5 text-sm text-brand-950">{cert.label}</td>
                  <td className="px-3 py-2.5 text-sm text-brand-900/60">{formatDate(cert.expiry)}</td>
                  <td className="px-3 py-2.5">
                    <Badge color={meta.color}>{meta.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default function Compliance() {
  const { isManager } = useAuth();
  const chartData = buildChartData();
  const syncedCount = clients.filter((c) => c.gpConnect?.synced).length;

  if (!isManager) return <MyCompliance />;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Compliance</h1>
        <p className="text-sm text-brand-900/50">
          Live view of visits, medication and reviews — sourced from the same record as Care Planning and Rostering.
        </p>
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
        {complianceStats.map((s) => (
          <StatCard key={s.id} label={s.label} value={s.value} sublabel={s.sublabel} tone={s.tone} icon={statIcons[s.id]} />
        ))}
      </div>

      <Card className="flex items-center gap-3 bg-sage-50">
        <ShieldCheck size={20} className="shrink-0 text-sage-600" />
        <div className="text-sm text-sage-800">
          <span className="font-semibold">NHS GP Connect:</span> {syncedCount} of {clients.length} client records synced
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-900/40">Visits this week</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe9fa" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#213b61" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#213b61" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Completed" stackId="a" fill="#4f8965" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Upcoming" stackId="a" fill="#3a84d1" />
              <Bar dataKey="Missed" stackId="a" fill="#c74d51" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="flex flex-wrap gap-5">
        <div className="min-w-0 flex-[2] basis-[480px]">
          <ActivityFeed limit={12} />
        </div>
        <div className="min-w-0 flex-1 basis-[280px]">
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
}
