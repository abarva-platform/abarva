// Stage-6/Stage-7 seam · File 08 Section 4.6
//
// This file is the TypeScript contract between Code (renderer, Stage 7)
// and Codex (response assembler, Stage 6). Every agent turn that reaches
// the UI arrives as a `RenderedResponse`. The renderer assumes nothing
// beyond this shape.
//
// Why this file is here and not in Codex's runtime: per §18.1 the
// rendering contract (Section 9 grammar, Section 10 vocabulary, Section 7
// rendering) is Code-owned. Codex produces the shape; Code reads it.
// Keeping the type definition on the reader's side lets the renderer
// evolve without blocking on Codex's runtime changes.

/**
 * Citation target types from §9.1. Every citation in a rendered response
 * is one of these six. A hallucinated citation from Claude is stripped
 * at Stage 6 (§4.6 failure semantics) and never reaches this type.
 */
export type CitationTargetType =
  | 'pattern'
  | 'observation'
  | 'evidence_source'
  | 'prior_turn'
  | 'program'
  | 'deliverable';

/**
 * Confidence bucket rendered on citations per §9.3.
 * - HIGH maps to score ≥ 0.8
 * - MEDIUM maps to 0.6 ≤ score < 0.8
 * - LOW maps to score < 0.6 and REQUIRES explicit honest-disclosure
 *   prose before the citation renders (§9.3 rule, §10.3 vocabulary).
 */
export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Provenance marker from §7.2 return shape. This is the §10.5 distinction
 * made machine-readable: `authored` is industry knowledge, `observed`
 * and `measured` are customer-outcome data, `composite` is aggregated.
 */
export type Provenance = 'authored' | 'observed' | 'measured' | 'composite';

export interface Citation {
  /** Literal placeholder Claude emitted, e.g. `{{cite:pattern:ambient-intelligence-clinical-value-chain}}`. */
  placeholder: string;
  target_type: CitationTargetType;
  /** Stable id (pattern id, observation id, evidence source key, turn id, program id, deliverable code). */
  target_id: string;
  /** URL-safe slug or code — used to build the link target per File 04 URL grammar. */
  target_slug: string;
  /** Human-readable label that renders as the pill's primary text. */
  target_label: string;
  /** Numeric confidence score 0.0-1.0 from retrieval. */
  confidence: number;
  /** Bucketed tier for display; derived from confidence per §9.3. */
  confidence_tier: ConfidenceTier;
  /** Source provenance per §10.5 — required for observation/evidence_source citations. */
  provenance?: Provenance;
  /**
   * True when the citation target can't be resolved (404 on pattern page,
   * missing observation id). Rendered as plain text with a `broken` class
   * per §9.4 / §4.7 Stage 7 failure semantics — never hidden.
   */
  broken_target?: boolean;
}

/**
 * Headline confidence signal for the response as a whole, distinct from
 * per-citation tiers. Used by §10 vocabulary to choose the opener.
 * Maps to honest-disclosure categories:
 * - `high` → §10.1 phrases
 * - `medium` → §10.2 phrases
 * - `low` → §10.3 phrases
 * - `none` → response is operational/procedural, not a claim
 */
export type ConfidenceSignal = 'high' | 'medium' | 'low' | 'none';

/**
 * A follow-up action Claude offers at the end of the response (§5 closer
 * rules: Nexus reframings, Sentinel drill-downs, Atlas decision paths,
 * Steward next-steps). Renders as a clickable chip.
 */
export interface FollowUpAction {
  id: string;
  label: string;
  /** Optional secondary text below the label. */
  sub?: string;
  /**
   * What happens when the chip is clicked. `next_turn` sends the label
   * as the next user input; `navigate` jumps to a URL; `open_drawer`
   * opens the DrawerProvider with the given kind+id.
   */
  kind: 'next_turn' | 'navigate' | 'open_drawer';
  target?: string;
}

/**
 * Cross-agent handoff affordance per §12. Never silent — always rendered
 * as a user-initiated button (§12.4). The target agent's next turn reads
 * `context_carried` to open coherently (§12.3).
 */
export interface HandoffAffordance {
  to_agent: 'nexus' | 'sentinel' | 'atlas' | 'steward';
  reason: string;
  /** Short prose describing what context travels (e.g. "last 3 turns + program anchor"). */
  context_carried: string;
  /**
   * Target URL for the handoff destination. Built per File 04 URL grammar
   * per zone. Session context is passed via sessionStorage key set before
   * navigation.
   */
  target_href: string;
}

/**
 * Quality issue flags surfaced by Stage 6 assembly. Non-blocking in the
 * render — they tag the response for observability per §15.
 */
export type QualityIssue = 'hallucinated_citation_stripped' | 'truncated_for_context' | 'sparse_retrieval';

/**
 * The complete rendered_response shape per §4.6. This is what
 * `<AgentResponse>` consumes.
 */
