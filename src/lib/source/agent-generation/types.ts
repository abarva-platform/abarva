// Agent generation · types
//
// When the canvas calls "Generate with Sentinel" on an artifact, the
// flow is:
//
//   1. Canvas POSTs to the generate endpoint with the artifact code.
//   2. Server resolves the canonical event + tenant.
//   3. Context binder pulls upstream substrate (approved bodies of
//      prior-stage artifacts, gate criteria states, evidence states,
//      tenant/event metadata).
//   4. Prompt registry returns the per-artifact prompt template
//      (versioned). Builder fills the template with bound context.
//   5. Anthropic Claude returns the markdown body.
//   6. Server writes the body to source_event_artifact_states.body
//      AND a generation receipt to body_generation_metadata.
//
// All four pieces (context binder, prompt registry, endpoint, UI)
// share these types.

import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from "@/lib/source/canvas-substrate/types";
import type { SourceStageGuidebookRecord } from "@/lib/source/stage-guidebooks/types";
import type { SourceStageKey } from "@/lib/source/types";
import type { VendorProposalFactRecord } from "@/lib/source/vendor-proposals/types";

/**
 * Audit receipt persisted to body_generation_metadata after an Anthropic
 * generation. Survives the body itself; if the body is later
 * hand-edited the metadata still describes the original generation.
 */
export interface SourceArtifactBodyGenerationMetadata {
  /** Anthropic model id used (e.g. `claude-sonnet-4-6`). */
  model: string;
  /** Prompt template id — typically the artifact code. */
  promptTemplateId: string;
  /**
   * Monotonically-increasing version of the prompt template. Bump
   * whenever the prompt changes so old generations are explicable.
   */
  promptTemplateVersion: number;
  /**
   * Artifact codes whose bodies were bound into the prompt context.
   * Empty array means no upstream artifacts were used.
   */
  upstreamBoundCodes: string[];
  /** ISO 8601 of the API response. */
  generatedAt: string;
  /** Clerk user id of whoever clicked Generate. */
  generatedByUserId: string | null;
  /** From Anthropic usage: input tokens (best-effort). */
  tokensIn: number | null;
  /** From Anthropic usage: output tokens (best-effort). */
  tokensOut: number | null;
  /** Provider stop reason (`completed`, `max_output_tokens`, etc.). */
  stopReason: string | null;
  /** Optional consulting-grade quality gate for flagship artifacts. */
  qualityGate?: Record<string, unknown>;
  /** Deterministic required-section check for generated drafts. */
  sectionVerification?: {
    status: "verified" | "incomplete";
    checkedAt: string;
    requiredSections: string[];
    missingSections: string[];
  };
  /** ISO timestamp set when a human edits/saves the AI draft. */
  humanEditedAt?: string;
  /** Clerk user id of the human who edited/saved the AI draft. */
  humanEditedByUserId?: string | null;
  /**
   * Reasoning-spine capture (Slices 1.6–1.7, flag `source_reasoning_spine`). Present
   * iff the flag was on.
   * - "ok": claims grounded on usable evidence; envelope.claims is populated.
   * - "refusal": spine ran but no gate-defining claim rests on usable evidence;
   *   envelope.refusal carries the reason + missingEvidence list (Slice 1.7).
   * - "gate_failed"/"error": spine failed internally; envelope is null.
   * - "disabled": flag off; envelope is null.
   * The generated body is unchanged across all statuses.
   */
  reasoningStatus?: "disabled" | "ok" | "refusal" | "gate_failed" | "error";
  reasoningEnvelope?: unknown;
  /**
   * Deterministic backstop scan (source-documentation-standards.ts's
   * scanForBannedTerms) run against the final body after the quality gate
   * and client-facing sanitizer. Non-blocking — a hit is a visibility signal
   * for human review, not a generation failure. Empty array covers both "scan
   * ran, found nothing" and "no profile registered for this artifact code, so
   * there was no banned-term list to check against."
   */
  bannedTermMatches?: string[];
}

/**
 * Read-only snapshot of everything the prompt builder needs. Fed by
 * the context-binder. Tenant-scoped — the binder never bridges across
 * client_keys.
 */
