const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift so Monday is start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function atTime(date, hours, minutes = 0) {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function formatDayLabel(date) {
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function formatWeekday(date) {
  return date.toLocaleDateString("en-GB", { weekday: "long" });
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  return `${diffDay} days ago`;
}

export function isPast(date) {
  return new Date(date).getTime() < Date.now();
}

export function isSameDay(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.toDateString() === d2.toDateString();
}
