import { useState } from "react";
import { ChevronLeft, Users2, Check, BellRing } from "lucide-react";
import { clientById, careSettingMeta } from "../../data/clients";
import { carerById } from "../../data/carers";
import { formatTime } from "../../utils/dates";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";

function tasksForVisit(type) {
  if (type.includes("Double-Up")) return ["Both carers present for hoist transfer", "Personal care completed", "Reposition & check skin integrity"];
  if (type.includes("Medication")) return ["Confirm identity", "Administer medication", "Record in medication log"];
  if (type.includes("Personal Care")) return ["Personal care completed", "Client comfortable and safe"];
  if (type.includes("Welfare")) return ["Welfare check completed", "Client reports feeling well"];
  if (type.includes("Community Support")) return ["Reviewed budget / meal plan", "Client safe and settled"];
  return ["Visit completed"];
}

const riskColor = { High: "rose", Medium: "amber", Low: "sage" };

export default function MobileVisitDetail({ visit, status, currentCarerId, onBack, onComplete, isNew }) {
  const client = clientById(visit.clientId);
  const partner = visit.carerIds.map((id) => carerById(id)).find((c) => c.id !== currentCarerId);
  const setting = careSettingMeta[client.careSetting];
  const tasks = tasksForVisit(visit.type);
  const [checked, setChecked] = useState(() => tasks.map(() => false));
  const [note, setNote] = useState("");
  const allChecked = checked.every(Boolean);
  const isCompleted = status === "completed";

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-brand-700">
        <ChevronLeft size={16} />
        Today
      </button>

      <div className="flex items-center gap-3">
        <Avatar initials={client.initials} color={client.avatarColor} size="lg" />
        <div>
          <div className="text-lg font-semibold text-brand-950">{client.name}</div>
          <div className="flex items-center gap-1.5">
            <Badge color={setting.color}>{setting.label}</Badge>
            <span className="text-xs text-brand-900/45">{client.location}</span>
          </div>
        </div>
      </div>

      {isNew && (
        <div className="flex items-center gap-2 rounded-2xl bg-brand-50 p-3 text-xs text-brand-700">
          <BellRing size={16} className="shrink-0 text-brand-600" />
          <span>
            <span className="font-semibold">Newly added to your round</span> in the latest rota from the office.
          </span>
        </div>
      )}

      <div className="rounded-2xl border border-brand-100 bg-white p-3.5">
        <div className="text-sm font-semibold text-brand-950">{visit.type}</div>
        <div className="text-xs text-brand-900/50">{formatTime(visit.start)} – {formatTime(visit.end)}</div>
      </div>

      {visit.doubleUp && partner && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 p-3.5">
          <Users2 size={18} className="shrink-0 text-amber-600" />
          <div className="text-xs text-amber-800">
            <span className="font-semibold">Double-up visit — you + {partner.name}.</span> Both carers must be
            present for the hoist transfer before starting.
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-brand-100 bg-white p-3.5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-900/40">From the shared care plan</div>
        <div className="flex flex-col gap-2 text-sm text-brand-900/80">
          <div>
            <span className="font-medium text-brand-950">Key needs: </span>
            {client.keyNeeds.slice(0, 2).join("; ")}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {client.risks.slice(0, 3).map((r) => (
              <Badge key={r.type} color={riskColor[r.level] ?? "brand"}>{r.type} · {r.level}</Badge>
            ))}
          </div>
          <div>
            <span className="font-medium text-brand-950">Preferences: </span>
            {client.preferences[0]}
          </div>
        </div>
      </div>

      {visit.type.includes("Medication") || visit.type.includes("Double-Up") ? (
        <div className="rounded-2xl border border-brand-100 bg-white p-3.5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-900/40">Medication due</div>
          <ul className="flex flex-col gap-1.5 text-sm text-brand-900/80">
            {client.medications.map((m) => (
              <li key={m.name} className="flex justify-between">
                <span>{m.name} ({m.dose})</span>
                <span className="text-brand-900/45">{m.time}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-brand-100 bg-white p-3.5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-900/40">Visit checklist</div>
        <div className="flex flex-col gap-2">
          {tasks.map((task, i) => (
            <button
              key={task}
              type="button"
              disabled={isCompleted}
              onClick={() => setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))}
              className="flex items-center gap-2.5 text-left text-sm"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                  checked[i] || isCompleted ? "border-sage-500 bg-sage-500 text-white" : "border-brand-200"
                }`}
              >
                {(checked[i] || isCompleted) && <Check size={13} />}
              </span>
              <span className={checked[i] || isCompleted ? "text-brand-900/50 line-through" : "text-brand-900"}>{task}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white p-3.5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-900/40">Quick note for the office</div>
        <textarea
          disabled={isCompleted}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Client in good spirits, no concerns…"
          rows={2}
          className="w-full resize-none rounded-lg border border-brand-100 p-2 text-sm text-brand-900 outline-none focus:border-brand-300"
        />
        <div className="mt-1 text-[11px] text-brand-900/35">Syncs to the office activity feed automatically.</div>
      </div>

      <button
        type="button"
        disabled={!allChecked || isCompleted}
        onClick={() => onComplete(visit.id)}
        className={`rounded-2xl py-3 text-center text-sm font-semibold transition ${
          isCompleted
            ? "bg-sage-100 text-sage-700"
            : allChecked
              ? "bg-brand-600 text-white active:scale-[0.99]"
              : "bg-brand-100 text-brand-900/30"
        }`}
      >
        {isCompleted ? "Visit completed" : "Complete visit"}
      </button>
    </div>
  );
}
