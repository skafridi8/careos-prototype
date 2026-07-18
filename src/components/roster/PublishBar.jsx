import { useState } from "react";
import { CheckCircle2, Send, X } from "lucide-react";
import { dotClasses } from "../ui/colors";
import { useRoster } from "../../context/RosterContext";

export default function PublishBar() {
  const { changeLog, publish, analysis, showToast } = useRoster();
  const [reviewOpen, setReviewOpen] = useState(false);

  if (changeLog.length === 0) return null;

  function handlePublish() {
    publish();
    setReviewOpen(false);
    showToast("Rota published — 6 carers notified on the Tendly mobile app ✓", "sage");
  }

  return (
    <>
      <div className="sticky bottom-3 z-30 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 pl-4 shadow-lg">
        <span className="flex h-2.5 w-2.5 shrink-0">
          <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-amber-400 opacity-60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        </span>
        <div className="min-w-0 flex-1 text-sm text-amber-700">
          <span className="font-semibold">
            {changeLog.length} unpublished change{changeLog.length === 1 ? "" : "s"}
          </span>{" "}
          — carers still see the previous rota until you publish.
        </div>
        <button
          type="button"
          onClick={() => setReviewOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <Send size={14} /> Review & publish
        </button>
      </div>

      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button type="button" aria-label="Close" onClick={() => setReviewOpen(false)} className="absolute inset-0 bg-brand-950/30" />
          <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-100 p-5">
              <div>
                <h2 className="text-base font-semibold text-brand-950">Review changes before publishing</h2>
                <p className="text-xs text-brand-900/50">
                  {analysis.errors > 0
                    ? `${analysis.errors} blocking conflict${analysis.errors === 1 ? "" : "s"} remain — you can still publish, but review first.`
                    : "No blocking conflicts — this rota is safe to publish."}
                </p>
              </div>
              <button type="button" onClick={() => setReviewOpen(false)} className="rounded-lg p-1.5 text-brand-900/40 transition hover:bg-brand-50">
                <X size={18} />
              </button>
            </div>
            <ul className="flex flex-col gap-2 overflow-y-auto p-5">
              {changeLog.map((entry) => (
                <li key={entry.id} className="flex items-start gap-2.5 text-sm text-brand-900/70">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClasses[entry.tone] ?? dotClasses.brand}`} />
                  {entry.text}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-end gap-2 border-t border-brand-100 p-4">
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-brand-900/60 transition hover:bg-brand-50"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="flex items-center gap-1.5 rounded-xl bg-sage-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sage-700"
              >
                <CheckCircle2 size={15} /> Publish & notify carers
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
