// Structured diagnosis facts — the "metric · value · source" rows an operator
// captures for evidence-heavy sections (e.g. P2 baseline metrics). Stored in the
// phase capture as a JSON string in the section's `value`, so persistence is
// unchanged; these helpers parse/serialize and fold facts into the generation
// context (baselineMetrics). Backward-compatible: a legacy free-text value that
// is not JSON becomes a single source-less fact so nothing is lost.

export interface DiagnosisFact {
  /** What is measured — e.g. "Contract intake cycle time". */
  metric: string;
  /** The value — e.g. "18.4 days median". */
  value: string;
  /** Where it came from — the provenance — e.g. "Intake work queue". */
  source: string;
}

function isFact(v: unknown): v is DiagnosisFact {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.metric === "string" &&
    typeof o.value === "string" &&
    typeof o.source === "string"
  );
}

/**
 * Parse a capture section value into structured facts. Accepts a JSON array of
 * facts (the structured form) or falls back to legacy free text (each non-empty
 * line, or the whole string, becomes one source-less fact) so old captures keep
 * working. Returns `[]` for empty input.
 */
export function parseDiagnosisFacts(raw: string | null | undefined): DiagnosisFact[] {
  const text = (raw ?? "").trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(isFact)
          .map((f) => ({
            metric: f.metric.trim(),
            value: f.value.trim(),
            source: f.source.trim(),
          }))
          .filter((f) => f.metric || f.value);
      }
    } catch {
      // not valid JSON — fall through to the free-text path
    }
  }
  // Legacy free text: keep it as one fact so generation still sees it.
  return [{ metric: "Captured note", value: text, source: "" }];
}

/** Serialize facts for storage in the section value (canonical JSON). */
export function serializeDiagnosisFacts(facts: DiagnosisFact[]): string {
  const clean = facts
    .map((f) => ({
      metric: f.metric.trim(),
      value: f.value.trim(),
      source: f.source.trim(),
    }))
    .filter((f) => f.metric || f.value || f.source);
  return clean.length ? JSON.stringify(clean) : "";
}

/** True when the value is the structured (JSON) form rather than legacy text. */
export function isStructuredFactsValue(raw: string | null | undefined): boolean {
  const text = (raw ?? "").trim();
  if (!text.startsWith("[")) return false;
  try {
    return Array.isArray(JSON.parse(text));
  } catch {
    return false;
  }
}

/**
 * Fold facts into a `baselineMetrics` record for the generation context:
 * `metric → "value  [source]"`. Skips empty metrics.
 */
export function factsToBaselineMetrics(
  facts: DiagnosisFact[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of facts) {
    const metric = f.metric.trim();
    if (!metric) continue;
    out[metric] = f.source.trim()
      ? `${f.value.trim()} [${f.source.trim()}]`
      : f.value.trim();
  }
  return out;
}

/** A human, prompt-friendly rendering of the facts (used when folding into text). */
export function factsToPromptText(facts: DiagnosisFact[]): string {
  return facts
    .filter((f) => f.metric || f.value)
    .map((f) => {
      const head = f.metric ? `${f.metric}: ${f.value}` : f.value;
      return f.source ? `- ${head} (source: ${f.source})` : `- ${head}`;
    })
    .join("\n");
}
