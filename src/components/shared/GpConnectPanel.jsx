import { ShieldCheck, RefreshCw } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import { formatRelativeTime } from "../../utils/dates";

export default function GpConnectPanel({ client }) {
  const gp = client.gpConnect;
  if (!gp) return null;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <ShieldCheck size={16} />
          </span>
          <div>
            <div className="text-sm font-semibold text-brand-950">NHS GP Connect</div>
            <div className="text-xs text-brand-900/45">{gp.practice}</div>
          </div>
        </div>
        {gp.synced && (
          <Badge color="sage">
            <RefreshCw size={11} />
            GP record synced
          </Badge>
        )}
      </div>

      <div className="mt-3 text-xs text-brand-900/45">
        Last synced {formatRelativeTime(gp.lastSynced)} · GP: {gp.gpName} · NHS No. {gp.nhsNumber}
      </div>

      <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-900/40">Conditions</div>
          <ul className="mt-1.5 flex flex-col gap-1 text-sm text-brand-900/80">
            {gp.conditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-900/40">Allergies</div>
          <ul className="mt-1.5 flex flex-col gap-1 text-sm text-brand-900/80">
            {gp.allergies.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-900/40">Repeat prescriptions</div>
          <ul className="mt-1.5 flex flex-col gap-1 text-sm text-brand-900/80">
            {gp.repeatPrescriptions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
