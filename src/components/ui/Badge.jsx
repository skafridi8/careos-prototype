import { badgeClasses } from "./colors";

export default function Badge({ color = "brand", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${badgeClasses[color] ?? badgeClasses.brand} ${className}`}
    >
      {children}
    </span>
  );
}
