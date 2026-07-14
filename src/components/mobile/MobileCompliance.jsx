import { ShieldCheck } from "lucide-react";
import { trainingForCarer, trainingStatusMeta } from "../../data/carerTraining";
import { formatDate } from "../../utils/dates";
import Badge from "../ui/Badge";

export default function MobileCompliance({ carer }) {
  const certs = trainingForCarer(carer.id);
  const overdue = certs.filter((c) => c.status === "overdue").length;
  const dueSoon = certs.filter((c) => c.status === "due-soon").length;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-sage-600" />
          <h1 className="text-xl font-semibold text-brand-950">My compliance</h1>
        </div>
        <p className="text-sm text-brand-900/50">
          {overdue > 0
            ? `${overdue} certificate${overdue === 1 ? "" : "s"} overdue — contact the office to book renewal.`
            : dueSoon > 0
              ? `${dueSoon} certificate${dueSoon === 1 ? "" : "s"} due soon.`
              : "All your certifications are up to date."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {certs.map((cert) => {
          const meta = trainingStatusMeta[cert.status];
          return (
            <div
              key={cert.id}
              className="flex items-center justify-between gap-2 rounded-2xl border border-brand-100 bg-white p-3.5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-brand-950">{cert.label}</div>
                <div className="text-xs text-brand-900/45">
                  {cert.status === "overdue" ? "Expired " : "Expires "}
                  {formatDate(cert.expiry)}
                </div>
              </div>
              <Badge color={meta.color}>{meta.label}</Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
