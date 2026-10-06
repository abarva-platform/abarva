export function leverPriorityRank(priority: string | null | undefined): number {
  const match = /^P(\d+)$/i.exec(priority?.trim() ?? "");
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export function leverSequenceRank(title: string | null | undefined): number {
  const text = title ?? "";
  if (/notice|non-renew|auto-renew/i.test(text)) return 0;
  if (/credit|claim|breach/i.test(text)) return 1;
  if (/right-size|re-time|retime|ramp|carry-forward/i.test(text)) return 2;
  if (/marketplace|private offer|route/i.test(text)) return 3;
  if (/serverless|classic|migration/i.test(text)) return 4;
  if (/discount|re-price|benchmark/i.test(text)) return 5;
  if (/support|scope|cmdb|workload/i.test(text)) return 6;
  return 7;
}

export function displaySourceLeverTitle(title: string): string {
  const label = title.replace(/^signal[- ]stage\s+/i, "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function displaySourceLeverTiming(timing: string): string {
  return timing.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_match, year, month, day) => {
    const parsed = new Date(`${year}-${month}-${day}T00:00:00Z`);
    return Number.isNaN(parsed.getTime())
      ? `${year}-${month}-${day}`
      : new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
  });
}
