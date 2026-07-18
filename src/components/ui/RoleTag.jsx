// Tiny category tag so people cards are never ambiguous: blue = client
// (someone we care for), green = carer (someone on the team).
const roleStyles = {
  client: "bg-brand-100 text-brand-700 ring-brand-200/60",
  carer: "bg-sage-100 text-sage-700 ring-sage-200/60",
};

export default function RoleTag({ role, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${roleStyles[role] ?? roleStyles.client} ${className}`}
    >
      {role === "carer" ? "Carer" : "Client"}
    </span>
  );
}
