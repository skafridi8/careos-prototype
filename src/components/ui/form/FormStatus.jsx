import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export function SubmitButton({ submitting, children = "Submit" }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {submitting && <Loader2 size={15} className="animate-spin" />}
      {submitting ? "Saving…" : children}
    </button>
  );
}

export function FormBanner({ status }) {
  if (!status) return null;
  if (status.type === "success") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2.5 text-sm text-sage-800">
        <CheckCircle2 size={16} className="shrink-0" />
        {status.message}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
      <AlertTriangle size={16} className="shrink-0" />
      {status.message}
    </div>
  );
}
