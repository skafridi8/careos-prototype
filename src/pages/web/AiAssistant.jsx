import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, FileText, ArrowRight, Check } from "lucide-react";
import { clients, clientById } from "../../data/clients";
import { sourceNotes } from "../../data/aiCarePlanDraft";
import { comparisonRows, competitors } from "../../data/comparisonData";
import { AI_FLAGSHIP_CLIENT_ID, sectionLabels, getDraftForClient } from "../../utils/carePlanDraft";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import CitationTag from "../../components/shared/CitationTag";
import ComparisonIcon from "../../components/ui/ComparisonIcon";
import { formatRelativeTime } from "../../utils/dates";

const aiRow = comparisonRows.find((r) => r.feature.startsWith("AI:"));

export default function AiAssistant() {
  const [selectedId, setSelectedId] = useState(AI_FLAGSHIP_CLIENT_ID);
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState(null);
  const navigate = useNavigate();
  const client = clientById(selectedId);
  const isFlagship = selectedId === AI_FLAGSHIP_CLIENT_ID;

  function selectClient(id) {
    setSelectedId(id);
    setDraft(null);
  }

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => {
      setDraft(getDraftForClient(client));
      setGenerating(false);
    }, 1600);
  }

  function openInEditor() {
    navigate(`/app/clients/${client.id}/care-plan`, { state: { appliedDraft: draft } });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Sparkles size={18} />
          </span>
          <h1 className="text-2xl font-semibold text-brand-950">AI Care Notes</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-brand-900/50">
          Turn a carer's free-text notes into a structured, editable care plan — instantly. Pick any client below and
          watch it happen. This is the capability that sets CareOS apart.
        </p>
      </div>

      {aiRow && (
        <Card className="bg-brand-50/60">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-900/40">
            How this compares
          </div>
          <div className="flex flex-wrap gap-6">
            {competitors.map((c) => {
              const cell = aiRow[c.id];
              return (
                <div key={c.id} className="flex items-center gap-2.5">
                  <ComparisonIcon status={cell.status} note={cell.note} size="sm" />
                  <div>
                    <div className="text-sm font-medium text-brand-950">{c.name}</div>
                    {cell.note && <div className="max-w-[180px] text-xs text-brand-900/45">{cell.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-900/40">
          Try it on a client
        </div>
        <div className="flex flex-wrap gap-2">
          {clients.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectClient(c.id)}
              className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-sm font-medium transition ${
                selectedId === c.id ? "bg-brand-600 text-white" : "bg-white text-brand-900/60 hover:bg-brand-100"
              }`}
            >
              <Avatar initials={c.initials} color={selectedId === c.id ? "brand" : c.avatarColor} size="sm" />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <div className="min-w-0 flex-1 basis-[320px]">
          <Card className="h-full">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-800">
              <FileText size={16} />
              {isFlagship ? "Recent carer notes" : `Recent carer activity for ${client.preferredName}`}
            </div>
            {isFlagship ? (
              <div className="flex flex-col gap-3">
                {sourceNotes.map((n) => (
                  <div key={n.id} className="text-xs text-brand-900/60">
                    <span className="font-medium text-brand-900/80">{n.author}</span>{" "}
                    <span className="text-brand-900/40">· {formatRelativeTime(n.date)}</span>
                    <div>"{n.text}"</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-brand-900/55">
                CareOS has been logging {client.preferredName}'s visit notes, medication records and welfare checks all
                week. The AI reads all of it — click generate to turn that activity into a structured care plan draft.
              </p>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-3 text-sm font-semibold text-amber-950 shadow-sm transition hover:bg-amber-300 disabled:opacity-60"
            >
              <Sparkles size={16} className={generating ? "animate-pulse" : ""} />
              {generating ? "Generating from notes…" : `Generate ${client.preferredName}'s care plan from notes`}
            </button>
          </Card>
        </div>

        <div className="min-w-0 flex-[2] basis-[420px]">
          {draft ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-xl bg-sage-100 px-4 py-2.5 text-sm font-medium text-sage-700">
                <span className="flex items-center gap-2">
                  <Check size={15} />
                  Draft generated for {client.name}
                </span>
                <button
                  type="button"
                  onClick={openInEditor}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sage-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sage-700"
                >
                  Apply to care plan
                  <ArrowRight size={13} />
                </button>
              </div>

              <Card>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-900/40">Goals</h2>
                <div className="flex flex-col gap-3">
                  {draft.goals.map((g, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      {g.source && <CitationTag source={g.source} />}
                      <p className="rounded-lg border border-amber-200 bg-amber-50/40 p-2.5 text-sm text-brand-900">
                        {g.text}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
                {Object.entries(draft.sections).map(([key, val]) => (
                  <Card key={key} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-brand-950">{sectionLabels[key]}</h2>
                      <CitationTag source={val.source} />
                    </div>
                    <p className="text-sm text-brand-900/75">{val.text}</p>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="flex h-full min-h-[260px] flex-col items-center justify-center gap-2 border-dashed text-center">
              <Sparkles size={22} className="text-amber-300" />
              <p className="max-w-xs text-sm text-brand-900/45">
                Click "Generate {client.preferredName}'s care plan from notes" to see the structured draft appear here,
                with a citation for every field it pulled from notes.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
