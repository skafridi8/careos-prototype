import { Sparkles } from "lucide-react";

export default function CitationTag({ source }) {
  if (!source) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
      <Sparkles size={11} />
      from your notes — {source}
    </span>
  );
}