export interface RenderedResponse {
  /** Claude's generation with citation placeholders still in-line for the renderer to resolve. */
  response_text: string;
  citations: Citation[];
  confidence_signal: ConfidenceSignal;
  /**
   * True when Fabric retrieval returned fewer than 3 patterns above the
   * confidence floor per §7.3. When true, the renderer MUST show a
   * sparsity prose line as the first substantive sentence of the response
   * (§10.4, §4.7 UI rendering).
   */
  sparsity_flag: boolean;
  follow_up_actions: FollowUpAction[];
  handoff_affordance: HandoffAffordance | null;
  /** Observability tags; never rendered to the user. */
  quality_issues?: QualityIssue[];
  /**
   * S5 · Honest-disclosure metadata derived from the platform Context
   * Bundle (S1) and its scoring/classification (S2). Optional; older
   * rendered responses without a Context Bundle leave this undefined and
   * existing renderers continue to work unchanged.
   */
  honest_disclosure?: HonestDisclosureMetadata;
}

/**
 * Recommended response mode per the response gate. Mirrors the gate
 * `reason` codes from S2's createResponseGate so renderers and composers
 * can branch on a single enum.
 */
export type RecommendedResponseMode =
  | 'proceed'
  | 'proceed_with_disclosure'
  | 'ask_for_missing_context'
  | 'refuse_or_defer';

/**
 * S5 · Per-turn honest-disclosure metadata. All fields are optional so
 * legacy turns without a scored Context Bundle can omit the entire
 * metadata block (or include only what is known) without breaking
 * renderers.
 *
 * The renderer uses this to choose a banner kind, populate confidence
 * chips, list "context used" categories, and surface missing-input
 * call-outs. None of these fields imply a specific UI layout — they are
 * the data contract; visual treatment lives in the components.
 */
export interface HonestDisclosureMetadata {
  /** 5-state classification from S2. */
  contextBundleState?:
    | 'complete'
    | 'usable_with_gaps'
    | 'pattern_only'
    | 'insufficient'
    | 'blocked';
  /**
   * Compact summary of which Context Bundle categories were populated
   * for this turn. Strings are intentionally human-friendly; the renderer
   * may pass them through verbatim into a chip group.
   */
  contextBundleSummary?: string[];
  /**
   * Bucketed confidence tier for the response as a whole. Derived from
   * the bundle state and quality scores per
   * deriveConfidenceLevelFromContextScore.
   */
  confidenceLevel?: ConfidenceTier;
  /**
   * Short rationale explaining why the confidence tier was assigned.
   * Renders next to the confidence chip when expanded.
   */
  confidenceReason?: string;
  /**
   * Canonical category labels the agent used (e.g. "Workflow state",
   * "Pattern library"). Drives the "Context used" chip group.
   */
  contextCategoriesUsed?: string[];
  /** Inputs the bundle declared missing, in priority order. */
  missingInputs?: string[];
  /** S2 vanilla_response_risk score (0-100, higher = worse). */
  vanillaResponseRisk?: number;
  /**
   * Single short prose line the renderer can show above the response
   * body. Composed deterministically from state plus risk.
   */
  disclosureMessage?: string;
  /** S2 response gate `reason` code. */
  responseGate?: RecommendedResponseMode;
  /** Whether the gate permits a substantive response at all. */
  permitsResponse?: boolean;
  /** Same value as responseGate, named for renderers reading mode hints. */
  recommendedResponseMode?: RecommendedResponseMode;
}

/**
 * Helper: bucket a numeric confidence score into the display tier per §9.3.
 * Single source of truth — renderer and response assembler both use it.
 */
export function confidenceTier(score: number): ConfidenceTier {
  if (score >= 0.8) return 'HIGH';
  if (score >= 0.6) return 'MEDIUM';
  return 'LOW';
}

/**
 * Helper: build the href for a citation target, given its type and slug.
 * Follows File 04 URL grammar per zone. Returns null when the target
 * type does not have a canonical URL (prior_turn is in-place).
 */
export function citationHref(citation: Citation): string | null {
  if (citation.broken_target) return null;
  switch (citation.target_type) {
    case 'pattern':
      return `/preview/intelligence/${citation.target_slug}`;
    case 'observation':
      // Observations live inside their parent pattern; target_slug is
      // expected to be `{pattern_slug}#obs-{observation_id}`.
      return `/preview/intelligence/${citation.target_slug}`;
    case 'evidence_source':
      return `/evidence/${encodeURIComponent(citation.target_id)}`;
    case 'program':
      return `/preview/programs/${citation.target_slug}`;
    case 'deliverable':
      // Deliverables resolve via their parent program context. The slug
      // is expected to be `{program_slug}/deliverables/{deliverable_code}`.
      return `/preview/programs/${citation.target_slug}`;
    case 'prior_turn':
      return null;
    default:
      return null;
  }
}
