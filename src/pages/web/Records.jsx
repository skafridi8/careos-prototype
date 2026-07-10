import { useEffect, useState } from "react";
import { GraduationCap, UserPlus, Clock3, Database } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";

const TABS = [
  { id: "training", label: "Training records", icon: GraduationCap },
  { id: "clients", label: "Client sign-ups", icon: UserPlus },
  { id: "timesheets", label: "Hours & pay", icon: Clock3 },
];

export default function Records() {
  const { isManager } = useAuth();
  const [tab, setTab] = useState("training");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const table = tab === "training" ? "carer_training" : tab === "clients" ? "client_intake" : "carer_timesheets";
      const ownerCol = tab === "clients" ? "submitted_by" : "carer_id";
      const { data, error } = await supabase
        .from(table)
        .select(`*, profiles:${ownerCol} (full_name, email)`)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        if (error) console.error(error.message);
        setRows(data ?? []);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Records</h1>
        <p className="text-sm text-brand-900/50">
          {isManager
            ? "Every training record, client sign-up and timesheet submitted by the team."
            : "Records you've submitted. Managers see the whole team's data here."}
        </p>
      </div>

      <div className="flex gap-1 rounded-lg bg-brand-50 p-1 text-sm font-medium w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
              tab === id ? "bg-white text-brand-800 shadow-sm" : "text-brand-900/50 hover:text-brand-700"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="text-sm text-brand-900/40">Loading…</Card>
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-10 text-center text-brand-900/40">
          <Database size={22} />
          <span className="text-sm">No records yet in this table.</span>
        </Card>
      ) : tab === "training" ? (
        <TrainingTable rows={rows} />
      ) : tab === "clients" ? (
        <ClientTable rows={rows} />
      ) : (
        <TimesheetTable rows={rows} />
      )}
    </div>
  );
}

function Th({ children }) {
  return <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-brand-900/40">{children}</th>;
}
function Td({ children }) {
  return <td className="px-3 py-2.5 text-sm text-brand-950">{children}</td>;
}
function Table({ children }) {
  return (
    <Card padded={false} className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">{children}</table>
    </Card>
  );
}

const levelTone = { "In training": "amber", Competent: "sage", "Expert / Trainer": "brand" };

function TrainingTable({ rows }) {
  return (
    <Table>
      <thead className="border-b border-brand-100">
        <tr>
          <Th>Carer</Th>
          <Th>Condition</Th>
          <Th>Training</Th>
          <Th>Level</Th>
          <Th>Completed</Th>
          <Th>Expires</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-brand-50">
        {rows.map((r) => (
          <tr key={r.id}>
            <Td>{r.profiles?.full_name || r.profiles?.email || "—"}</Td>
            <Td>{r.condition}</Td>
            <Td>{r.training_name}</Td>
            <Td>
              <Badge color={levelTone[r.competency_level] ?? "brand"}>{r.competency_level}</Badge>
            </Td>
            <Td>{r.completed_date}</Td>
            <Td>{r.expiry_date || "—"}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function ClientTable({ rows }) {
  const totalMonthly = rows.reduce((s, r) => s + Number(r.monthly_cost || 0), 0);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
        <StatCard label="Clients signed up" value={rows.length} tone="brand" icon={UserPlus} />
        <StatCard
          label="Total est. monthly revenue"
          value={`£${totalMonthly.toFixed(0)}`}
          tone="sage"
          icon={Database}
        />
      </div>
      <Table>
        <thead className="border-b border-brand-100">
          <tr>
            <Th>Client</Th>
            <Th>Plan</Th>
            <Th>Care needs</Th>
            <Th>Hrs / wk</Th>
            <Th>Est. monthly cost</Th>
            <Th>Funding</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-50">
          {rows.map((r) => (
            <tr key={r.id}>
              <Td>{r.client_name}</Td>
              <Td>
                <Badge color="brand">{r.plan_tier}</Badge>
              </Td>
              <Td className="max-w-xs">{(r.care_needs || []).join(", ") || "—"}</Td>
              <Td>{r.weekly_hours}</Td>
              <Td>£{Number(r.monthly_cost || 0).toFixed(2)}</Td>
              <Td>{r.funding_source}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function TimesheetTable({ rows }) {
  const totalHours = rows.reduce((s, r) => s + Number(r.hours_worked), 0);
  const totalPay = rows.reduce((s, r) => s + Number(r.gross_pay), 0);
  const totalHoliday = rows.reduce((s, r) => s + Number(r.holiday_hours_accrued), 0);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
        <StatCard label="Total hours logged" value={totalHours.toFixed(1)} tone="brand" icon={Clock3} />
        <StatCard label="Total gross pay" value={`£${totalPay.toFixed(2)}`} tone="sage" icon={Database} />
        <StatCard label="Holiday accrued" value={`${totalHoliday.toFixed(1)} hrs`} tone="amber" icon={Clock3} />
      </div>
      <Table>
        <thead className="border-b border-brand-100">
          <tr>
            <Th>Carer</Th>
            <Th>Week commencing</Th>
            <Th>Days</Th>
            <Th>Hours</Th>
            <Th>Rate</Th>
            <Th>Gross pay</Th>
            <Th>Holiday accrued</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-50">
          {rows.map((r) => (
            <tr key={r.id}>
              <Td>{r.profiles?.full_name || r.profiles?.email || "—"}</Td>
              <Td>{r.week_start_date}</Td>
              <Td>{r.days_worked}</Td>
              <Td>{r.hours_worked}</Td>
              <Td>£{Number(r.hourly_rate).toFixed(2)}</Td>
              <Td>£{Number(r.gross_pay).toFixed(2)}</Td>
              <Td>{Number(r.holiday_hours_accrued).toFixed(2)} hrs</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
