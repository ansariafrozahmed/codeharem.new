// Date helpers shared by server and client.

/** "12 Dec 2026". Date-only values (YYYY-MM-DD) are read as UTC so they don't shift a day. */
export function formatDate(value: string | null, month: "short" | "long" = "short") {
  if (!value) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Date(dateOnly ? `${value}T00:00:00Z` : value).toLocaleDateString("en", {
    day: "numeric",
    month,
    year: "numeric",
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  });
}

/** "3 days ago", "in 2 weeks" */
export function relativeTime(value: string, now = Date.now()) {
  const diff = (new Date(value).getTime() - now) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds) return rtf.format(Math.round(diff / seconds), unit);
  }
  return "just now";
}

/** Days from today until a date-only value; negative when overdue. */
export function daysUntil(dateOnly: string, now = new Date()) {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.parse(`${dateOnly}T00:00:00Z`) - today) / 86400000);
}
