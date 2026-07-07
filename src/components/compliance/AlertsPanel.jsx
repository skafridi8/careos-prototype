import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { alerts, alertSeverityMeta } from "../../data/compliance";
import { clientById } from "../../data/clients";
import { formatRelativeTime } from "../../utils/dates";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

export default function AlertsPanel() {
  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <AlertTriangle size={16} className="text-amber-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-900/40">Alerts</h2>
      </div>
      <div className="flex flex-col">
        {alerts.map((alert, i) => {
          const severity = alertSeverityMeta[alert.severity];
          const client = clientById(alert.clientId);
          return (
            <div key={alert.id} className={`flex flex-col gap-1 py-3 ${i > 0 ? "border-t border-brand-50" : ""}`}>
              <div className="flex items-center gap-2">
                <Badge color={severity.color}>{severity.label}</Badge>
                <span className="text-xs text-brand-900/35">{formatRelativeTime(alert.timestamp)}</span>
              </div>
              <p className="text-sm text-brand-900/75">{alert.message}</p>
              {client && (
                <Link to={`/app/clients/${client.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                  View {client.name}'s record
                </Link>
              )}
            </div>
          );
        })}
        {alerts.length === 0 && <div className="py-3 text-sm text-brand-900/40">No active alerts.</div>}
      </div>
    </Card>
  );
}
