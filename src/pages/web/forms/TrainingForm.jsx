import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../context/AuthContext";
import Card from "../../../components/ui/Card";
import { TextField, TextAreaField, SelectField, FieldRow } from "../../../components/ui/form/Field";
import { SubmitButton, FormBanner } from "../../../components/ui/form/FormStatus";

const CONDITIONS = [
  "Dementia",
  "Diabetes",
  "Parkinson's disease",
  "Dysphagia (swallowing)",
  "Stroke recovery",
  "Learning disability",
  "Mental health support",
  "Palliative / end of life care",
  "Catheter & continence care",
  "Moving & handling / hoist use",
  "Medication administration",
];

const emptyForm = {
  condition: CONDITIONS[0],
  training_name: "",
  provider: "",
  completed_date: "",
  expiry_date: "",
  competency_level: "Competent",
  assessor_name: "",
  notes: "",
};

export default function TrainingForm() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    const { error } = await supabase.from("carer_training").insert({
      carer_id: user.id,
      ...form,
      expiry_date: form.expiry_date || null,
    });
    setSubmitting(false);
    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      setStatus({
        type: "success",
        message: `Training record saved. You're now recorded as ${form.competency_level.toLowerCase()} in ${form.condition}.`,
      });
      setForm(emptyForm);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Carer training & competency</h1>
        <p className="text-sm text-brand-900/50">
          Log training you've completed. Coordinators use this to match you to clients with the same condition
          during rostering.
        </p>
      </div>

      <Card className="max-w-2xl">
        <div className="mb-4 flex items-center gap-2 text-brand-700">
          <GraduationCap size={18} />
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-900/40">
            {profile?.full_name ? `Logging for ${profile.full_name}` : "New training record"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldRow cols={2}>
            <SelectField label="Condition / specialism" required value={form.condition} onChange={update("condition")}>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Competency level"
              required
              value={form.competency_level}
              onChange={update("competency_level")}
            >
              <option value="In training">In training</option>
              <option value="Competent">Competent</option>
              <option value="Expert / Trainer">Expert / Trainer</option>
            </SelectField>
          </FieldRow>

          <TextField
            label="Training / course name"
            required
            placeholder="e.g. Dementia Care Level 2"
            value={form.training_name}
            onChange={update("training_name")}
          />

          <FieldRow cols={2}>
            <TextField
              label="Training provider"
              placeholder="e.g. Skills for Care"
              value={form.provider}
              onChange={update("provider")}
            />
            <TextField
              label="Assessor / signed off by"
              placeholder="e.g. Care manager name"
              value={form.assessor_name}
              onChange={update("assessor_name")}
            />
          </FieldRow>

          <FieldRow cols={2}>
            <TextField
              label="Date completed"
              type="date"
              required
              value={form.completed_date}
              onChange={update("completed_date")}
            />
            <TextField
              label="Renewal / expiry date"
              type="date"
              hint="optional"
              value={form.expiry_date}
              onChange={update("expiry_date")}
            />
          </FieldRow>

          <TextAreaField
            label="Notes"
            hint="optional"
            placeholder="Anything the coordinator should know about this training"
            value={form.notes}
            onChange={update("notes")}
          />

          <FormBanner status={status} />

          <div>
            <SubmitButton submitting={submitting}>Save training record</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
