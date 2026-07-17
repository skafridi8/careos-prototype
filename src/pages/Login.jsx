import { useState } from "react";
import { Navigate } from "react-router-dom";
import { HeartPulse } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { TextField, SelectField } from "../components/ui/form/Field";
import { SubmitButton, FormBanner } from "../components/ui/form/FormStatus";

export default function Login() {
  const { user, loading, profile, signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "carer" });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  if (loading) return null;
  if (user) {
    // Wait for the profile so family accounts land in their portal, not the staff app.
    if (!profile) return null;
    return <Navigate to={profile.role === "family" ? "/family" : "/app/records"} replace />;
  }

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    const action = mode === "signin" ? signIn(form) : signUp(form);
    const { error } = await action;
    setSubmitting(false);
    if (error) {
      setStatus({ type: "error", message: error.message });
    } else if (mode === "signup") {
      setStatus({
        type: "success",
        message: "Account created. Check your inbox to confirm your email, then sign in.",
      });
      setMode("signin");
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-brand-50/40 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <HeartPulse size={24} className="text-brand-500" />
          <span className="text-xl font-semibold text-brand-950">CareOS</span>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex rounded-lg bg-brand-50 p-1 text-sm font-medium">
            {["signin", "signup"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setStatus(null);
                }}
                className={`flex-1 rounded-md py-1.5 transition ${
                  mode === m ? "bg-white text-brand-800 shadow-sm" : "text-brand-900/50"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <TextField
                label="Full name"
                required
                value={form.fullName}
                onChange={update("fullName")}
                placeholder="Sarah Jenkins"
              />
            )}
            <TextField
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              placeholder="you@careos.com"
            />
            <TextField
              label="Password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={update("password")}
              placeholder="••••••••"
            />
            {mode === "signup" && (
              <SelectField label="Role" value={form.role} onChange={update("role")}>
                <option value="carer">Carer</option>
                <option value="manager">Manager / Coordinator</option>
              </SelectField>
            )}

            <FormBanner status={status} />

            <SubmitButton submitting={submitting}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </SubmitButton>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-brand-900/40">
          Carers log their own training, hours and client intake here. Managers see everything submitted by the team.
        </p>
      </div>
    </div>
  );
}
