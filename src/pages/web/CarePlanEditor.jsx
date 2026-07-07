import { useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, Sparkles, Save, FileText } from "lucide-react";
import { clientById } from "../../data/clients";
import { sourceNotes } from "../../data/aiCarePlanDraft";
import { AI_FLAGSHIP_CLIENT_ID, sectionLabels, getDraftForClient, initialFormState } from "../../utils/carePlanDraft";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import CitationTag from "../../components/shared/CitationTag";
import { formatRelativeTime } from "../../utils/dates";

export default function CarePlanEditor() {
  const { clientId } = useParams();
  const location = useLocation();
  const client = clientById(clientId);
  const appliedDraft = location.state?.appliedDraft;
  const [form, setForm] = useState(() => (appliedDraft ? appliedDraft : initialFormState(client)));
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const isFlagshipDemo = clientId === AI_FLAGSHIP_CLIENT_ID;

  if (!client) return <div className="text-brand-900/60">Client not found.</div>;

  function handleGenerate() {
    setGenerating(true);
    setSaved(false);
    setTimeout(() => {
      setForm(getDraftForClient(client));
      setGenerating(false);
    }, 1600);
  }

  function updateGoal(i, text) {
    setForm((prev) => ({ ...prev, goals: prev.goals.map((g, idx) => (idx === i ? { ...g, text } : g)) }));
  }

  function updateSection(key, text) {
    setForm((prev) => ({ ...prev, sections: { ...prev.sections, [key]: { ...prev.sections[key], text } } }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="flex flex-col gap-5">
      <Link to={`/app/clients/${client.id}`} className="flex w-fit items-center gap-1 text-sm font-medium text-brand-700">
        <ChevronLeft size={16} />
        Back to {client.name}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar initials={client.initials} color={client.avatarColor} />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-brand-950">{client.name}'s care plan</h1>
            <p className="text-sm text-brand-900/50">Editable draft — changes are not saved anywhere real in this prototype.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition hover:bg-amber-300 disabled:opacity-60"
          >
            <Sparkles size={16} className={generating ? "animate-pulse" : ""} />
            {generating ? "Generating from notes…" : "Generate care plan from notes"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Save size={16} />
            Save care plan
          </button>
        </div>
      </div>

      {saved && (
        <div className="rounded-xl bg-sage-100 px-4 py-2.5 text-sm font-medium text-sage-700">Care plan saved.</div>
      )}

      {appliedDraft && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
          <Sparkles size={15} />
          Draft applied from AI Care Notes — review and save when ready.
        </div>
      )}

      {isFlagshipDemo && (
        <Card className="bg-brand-50/60">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-800">
            <FileText size={16} />
            Recent carer notes used for this draft
          </div>
          <div className="flex flex-col gap-2">
            {sourceNotes.map((n) => (
              <div key={n.id} className="text-xs text-brand-900/60">
                <span className="font-medium text-brand-900/80">{n.author}</span>{" "}
                <span className="text-brand-900/40">· {formatRelativeTime(n.date)}</span>
                <div>"{n.text}"</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-900/40">Goals</h2>
        <div className="flex flex-col gap-3">
          {form.goals.map((g, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              {g.source && <CitationTag source={g.source} />}
              <textarea
                value={g.text}
                onChange={(e) => updateGoal(i, e.target.value)}
                rows={2}
                className={`w-full resize-none rounded-lg border p-2.5 text-sm text-brand-900 outline-none focus:border-brand-300 ${
                  g.source ? "border-amber-200 bg-amber-50/40" : "border-brand-100"
                }`}
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
        {Object.entries(form.sections).map(([key, val]) => (
          <Card key={key} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-950">{sectionLabels[key]}</h2>
              <CitationTag source={val.source} />
            </div>
            <textarea
              value={val.text}
              onChange={(e) => updateSection(key, e.target.value)}
              rows={4}
              className={`w-full resize-none rounded-lg border p-2.5 text-sm text-brand-900 outline-none focus:border-brand-300 ${
                val.source ? "border-amber-200 bg-amber-50/40" : "border-brand-100"
              }`}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
