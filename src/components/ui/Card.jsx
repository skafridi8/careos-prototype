export default function Card({ children, className = "", padded = true }) {
  return (
    <div className={`rounded-2xl border border-brand-100 bg-white shadow-sm ${padded ? "p-5" : ""} ${className}`}>
      {children}
    </div>
  );
}
