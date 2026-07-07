import { Link, useParams } from "react-router-dom";
import { ClipboardEdit, CalendarClock } from "lucide-react";
import { clientById, careSettingMeta } from "../../data/clients";
import { visitsForClient, statusMeta } from "../../data/visits";
import { carerById } from "../../data/carers";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import GpConnectPanel from "../../components/shared/GpConnectPanel";
import { formatDayLabel, formatTime } from "../../utils/dates";

const riskColor = { High: "rose", Medium: "amber", Low: "sage" };

export default function ClientDetail() {
  const { clientId } = useParams();
  const client = clientById(clientId);

  if (!client) {
    return <div className="text-brand-900/60">Client not found.</div>;
  }

  const setting = careSettingMeta[client.careSetting];
  const upcomingVisits = visitsForClient(client.id)
    .filter((v) => v.status === "upcoming" || v.status === "in-progress")
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar initials={client.initials} color={client.avatarColor} size="lg" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-brand-950">{client.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge color={setting.color}>{setting.label}</Badge>
              <Badge color={riskColor[client.riskLevel]}>{client.riskLevel} risk</Badge>
              <span className="text-xs text-brand-900/45">{client.age} years · {client.location}</span>
            </div>
          </div>
        </div>
        <Link
          to={`/app/clients/${client.id}/care-plan`}
          className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <ClipboardEdit size={16} />
          View / edit care plan
        </Link>
      </div>

      <div className="flex flex-wrap gap-5">
        <div className="flex min-w-0 flex-[2] basis-[480px] flex-col gap-5">
          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-900/40">Key needs</h2>
            <ul className="flex flex-col gap-1.5 text-sm text-brand-900/80">
              {client.keyNeeds.map((n) => (
                <li key={n} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  {n}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-900/40">Risks</h2>
            <div className="flex flex-col gap-3">
              {client.risks.map((r) => (
                <div key={r.type} className="flex items-start gap-3">
                  <Badge color={riskColor[r.level]} className="mt-0.5 shrink-0">{r.level}</Badge>
                  <div>
                    <div className="text-sm font-medium text-brand-950">{r.type}</div>
                    <div className="text-xs text-brand-900/55">{r.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-900/40">Preferences</h2>
            <ul className="flex flex-col gap-1.5 text-sm text-brand-900/80">
              {client.preferences.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" />
                  {p}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-900/40">Medication overview</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-brand-900/40">
                  <th className="pb-2 font-medium">Medication</th>
                  <th className="pb-2 font-medium">Dose</th>
                  <th className="pb-2 font-medium">Route</th>
                  <th className="pb-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {client.medications.map((m) => (
                  <tr key={m.name} className="border-t border-brand-50">
                    <td className="py-2 font-medium text-brand-950">{m.name}</td>
                    <td className="py-2 text-brand-900/70">{m.dose}</td>
                    <td className="py-2 text-brand-900/70">{m.route}</td>
                    <td className="py-2 text-brand-900/70">{m.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <GpConnectPanel client={client} />
        </div>

        <div className="flex min-w-0 flex-1 basis-[280px] flex-col gap-5">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-900/40">Upcoming visits</h2>
              <Link to="/app/roster" className="text-xs font-medium text-brand-600 hover:underline">
                Full roster
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {upcomingVisits.map((v) => {
                const status = statusMeta[v.status];
                return (
                  <div key={v.id} className="flex items-start gap-2.5 text-sm">
                    <CalendarClock size={15} className="mt-0.5 shrink-0 text-brand-400" />
                    <div>
                      <div className="font-medium text-brand-950">
                        {formatDayLabel(v.start)}, {formatTime(v.start)}
                      </div>
                      <div className="text-xs text-brand-900/55">{v.type}</div>
                      <div className="text-xs text-brand-900/45">
                        {v.carerIds.map((id) => carerById(id)?.name.split(" ")[0]).join(" & ")}
                      </div>
                    </div>
                    <Badge color={status.color} className="ml-auto shrink-0">{status.label}</Badge>
                  </div>
                );
              })}
              {upcomingVisits.length === 0 && (
                <div className="text-sm text-brand-900/40">No upcoming visits scheduled.</div>
              )}
            </div>
          </Card>

          <Card className="bg-sage-50">
            <h2 className="mb-1 text-sm font-semibold text-sage-800">Care plan status</h2>
            <div className="text-xs text-sage-700">
              Last updated {new Date(client.carePlan.lastUpdated).toLocaleDateString("en-GB")}
              <br />
              Next review due {new Date(client.carePlan.reviewDate).toLocaleDateString("en-GB")}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
