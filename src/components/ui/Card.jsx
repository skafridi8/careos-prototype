export default function Card({ children, className = "", padded = true }) {
  return (
    <div
      className={`rounded-2xl border border-brand-100/70 bg-white/90 shadow-card backdrop-blur-sm transition-shadow duration-300 hover:shadow-lift ${padded ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