export interface SourceGenerationContext {
  tenantKey: string;
  tenantName: string;
  event: {
    id: string;
    code: string;
    name: string;
    /** Coarse label derived from event_type (legacy fallback). Prefer classifiedCategory when present. */
    archetype: string | null;
    /** Deterministic categoryId stored at intake (Slice 1.1). Preferred over archetype for reasoning. */
    classifiedCategory?: string | null;
    rigor: string | null;
    currentStageKey: SourceStageKey;
    statusLabel: string;
    owner: string | null;
    triggerDescription: string | null;
    scopeDescription: string | null;
    estimatedValueUsd: number | null;
  };
  /**
   * All artifact states for the event. The prompt builder picks which
   * upstream codes to bind based on the prompt template config.
   */
  artifactStates: SourceEventArtifactState[];
  gateCriteria: SourceEventGateCriterion[];
  evidence: SourceEventEvidence[];
  /**
   * The tenant's application/systems inventory, pulled through the sanctioned
   * broker seam (setup-data-broker) and translated to a light per-app shape.
   * Empty (or absent) when the tenant has no inventory loaded — d04 generation
   * falls back to a blank framework rather than inventing applications.
   */
  enterpriseAppInventory?: SourceAppInventoryEntry[];
  /**
   * Uploaded evidence artifacts for the event, parsed by the Source ingestion
   * pipeline. Prompts cite these by original filename so Claude can ground
   * claims in the actual uploaded documents rather than fabricating.
   * Empty array when no evidence has been uploaded or parsed.
   */
  uploadedEvidence?: SourceGenerationUploadedArtifact[];
  /**
   * Archetype-specific commercial intelligence block (traps, levers, failure
   * modes) resolved from the event's classified category. Pre-formatted for
   * direct injection into artifact prompts. Absent when the category is
   * unmapped or the archetype framework has no playbook for it.
   */
  archetypeAdvisory?: string | null;
  /**
   * Accepted VendorProposalFacts for this event (all vendors) — the governed
   * vendor-proposal ingestion foundation (PR 3,
   * ADR-0013-source-modernization-baseline.md). Read via
   * getAuthoritativeVendorProposalFacts, so this NEVER includes a candidate,
   * rejected, or superseded fact — only ones a human has explicitly accepted
   * as authoritative. Empty array when no facts have been accepted yet.
   */
  authoritativeVendorProposalFacts?: VendorProposalFactRecord[];
  /**
   * Facilitator guidebook for the event's current stage, when published.
   * Generation prompts use this as operating context: what meeting to run,
   * what evidence to collect, and how to capture the stage decision.
   */
  currentStageGuidebook?: SourceStageGuidebookRecord | null;
  /**
   * Published guidebook for the next stage, when available. This lets a
   * Strategy artifact, for example, prepare the Scope data-collection plan
   * and point the client to the right templates before the next gate opens.
   */
  nextStageGuidebook?: SourceStageGuidebookRecord | null;
}

/**
 * A single uploaded evidence artifact (document, spreadsheet, contract, etc.)
 * that has been parsed and chunked by the Source ingestion pipeline. Bound
 * into the generation context so prompts can cite evidence by filename.
 */
export interface SourceGenerationUploadedArtifact {
  id: string;
  originalName: string;
  artifactFamily: string;
  sourceFormat: string;
  parseStatus: string;
  evidenceState: string;
  stageKey: SourceStageKey;
  /** Representative text excerpts from parsed chunks (up to 5). */
  chunkExcerpts: string[];
  /** Structured fact summaries extracted from the artifact (up to 5). */
  factSummaries: string[];
}

/** One application/system, shaped for the d04 inventory table. */
export interface SourceAppInventoryEntry {
  appId: string;
  name: string;
  tier: string | null;
  owner: string | null;
  vendor: string | null;
  criticality: string | null;
  notes: string | null;
}

/**
 * Per-artifact prompt template. Versioned so audit metadata survives
 * prompt changes.
 */
export interface SourceArtifactPromptTemplate {
  /** Artifact code (e.g. `d09_rfp_pack`). Used as the registry key. */
  artifactCode: string;
  /** Bump on any prompt change. */
  version: number;
  /** OpenAI model id. Defaults to the Source OpenAI model. */
  model: string;
  /** Max output tokens — keep generous; quality and completeness come first. */
  maxTokens: number;
  /**
   * Static system prompt for this artifact (voice + format
   * requirements + structural sections expected).
   */
  systemPrompt: string;
  /**
   * Which upstream artifact codes (from prior stages) the prompt
   * binder must include in the user message. Missing-but-required
   * upstream artifacts cause a 409 with a clear "author X first" message.
   */
  upstreamRequired: string[];
  /**
   * Optional upstream codes — included if authored, ignored if not.
   */
  upstreamOptional: string[];
  /**
   * Builds the user message from bound context. Receives only the
   * tenant-scoped, sanitized context — never raw env or session.
   */
  buildUserMessage: (
    ctx: SourceGenerationContext,
    boundUpstreamBodies: Record<string, string>,
  ) => string;
}

export interface SourceGenerationResult {
  body: string;
  metadata: SourceArtifactBodyGenerationMetadata;
}

export interface SourceGenerationError {
  error: string;
  detail: string;
  status: number;
}
