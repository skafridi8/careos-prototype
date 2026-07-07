import { avatarClasses } from "./colors";

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export default function Avatar({ initials, color = "brand", size = "md" }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${avatarClasses[color] ?? avatarClasses.brand} ${sizeClasses[size] ?? sizeClasses.md}`}
    >
      {initials}
    </div>
  );
}
