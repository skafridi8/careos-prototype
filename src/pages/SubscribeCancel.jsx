import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function SubscribeCancel() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-brand-50/40 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-sm">
        <XCircle size={40} className="mx-auto text-rose-400" />
        <h1 className="mt-4 text-xl font-semibold text-brand-950">Checkout canceled</h1>
        <p className="mt-2 text-sm text-brand-900/60">No payment was made. You can try again whenever you're ready.</p>
        <Link
          to="/subscribe"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
        >
          Back to plans
        </Link>
      </div>
    </div>
  );
}
