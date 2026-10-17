/**
 * Reads a P4 milestone's planned window ("Weeks 3–6", "M2–M4", "Q1") as plan
 * weeks. Week 1 is the first week after the handoff is accepted. A window
 * this does not recognise is left for the owner to schedule; it is never
 * guessed.
 */

/** The last week a plan may name: five years. */
export const MAX_PLAN_WEEK = 260;

export interface PlannedWeeks {
  startWeek: number;
  weeks: number;
}

/** Month m covers weeks floor((m-1)·52/12)+1 … floor(m·52/12): 1–4, 5–8, 9–13, … 48–52. */
export function monthWeeks(month: number): { first: number; last: number } {
  return { first: Math.floor(((month - 1) * 52) / 12) + 1, last: Math.floor((month * 52) / 12) };
}

const RANGE = String.raw`\s*(?:-|–|—|to|through|until)\s*`;
const WEEK = String.raw`(?:weeks?|wks?|w)\.?\s*`;
const MONTH = String.raw`(?:months?|mos?|m)\.?\s*`;
const QUARTER = String.raw`(?:quarters?|q)\.?\s*`;

const patterns: { unit: "week" | "month" | "quarter"; re: RegExp }[] = [
  { unit: "week", re: new RegExp(`^${WEEK}(\\d{1,3})(?:${RANGE}(?:${WEEK})?(\\d{1,3}))?$`, "i") },
  { unit: "month", re: new RegExp(`^${MONTH}(\\d{1,2})(?:${RANGE}(?:${MONTH})?(\\d{1,2}))?$`, "i") },
  { unit: "quarter", re: new RegExp(`^${QUARTER}(\\d)(?:${RANGE}(?:${QUARTER})?(\\d))?$`, "i") },
];

export function plannedWindowWeeks(text: string): PlannedWeeks | null {
  const value = text.trim();
  for (const { unit, re } of patterns) {
    const match = re.exec(value);
    if (!match) continue;
    const from = Number(match[1]);
    const to = match[2] === undefined ? from : Number(match[2]);
    if (from < 1 || to < from) return null;
    const [first, last] = unit === "week" ? [from, to]
      : unit === "month" ? [monthWeeks(from).first, monthWeeks(to).last]
        : [monthWeeks(from * 3 - 2).first, monthWeeks(to * 3).last];
    if (last > MAX_PLAN_WEEK) return null;
    return { startWeek: first, weeks: last - first + 1 };
  }
  return null;
}
