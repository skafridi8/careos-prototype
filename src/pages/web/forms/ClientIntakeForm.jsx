import { useState } from "react";
import { UserPlus } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../context/AuthContext";
import Card from "../../../components/ui/Card";
import { TextField, TextAreaField, SelectField, FieldRow, PillCheckboxGroup, CheckboxField } from "../../../components/ui/form/Field";
import { SubmitButton, FormBanner } from "../../../components/ui/form/FormStatus";

const CARE_NEEDS = [
  "Dementia",
  "Mobility support",
  "Medication",
  "Personal care",
  "Meal preparation",
  "Diabetes",
  "Parkinson's disease",
  "Continence care",
  "Companionship",
  "Live-in care",
];

const emptyForm = {
  client_name: "",
  date_of_birth: "",
  contact_phone: "",
  contact_email: "",
  address: "",
  plan_tier: "Standard",
  weekly_visits: "",
  weekly_hours: "",
  hourly_rate_charged: "28.50",
  funding_source: "Self-funded",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  consent_data_processing: false,
  notes: "",
};

export default function ClientIntakeForm() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [careNeeds, setCareNeeds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function toggleNeed(need) {
    setCareNeeds((prev) => (prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]));
  }

  const weeklyHours = parseFloat(form.weekly_hours) || 0;
  const rate = parseFloat(form.hourly_rate_charged) || 0;
  const estMonthlyCost = ((weeklyHours * rate * 52) / 12).toFixed(2);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.consent_data_processing) {
      setStatus({ type: "error", message: "Client consent to data processing is required before saving." });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    const { error } = await supabase.from("client_intake").insert({
      submitted_by: user.id,
      client_name: form.client_name,
      date_of_birth: form.date_of_birth || null,
      contact_phone: form.contact_phone,
      contact_email: form.contact_email,
      address: form.address,
      care_needs: careNeeds,
      plan_tier: form.plan_tier,
      weekly_visits: Number(form.weekly_visits) || 0,
      weekly_hours: weeklyHours,
      hourly_rate_charged: rate,
      funding_source: form.funding_source,
      emergency_contact_name: form.emergency_contact_name,
      emergency_contact_phone: form.emergency_contact_phone,
      consent_data_processing: form.consent_data_processing,
      notes: form.notes,
    });
    setSubmitting(false);
    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      setStatus({ type: "success", message: `Client record for ${form.client_name} saved.` });
      setForm(emptyForm);
      setCareNeeds([]);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">New client sign-up</h1>
        <p className="text-sm text-brand-900/50">
          Register a new client, their care needs, and expected usage — used to estimate their ongoing care cost.
        </p>
      </div>

      <Card className="max-w-2xl">
        <div className="mb-4 flex items-center gap-2 text-brand-700">
          <UserPlus size={18} />
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-900/40">Client details</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldRow cols={2}>
            <TextField
              label="Client full name"
              required
              value={form.client_name}
              onChange={update("client_name")}
              placeholder="e.g. Margaret Wilson"
            />
            <TextField label="Date of birth" type="date" value={form.date_of_birth} onChange={update("date_of_birth")} />
          </FieldRow>

          <FieldRow cols={2}>
            <TextField
              label="Contact phone"
              type="tel"
              value={form.contact_phone}
              onChange={update("contact_phone")}
              placeholder="07…"
            />
            <TextField
              label="Contact email"
              type="email"
              value={form.contact_email}
              onChange={update("contact_email")}
              placeholder="optional"
            />
          </FieldRow>

          <TextAreaField label="Home address" value={form.address} onChange={update("address")} />

          <PillCheckboxGroup label="Care needs" required options={CARE_NEEDS} values={careNeeds} onToggle={toggleNeed} />

          <FieldRow cols={3}>
            <SelectField label="Care plan tier" value={form.plan_tier} onChange={update("plan_tier")}>
              <option>Essential</option>
              <option>Standard</option>
              <option>Premium</option>
              <option>Live-in</option>
            </SelectField>
            <TextField
              label="Visits per week"
              type="number"
              min="0"
              value={form.weekly_visits}
              onChange={update("weekly_visits")}
            />
            <TextField
              label="Care hours per week"
              type="number"
              min="0"
              step="0.5"
              value={form.weekly_hours}
              onChange={update("weekly_hours")}
            />
          </FieldRow>

          <FieldRow cols={2}>
            <TextField
              label="Hourly rate charged (£)"
              type="number"
              min="0"
              step="0.01"
              value={form.hourly_rate_charged}
              onChange={update("hourly_rate_charged")}
            />
            <SelectField label="Funding source" value={form.funding_source} onChange={update("funding_source")}>
              <option>Self-funded</option>
              <option>Local Authority</option>
              <option>NHS Continuing Healthcare</option>
              <option>Insurance</option>
              <option>Mixed</option>
            </SelectField>
          </FieldRow>

          <div className="rounded-lg bg-sage-50 px-3 py-2.5 text-sm text-sage-800">
            Estimated monthly cost: <span className="font-semibold">£{estMonthlyCost}</span>
          </div>

          <FieldRow cols={2}>
            <TextField
              label="Emergency contact name"
              value={form.emergency_contact_name}
              onChange={update("emergency_contact_name")}
            />
            <TextField
              label="Emergency contact phone"
              type="tel"
              value={form.emergency_contact_phone}
              onChange={update("emergency_contact_phone")}
            />
          </FieldRow>

          <TextAreaField label="Additional notes" hint="optional" value={form.notes} onChange={update("notes")} />

          <CheckboxField
            label="Client (or their representative) has consented to CareOS processing this data for care coordination purposes."
            checked={form.consent_data_processing}
            onChange={(e) => setForm((f) => ({ ...f, consent_data_processing: e.target.checked }))}
          />

          <FormBanner status={status} />

          <div>
            <SubmitButton submitting={submitting}>Save client record</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
