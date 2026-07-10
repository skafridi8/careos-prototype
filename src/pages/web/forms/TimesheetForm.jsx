import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../context/AuthContext";
import Card from "../../../components/ui/Card";
import { TextField, FieldRow } from "../../../components/ui/form/Field";
import { SubmitButton, FormBanner } from "../../../components/ui/form/FormStatus";

function mondayOf(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

const todayMonday = mondayOf(new Date().toISOString().slice(0, 10));

export default function TimesheetForm() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    week_start_date: todayMonday,
    days_worked: "5",
    hours_worked: "",
    hourly_rate: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [yearSummary, setYearSummary] = useState(null);

  useEffect(() => {
    if (profile?.hourly_rate != null) {
      setForm((f) => (f.hourly_rate ? f : { ...f, hourly_rate: String(profile.hourly_rate) }));
    }
  }, [profile?.hourly_rate]);

  async function loadSummary() {
    if (!user) return;
    const year = new Date(form.week_start_date || todayMonday).getFullYear();
    const { data, error } = await supabase
      .from("carer_timesheets")
      .select("hours_worked, gross_pay, holiday_hours_accrued")
      .eq("carer_id", user.id)
      .eq("year", year);
    if (!error && data) {
      setYearSummary({
        year,
        totalHours: data.reduce((s, r) => s + Number(r.hours_worked), 0),
        totalPay: data.reduce((s, r) => s + Number(r.gross_pay), 0),
        holidayHours: data.reduce((s, r) => s + Number(r.holiday_hours_accrued), 0),
        weeksLogged: data.length,
      });
    }
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  const hours = parseFloat(form.hours_worked) || 0;
  const rate = parseFloat(form.hourly_rate) || 0;
  const grossPay = (hours * rate).toFixed(2);
  const holidayAccrued = (hours * 0.1207).toFixed(2);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    const week_start_date = mondayOf(form.week_start_date);
    const { error } = await supabase.from("carer_timesheets").upsert(
      {
        carer_id: user.id,
        week_start_date,
        year: new Date(week_start_date).getFullYear(),
        days_worked: Number(form.days_worked) || 0,
        hours_worked: hours,
        hourly_rate: rate,
        notes: form.notes,
      },
      { onConflict: "carer_id,week_start_date" }
    );
    setSubmitting(false);
    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      setStatus({ type: "success", message: `Week of ${week_start_date} saved: £${grossPay} gross pay.` });
      setForm((f) => ({ ...f, hours_worked: "", notes: "" }));
      loadSummary();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Weekly hours & pay</h1>
        <p className="text-sm text-brand-900/50">
          Log the days and hours you worked this week. Pay and statutory holiday accrual (12.07% of hours) are
          calculated automatically.
        </p>
      </div>

      <div className="flex flex-wrap gap-5">
        <Card className="max-w-xl flex-1 basis-[420px]">
          <div className="mb-4 flex items-center gap-2 text-brand-700">
            <Clock3 size={18} />
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-900/40">
              {profile?.full_name ? `Timesheet for ${profile.full_name}` : "New weekly timesheet"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldRow cols={2}>
              <TextField
                label="Week commencing (Monday)"
                type="date"
                required
                value={form.week_start_date}
                onChange={update("week_start_date")}
              />
              <TextField
                label="Days worked this week"
                type="number"
                min="0"
                max="7"
                required
                value={form.days_worked}
                onChange={update("days_worked")}
              />
            </FieldRow>

            <FieldRow cols={2}>
              <TextField
                label="Total hours worked"
                type="number"
                min="0"
                step="0.25"
                required
                value={form.hours_worked}
                onChange={update("hours_worked")}
              />
              <TextField
                label="Hourly rate (£)"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.hourly_rate}
                onChange={update("hourly_rate")}
                hint="editable if this week differs"
              />
            </FieldRow>

            <TextField label="Notes" hint="optional" value={form.notes} onChange={update("notes")} />

            <div className="grid grid-cols-2 gap-3 rounded-lg bg-sage-50 px-3 py-3 text-sm text-sage-800">
              <div>
                Gross pay: <span className="font-semibold">£{grossPay}</span>
              </div>
              <div>
                Holiday accrued: <span className="font-semibold">{holidayAccrued} hrs</span>
              </div>
            </div>

            <FormBanner status={status} />

            <div>
              <SubmitButton submitting={submitting}>Save week</SubmitButton>
            </div>
          </form>
        </Card>

        <Card className="h-fit flex-1 basis-[260px]">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-900/40">
            {yearSummary ? `${yearSummary.year} so far` : "Year to date"}
          </span>
          {yearSummary ? (
            <div className="mt-3 flex flex-col gap-3 text-sm">
              <SummaryRow label="Weeks logged" value={yearSummary.weeksLogged} />
              <SummaryRow label="Total hours worked" value={yearSummary.totalHours.toFixed(1)} />
              <SummaryRow label="Total gross pay" value={`£${yearSummary.totalPay.toFixed(2)}`} />
              <SummaryRow label="Holiday accrued" value={`${yearSummary.holidayHours.toFixed(1)} hrs`} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-brand-900/40">No timesheets logged yet this year.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-brand-50 pb-2 last:border-0 last:pb-0">
      <span className="text-brand-900/50">{label}</span>
      <span className="font-semibold text-brand-950">{value}</span>
    </div>
  );
}
