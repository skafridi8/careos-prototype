import { Link } from "react-router-dom";
import { ArrowRight, HeartPulse, Sparkles } from "lucide-react";
import { competitors, comparisonRows } from "../data/comparisonData";
import ComparisonIcon from "../components/ui/ComparisonIcon";

const legend = [
  { status: "yes", label: "Yes" },
  { status: "partial", label: "Partial" },
  { status: "no", label: "No" },
  { status: "unclear", label: "Unclear" },
];

export default function WhyCareOS() {
  return (
    <div className="min-h-svh bg-gradient-to-b from-brand-50 to-sage-50">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <header className="flex flex-col items-center text-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 shadow-sm">
            <HeartPulse size={18} className="text-brand-500" />
            <span className="text-sm font-semibold tracking-wide text-brand-700">CareOS</span>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-brand-950 sm:text-5xl">
            Everyone else sells three products.
            <br />
            <span className="text-brand-500">We built one shared record.</span>
          </h1>
          <p className="max-w-2xl text-lg text-brand-900/60">
            Care planning, rostering and compliance are usually separate, disconnected tools —
            each with its own known gaps. CareOS is one data model behind all three views, so a
            note a carer writes at 8am is already informing the compliance dashboard by 8:01.
          </p>
        </header>

        <section className="mt-12 overflow-x-auto rounded-2xl bg-white shadow-md">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-64 p-5 text-left align-bottom text-sm font-medium text-brand-900/50">
                  Capability
                </th>
                {competitors.map((c) => (
                  <th
                    key={c.id}
                    className={
                      c.id === "careos"
                        ? "rounded-t-xl bg-brand-600 p-5 text-center text-base font-semibold text-white"
                        : "p-5 text-center text-base font-semibold text-brand-900/70"
                    }
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={row.feature} className={i > 0 ? "border-t border-brand-100" : ""}>
                  <td className="p-5 align-top">
                    <div className="font-medium text-brand-950">{row.feature}</div>
                    <div className="mt-1 text-xs text-brand-900/45">{row.detail}</div>
                    {row.feature.startsWith("AI:") && (
                      <Link
                        to="/app/ai"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
                      >
                        <Sparkles size={12} />
                        Try it live
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </td>
                  {competitors.map((c) => {
                    const cell = row[c.id];
                    return (
                      <td
                        key={c.id}
                        className={
                          c.id === "careos"
                            ? "bg-brand-50/70 p-5 text-center align-top"
                            : "p-5 text-center align-top"
                        }
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <ComparisonIcon status={cell.status} note={cell.note} />
                          {cell.note && (
                            <span className="max-w-[150px] text-[11px] leading-snug text-brand-900/45">
                              {cell.note}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-5">
          {legend.map((l) => (
            <div key={l.status} className="flex items-center gap-2">
              <ComparisonIcon status={l.status} size="sm" />
              <span className="text-xs font-medium text-brand-900/55">{l.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-brand-700"
            >
              Enter the prototype
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/subscribe"
              className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-7 py-3.5 text-base font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
            >
              Subscribe
            </Link>
          </div>
          <span className="text-xs text-brand-900/40">
            Clickable prototype for shareholder review — sample data only, no real client information.
          </span>
        </div>
      </div>
    </div>
  );
}
