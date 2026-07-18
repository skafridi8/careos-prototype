import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function SubscribeSuccess() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-brand-50/40 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 size={40} className="mx-auto text-sage-500" />
        <h1 className="mt-4 text-xl font-semibold text-brand-950">Subscription confirmed</h1>
        <p className="mt-2 text-sm text-brand-900/60">
          This was a test-mode payment — no real card was charged. Your subscription status is now recorded.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
        >
          Back to Tendly
        </Link>
      </div>
    </div>
  );
}
