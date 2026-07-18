import { useState } from "react";
import { Link } from "react-router-dom";
import { HeartPulse, Check, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { TextField } from "../components/ui/form/Field";
import { FormBanner } from "../components/ui/form/FormStatus";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    priceLabel: "£49",
    cadence: "/ month",
    priceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
    features: ["Unlimited clients & carers", "Rostering + AI Care Notes", "Compliance tracking", "Cancel anytime"],
  },
  {
    id: "yearly",
    name: "Yearly",
    priceLabel: "£470",
    cadence: "/ year",
    priceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY,
    features: ["Everything in Monthly", "2 months free vs. monthly", "Priority support"],
    highlight: true,
  },
];

export default function Subscribe() {
  const { user } = useAuth();
  const [selected, setSelected] = useState("yearly");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleSubscribe(e) {
    e.preventDefault();
    const plan = PLANS.find((p) => p.id === selected);
    if (!plan?.priceId) {
      setStatus({ type: "error", message: "This plan isn't configured yet. Please contact us." });
      return;
    }
    if (!email.trim()) {
      setStatus({ type: "error", message: "Enter an email address to continue." });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.priceId,
          email: email.trim(),
          companyName: companyName.trim(),
          plan: plan.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Failed to start checkout");
      window.location.href = data.url;
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Something went wrong. Please try again." });
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-brand-50 to-sage-50 px-6 py-14">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-center text-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-sage-600 text-white">
              <HeartPulse size={15} />
            </span>
            <span className="text-sm font-bold tracking-tight text-brand-800">tendly</span>
          </Link>
          <h1 className="text-3xl font-semibold text-brand-950 sm:text-4xl">Subscribe your agency</h1>
          <p className="max-w-xl text-brand-900/60">
            Test-mode checkout — no real card will be charged. Use Stripe's test card{" "}
            <span className="font-mono text-brand-800">4242 4242 4242 4242</span>, any future expiry, any CVC.
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="mt-10 flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <button
                type="button"
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`rounded-2xl border-2 bg-white p-6 text-left shadow-sm transition ${
                  selected === plan.id ? "border-brand-500" : "border-brand-100 hover:border-brand-200"
                }`}
              >
                {plan.highlight && (
                  <span className="mb-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                    Best value
                  </span>
                )}
                <div className="text-lg font-semibold text-brand-950">{plan.name}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-brand-950">{plan.priceLabel}</span>
                  <span className="text-sm text-brand-900/50">{plan.cadence}</span>
                </div>
                <ul className="mt-4 flex flex-col gap-2 text-sm text-brand-900/70">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check size={14} className="shrink-0 text-sage-600" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <div className="mx-auto w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <TextField
                label="Work email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
              />
              <TextField
                label="Company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Sunrise Home Care"
                hint="Optional"
              />
              <FormBanner status={status} />
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                {submitting ? "Redirecting…" : `Subscribe Now — ${PLANS.find((p) => p.id === selected)?.name}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
