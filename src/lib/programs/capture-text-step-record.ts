/** Review provenance for free-text Moves step pages. Only accepted team words reach gates. */
export interface CaptureTextStepEntry {
  text: string;
  source: "notes" | "ava" | "team";
  status: "draft" | "accepted";
  citation?: string;
}

export interface CaptureTextStepRecord {
  version: 1;
  entries: Record<string, CaptureTextStepEntry>;
}

export const CAPTURE_TEXT_STEP_RECORD_KEYS = [
  "p0_signal_step",
  "p0_scope_step",
  "p0_value_step",
  "p0_owner_evidence_step",
  "p1_sponsor_scope_step",
  "p1_stakeholders_step",
  "p1_success_step",
  "p1_evidence_change_step",
  "p2_evidence_plan_step",
  "p2_baseline_step",
] as const;

export function parseCaptureTextStepRecord(raw: string): CaptureTextStepRecord {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      (value as { version?: unknown }).version !== 1
    )
      throw new Error("version");
    const entries = (value as { entries?: unknown }).entries;
    if (!entries || typeof entries !== "object" || Array.isArray(entries))
      throw new Error("entries");
    const clean: Record<string, CaptureTextStepEntry> = {};
    for (const [key, entry] of Object.entries(entries)) {
      if (!entry || typeof entry !== "object") continue;
      const item = entry as Partial<CaptureTextStepEntry>;
      if (
        typeof item.text !== "string" ||
        !["notes", "ava", "team"].includes(item.source ?? "") ||
        !["draft", "accepted"].includes(item.status ?? "")
      )
        continue;
      clean[key] = {
        text: item.text,
        source: item.source!,
        status: item.status!,
        ...(typeof item.citation === "string"
          ? { citation: item.citation }
          : {}),
      };
    }
    return { version: 1, entries: clean };
  } catch {
    return { version: 1, entries: {} };
  }
}

export function captureTextStepWords(raw: string): string {
  return Object.values(parseCaptureTextStepRecord(raw).entries)
    .filter((entry) => entry.status === "accepted")
    .map((entry) => entry.text.trim())
    .filter(Boolean)
    .join("\n");
}

/** Exact label-colon-note pairs; no inference, summarization or invented values. */
export function captureTextStepNotes(
  notes: string,
  fields: readonly { key: string; label: string }[],
  occupied: Readonly<Record<string, string>>,
): Record<string, CaptureTextStepEntry> {
  const result: Record<string, CaptureTextStepEntry> = {};
  for (const line of notes.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const label = line.slice(0, separator).trim().toLowerCase();
    const text = line.slice(separator + 1).trim();
    const field = fields.find(
      (candidate) => candidate.label.toLowerCase() === label,
    );
    if (field && text && !occupied[field.key]?.trim() && !result[field.key]) {
      result[field.key] = {
        text,
        source: "notes",
        status: "draft",
        citation: "Pasted session notes",
      };
    }
  }
  return result;
}

/** A planning figure needs an explicit register reference before acceptance. */
export function hasUncitedPlanningFigure(
  text: string,
  options: { allowEvidence?: boolean } = {},
): boolean {
  const citation = options.allowEvidence
    ? /\[(?:A|E):[A-Za-z0-9_-]+\]/
    : /\[A:[A-Za-z0-9_-]+\]/;
  return text
    .split(/[\n;]/)
    .some(
      (measure) =>
        /\d/.test(measure.replace(/\bP[0-5](?:\.\d+)?\b/g, "")) &&
        !citation.test(measure),
    );
}
