import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { clients, careSettingMeta } from "../../data/clients";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import InsightsFeed from "../../components/insights/InsightsFeed";

const filters = [
  { id: "all", label: "All settings" },
  { id: "home", label: "Home Care" },
  { id: "residential", label: "Residential Care" },
  { id: "supported-living", label: "Supported Living" },
];

const riskColor = { High: "rose", Medium: "amber", Low: "sage" };

export default function ClientList() {
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? clients : clients.filter((c) => c.careSetting === filter);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Care Planning</h1>
        <p className="text-sm text-brand-900/50">
          One client list across every care setting — home care, residential, and supported living.
        </p>
      </div>

      <Link
        to="/app/ai"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-amber-100 to-amber-50 px-5 py-4 transition hover:from-amber-200"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white">
            <Sparkles size={17} />
          </span>
          <div>
            <div className="text-sm font-semibold text-amber-900">New: Generate a care plan from carer notes with AI</div>
            <div className="text-xs text-amber-700/70">Free-text notes in, structured editable care plan out — try it now.</div>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white">
          Try AI Care Notes
          <ArrowRight size={13} />
        </span>
      </Link>

      <InsightsFeed />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filter === f.id ? "bg-brand-600 text-white" : "bg-white text-brand-900/60 hover:bg-brand-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
        {visible.map((client) => {
          const setting = careSettingMeta[client.careSetting];
          return (
            <Link key={client.id} to={`/app/clients/${client.id}`}>
              <Card className="flex h-full flex-col gap-3 transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  <Avatar initials={client.initials} color={client.avatarColor} size="lg" />
                  <div>
                    <div className="font-semibold text-brand-950">{client.name}</div>
                    <div className="text-xs text-brand-900/45">{client.age} years · {client.location}</div>
                  </div>
                </div>
                <p className="text-sm text-brand-900/60">{client.summary}</p>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  <Badge color={setting.color}>{setting.label}</Badge>
                  <Badge color={riskColor[client.riskLevel]}>{client.riskLevel} risk</Badge>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
