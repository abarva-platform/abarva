// S6 · Pure mapping from RenderedResponse.honest_disclosure to a UI view
// model the agent components consume. Deterministic. No React imports,
// no DOM access, no model calls.
//
// AgentResponse, HonestDisclosureBanner, ConfidenceQualifier, and
// SparsitySignal each consume a slice of this view model. Keeping the
// mapping in one pure helper means the components stay thin and the
// behavior is testable from TypeScript without a React harness.

import type { DisclosureKind } from '@/components/agent/HonestDisclosureBanner';
import type {
  ConfidenceTier,
  HonestDisclosureMetadata,
  RecommendedResponseMode,
  RenderedResponse,
} from './renderedResponse';

export interface HonestDisclosureViewModel {
  /**
   * The DisclosureKind to surface in HonestDisclosureBanner, or null if
   * no banner should render. AgentResponse uses this to decide whether
   * to mount the banner above the response body.
   */
  bannerKind: DisclosureKind | null;
  /**
   * Single-sentence detail string for the banner. Composed
   * deterministically from disclosureMessage + missingInputs.
   */
  bannerDetail?: string;
  /**
   * For DisclosureKind === 'quality', the assembly issue label that the
   * banner should display verbatim.
   */
  qualityIssueLabel?: string;
  /**
   * Confidence chip data. Renderers show ConfidenceQualifier with this
   * tier when present; null suppresses the chip entirely.
   */
  confidence: { tier: ConfidenceTier; reason?: string } | null;
  /**
   * Sparsity-line addendum. AgentResponse already mounts SparsitySignal
   * when response.sparsity_flag is true; this string is forwarded as
   * evidenceSummary so the line names what is or isn't available.
   */
  sparsityEvidenceSummary?: string;
  /**
   * Human-friendly category labels (e.g. "Identity", "Pattern library").
   * Drives the optional "Context used" chip row below the response body.
   */
  contextCategoriesUsed: string[];
  /** First-class missing-input labels surfaced under the response body. */
  missingInputs: string[];
  /**
   * Honest-disclosure prose line. Distinct from bannerDetail because the
   * banner kind may be null while the response still benefits from a
   * short framing line above the body.
   */
  disclosureMessage?: string;
  /** Whether the gate currently permits a substantive response. */
  permitsResponse: boolean | null;
  /** Mirror of HonestDisclosureMetadata.recommendedResponseMode. */
  recommendedResponseMode?: RecommendedResponseMode;
}

const EMPTY_VIEW_MODEL: HonestDisclosureViewModel = {
  bannerKind: null,
  confidence: null,
  contextCategoriesUsed: [],
  missingInputs: [],
  permitsResponse: null,
};

/**
 * Compute the UI view model for an agent response. Pure: same input
 * always yields the same output. Returns a safe empty model when
 * honest_disclosure is absent so legacy responses render unchanged.
 */
export function getHonestDisclosureViewModel(
  response: RenderedResponse,
): HonestDisclosureViewModel {
  const meta = response.honest_disclosure;
  if (!meta) {
    // Legacy responses without S5 metadata: keep the renderer behavior
    // identical to pre-S6 by returning an empty view model. The caller
    // still has access to response.sparsity_flag and quality_issues if
    // it wants to react to those primitives.
    return EMPTY_VIEW_MODEL;
  }

  const bannerKind = pickBannerKind(meta, response);
  const qualityIssueLabel = bannerKind === 'quality'
    ? pickQualityIssueLabel(meta, response)
    : undefined;
  const bannerDetail = pickBannerDetail(meta, bannerKind);
  const sparsityEvidenceSummary = response.sparsity_flag
    ? composeSparsityAddendum(meta)
    : undefined;

  return {
    bannerKind,
    bannerDetail,
    qualityIssueLabel,
    confidence: meta.confidenceLevel
      ? { tier: meta.confidenceLevel, reason: meta.confidenceReason }
      : null,
    sparsityEvidenceSummary,
    contextCategoriesUsed: meta.contextCategoriesUsed ?? [],
    missingInputs: meta.missingInputs ?? [],
    disclosureMessage: meta.disclosureMessage,
    permitsResponse: typeof meta.permitsResponse === 'boolean'
      ? meta.permitsResponse
      : null,
    recommendedResponseMode: meta.recommendedResponseMode,
  };
}

// --- Internal: banner kind selection ----------------------------------

function pickBannerKind(
  meta: HonestDisclosureMetadata,
  response: RenderedResponse,
): DisclosureKind | null {
  // refuse_or_defer is the strongest signal: the gate has refused.
  if (meta.recommendedResponseMode === 'refuse_or_defer') return 'cannot_help';

  // Quality issues from Stage-6 assembly trump bundle state.
  if (response.quality_issues && response.quality_issues.length > 0) {
    return 'quality';
  }

  // ask_for_missing_context with permitsResponse=false renders as
  // 'quality' to convey "we cannot answer until X" without overlapping
  // with the dedicated SparsitySignal primitive.
  if (
    meta.recommendedResponseMode === 'ask_for_missing_context'
    && meta.permitsResponse === false
  ) {
    return 'quality';
  }

  // Otherwise, suppress the banner. Sparsity has its own component;
  // proceed and proceed_with_disclosure are handled by inline confidence
  // and context-used affordances below the body.
  return null;
}

function pickQualityIssueLabel(
  meta: HonestDisclosureMetadata,
  response: RenderedResponse,
): string | undefined {
  if (response.quality_issues && response.quality_issues.length > 0) {
    return response.quality_issues.join(', ');
  }
  // pattern_only with permitsResponse=false reaches this branch via
  // ask_for_missing_context, and the user-facing meaning matches
  // 'insufficient' (we cannot speak until X arrives).
  if (
    meta.contextBundleState === 'insufficient'
    || meta.contextBundleState === 'pattern_only'
  ) {
    return 'context_insufficient';
  }
  if (meta.contextBundleState === 'blocked') {
    return 'context_blocked';
  }
  return undefined;
}

function pickBannerDetail(
  meta: HonestDisclosureMetadata,
  kind: DisclosureKind | null,
): string | undefined {
  if (!kind) return undefined;
  // Detail strings should be short single sentences; the disclosure
  // message already has that shape.
  return meta.disclosureMessage;
}

function composeSparsityAddendum(
  meta: HonestDisclosureMetadata,
): string | undefined {
  if (!meta.missingInputs || meta.missingInputs.length === 0) {
    // Fall back to the disclosure message if no specific inputs are
    // named; helps SparsitySignal stay informative without inventing.
    return meta.disclosureMessage ?? undefined;
  }
  const named = meta.missingInputs.slice(0, 2).join(', ');
  const more = meta.missingInputs.length > 2
    ? ` plus ${meta.missingInputs.length - 2} more`
    : '';
  return `Missing: ${named}${more}.`;
}
