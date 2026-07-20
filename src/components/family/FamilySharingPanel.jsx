import { useEffect, useState } from "react";
import { Users, MessageCircle, UserPlus, Copy, Check, Loader2 } from "lucide-react";
import Card from "../ui/Card";
import {
  fetchClientSharing,
  fetchFamilyMembersForClient,
  inviteFamilyMember,
  updateSharingFlags,
} from "../../lib/familyApi";
import MessageThread from "./MessageThread";
import { TextField } from "../ui/form/Field";

// Manager form to create a real family login for this client. On success it
// shows the one-time password once — Supabase never lets us read it back, so
// this is the only moment it exists outside the family member's inbox.
function InviteForm({ clientId, onInvited }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", relationship: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await inviteFamilyMember({ clientId, ...form });
      setCreated(result);
      setForm({ fullName: "", email: "", relationship: "" });
      onInvited?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function copyPassword() {
    navigator.clipboard.writeText(created.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (created) {
    return (
      <div className="mb-3 rounded-xl border border-sage-200 bg-sage-50 p-3.5 text-sm">
        <div className="font-medium text-sage-800">Family login created for {created.clientName}</div>
        <div className="mt-2 flex flex-col gap-1 text-brand-900/70">
          <div>
            Email: <span className="font-mono text-brand-950">{created.email}</span>
          </div>
          <div className="flex items-center gap-2">
            Password: <span className="font-mono text-brand-950">{created.password}</span>
            <button
              type="button"
              onClick={copyPassword}
              className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-xs font-medium text-sage-700 shadow-card"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-brand-900/45">
          Shown once — share it with them now. They can sign in at /family and change it later.
        </p>
        <button
          type="button"
          onClick={() => setCreated(null)}
          className="mt-2 text-xs font-medium text-brand-600 hover:underline"
        >
          Invite another
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-200 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-50"
      >
        <UserPlus size={14} /> Invite a family member
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-3 flex flex-col gap-2.5 rounded-xl border border-brand-100 bg-white p-3.5">
      <TextField
        label="Full name"
        required
        value={form.fullName}
        onChange={update("fullName")}
        placeholder="Claire Hendricks"
      />
      <TextField
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={update("email")}
        placeholder="claire@example.com"
      />
      <TextField
        label="Relationship"
        value={form.relationship}
        onChange={update("relationship")}
        placeholder="Daughter"
      />
      {error && <div className="text-xs font-medium text-rose-500">{error}</div>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? "Creating…" : "Create login"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl px-3 py-2 text-sm font-medium text-brand-900/50 hover:bg-brand-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Toggle({ label, description, checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-brand-100 bg-white p-3 text-left transition hover:bg-brand-50 disabled:opacity-60"
    >
      <div>
        <div className="text-sm font-medium text-brand-950">{label}</div>
        <div className="text-xs text-brand-900/50">{description}</div>
      </div>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? "bg-sage-500" : "bg-brand-200"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-4.5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

// Manager view of the Family Portal for one client: who's linked, what they
// may see (writes the sharing flags that the family-side RLS policies check),
// and the live two-way message thread with the family.
export default function FamilySharingPanel({ clientId }) {
  const [sharing, setSharing] = useState(null);
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  function reloadMembers() {
    fetchFamilyMembersForClient(clientId).then(setMembers).catch(() => {});
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchClientSharing(clientId), fetchFamilyMembersForClient(clientId)])
      .then(([s, m]) => {
        if (cancelled) return;
        setSharing(s);
        setMembers(m);
      })
      .catch((err) => {
        console.warn("Family panel unavailable:", err.message);
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (unavailable || sharing === null) return null;

  async function setFlag(flag, value) {
    setSaving(true);
    const next = { ...sharing, [flag]: value };
    setSharing(next);
    try {
      await updateSharingFlags(clientId, { [flag]: value });
    } catch (err) {
      console.error("Failed to update sharing flag", err);
      setSharing(sharing); // revert
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Users size={16} className="text-brand-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-900/40">Family portal</h2>
      </div>

      <InviteForm clientId={clientId} onInvited={reloadMembers} />

      {members.length === 0 ? (
        <div className="mb-3 text-sm text-brand-900/40">No family accounts linked to this client yet.</div>
      ) : (
        <div className="mb-3 flex flex-col gap-1.5">
          {members.map((m) => (
            <div key={m.id} className="text-sm text-brand-900/70">
              <span className="font-medium text-brand-950">{m.profiles?.full_name ?? m.profiles?.email}</span>
              {m.relationship && <span className="text-brand-900/45"> · {m.relationship}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Toggle
          label="Share visit status"
          description="Family sees today's visits and live arrived/completed updates"
          checked={Boolean(sharing.share_visit_status)}
          onChange={(v) => setFlag("share_visit_status", v)}
          disabled={saving}
        />
        <Toggle
          label="Share care notes"
          description="Family sees the carer visit-note feed"
          checked={Boolean(sharing.share_care_notes)}
          onChange={(v) => setFlag("share_care_notes", v)}
          disabled={saving}
        />
      </div>

      {members.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-900/40">
            <MessageCircle size={13} /> Messages with family
          </div>
          <MessageThread clientId={clientId} senderRole="team" heightClass="h-56" />
        </div>
      )}
    </Card>
  );
}
