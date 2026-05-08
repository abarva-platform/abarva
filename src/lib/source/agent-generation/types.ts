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
//   5. Anthropic SDK call (Claude Sonnet) returns the markdown body.
//   6. Server writes the body to source_event_artifact_states.body
//      AND a generation receipt to body_generation_metadata.
//
// All four pieces (context binder, prompt registry, endpoint, UI)
// share these types.

import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from '@/lib/source/canvas-substrate/types';
import type { SourceStageKey } from '@/lib/source/types';

/**
 * Audit receipt persisted to body_generation_metadata after a Claude
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
  /** Anthropic stop reason (`end_turn`, `max_tokens`, …). */
  stopReason: string | null;
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
    archetype: string | null;
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
  /** Anthropic model id. Defaults to the latest Sonnet. */
  model: string;
  /** Max output tokens — keep generous; cap at 8000 for v1. */
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
