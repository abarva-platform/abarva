// ── MoveContextBundleTrace (PR-8) ─────────────────────────────────────────────
// The audit trace for a generated Move deliverable. Mirrors the Source
// SourceContextBundleTrace but scoped to a Move deliverable run: what evidence
// the deliverable rested on, which sources were cited, how many claims were
// supported vs unsupported, the model + passes, the quality gate verdict, and a
// grounding status. Emitted on every generation and attached to the artifact's
// vault metadata so the File Cabinet entry is fully auditable — no deliverable
// without a traceable provenance record.

export type MoveGroundingStatus = "pass" | "warn" | "block";

export interface MoveTraceCitation {
  /** The [n] marker as rendered. */
  marker: string;
  /** The Source Register label it resolves to. */
  label: string;
}

export interface MoveContextBundleTrace {
  trace_id: string;
  tenant_id: string;
  tenant_key: string;
  move_id: string;
  deliverable_type: string;
  move_name: string;

  generated_at: string;
  model: string;
  passes: number;

  /** Evidence families/source-register entries the deliverable cited. */
  evidence_sources_used: string[];
  citations_emitted: MoveTraceCitation[];
  citations_count: number;

  claims_supported: number;
  claims_unsupported: number;

  /** Open obligations carried into the artifact (client-to-complete, gaps). */
  open_items: string[];

  quality_score: number | null;
  quality_pass: boolean;

  grounding_status: MoveGroundingStatus;
  grounding_warnings: string[];

  /** Internal-tag leak guard verdict. */
  tenant_leakage_status: "clean" | "leak_detected";
}

const INTERNAL_TAG_RE =
  /\b(document_extract:|tower_|enterprise_context_|chunk_id|fact_key|source_segment_id)\b/i;

function deriveGrounding(
  citationsCount: number,
  unsupported: number,
  qualityPass: boolean,
): { status: MoveGroundingStatus; warnings: string[] } {
  const warnings: string[] = [];
  if (citationsCount === 0) {
    warnings.push("no governed evidence was cited for this deliverable");
    return { status: "block", warnings };
  }
  if (!qualityPass || unsupported > 0) {
    if (unsupported > 0)
      warnings.push(`${unsupported} claim(s) lack a citation and are flagged`);
    if (!qualityPass)
      warnings.push("quality gate did not pass — artifact is preliminary");
    return { status: "warn", warnings };
  }
  return { status: "pass", warnings };
}

export interface BuildTraceInput {
  tenantId: string;
  tenantKey: string;
  moveId: string;
  deliverableType: string;
  moveName: string;
  model: string;
  passes: number;
  sourceRegister: Array<{ marker?: string; label?: string } | string>;
  bodyMarkdown: string;
  unsupportedClaims: unknown[];
  openItems: string[];
  qualityScore: number | null;
  qualityPass: boolean;
}

/** Build a MoveContextBundleTrace from an orchestrated deliverable result.
 *  `index` varies the trace id deterministically (no Date.now/Math.random). */
export function buildMoveContextBundleTrace(
  input: BuildTraceInput,
): MoveContextBundleTrace {
  const citations: MoveTraceCitation[] = (input.sourceRegister ?? []).map(
    (e, i) =>
      typeof e === "string"
        ? { marker: `[${i + 1}]`, label: e }
        : {
            marker: e.marker ?? `[${i + 1}]`,
            label: e.label ?? `source ${i + 1}`,
          },
  );
  const sourcesUsed = citations.map((c) => c.label);
  // Supported claims = total citation markers used in body; approximate by
  // counting [n] occurrences. Unsupported is reported directly.
  const supported = (input.bodyMarkdown.match(/\[\d+\]/g) ?? []).length;
  const unsupported = input.unsupportedClaims?.length ?? 0;
  const { status, warnings } = deriveGrounding(
    citations.length,
    unsupported,
    input.qualityPass,
  );
  const leak = INTERNAL_TAG_RE.test(input.bodyMarkdown)
    ? "leak_detected"
    : "clean";
  const traceId = `mctx_${input.moveId.slice(0, 8)}_${input.deliverableType}_${input.passes}_${citations.length}`;
  return {
    trace_id: traceId,
    tenant_id: input.tenantId,
    tenant_key: input.tenantKey,
    move_id: input.moveId,
    deliverable_type: input.deliverableType,
    move_name: input.moveName,
    generated_at: new Date().toISOString(),
    model: input.model,
    passes: input.passes,
    evidence_sources_used: sourcesUsed,
    citations_emitted: citations,
    citations_count: citations.length,
    claims_supported: supported,
    claims_unsupported: unsupported,
    open_items: input.openItems ?? [],
    quality_score: input.qualityScore,
    quality_pass: input.qualityPass,
    grounding_status: status,
    grounding_warnings: warnings,
    tenant_leakage_status: leak,
  };
}
