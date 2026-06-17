// Central document-generation policy — the single source of truth for which
// Anthropic Claude model and token budget a given piece of work may use.
//
// THE RULE: serious deliverables must not run on chat-answer settings. Final,
// client-facing artifacts get an Opus-class model, a generous token budget,
// multi-pass generation, quality validation, citations, and durable storage.
// Short chat answers stay cheap. Everything in between is a working draft.
//
// Model IDs and token budgets are ENVIRONMENT-CONFIGURABLE so we can upgrade
// models without code changes; safe defaults are baked in and deliberately do
// NOT starve final deliverables.
//
// Scattered callers must resolve their model/token settings from here rather
// than hardcoding them. See docs/build/DOCUMENT_GENERATION_MODEL_POLICY.md.

export type DocGenTier =
  | "tier1_chat" // short Nexus/Sentinel answers — never a final deliverable
  | "tier2_working_draft" // preliminary drafts / internal analysis
  | "tier3_board_grade" // final / near-final client-facing artifacts
  | "tier4_large_package"; // RFPs, proposal packs, strategy memos, business cases, exec packs

export type DocGenQualityProfile =
  | "standard"
  | "real_engagement"
  | "premium_final";

export type DocumentGenerationPass =
  | "architect"
  | "evidence_grounding"
  | "full_draft"
  | "red_team"
  | "board_grade_rewrite"
  | "render_package"
  | "section_draft"
  | "synthesis";

export interface ResolvedDocPolicy {
  tier: DocGenTier;
  /** Resolved quality/cost profile for serious deliverables. */
  qualityProfile: DocGenQualityProfile;
  /** Resolved Claude model id (env-overridable). */
  model: string;
  /** Resolved max output tokens (env-overridable). */
  maxTokens: number;
  /** Tier 3/4 require multi-pass generation (never a single cramped call). */
  multiPass: boolean;
  /** Tier 3/4 must pass the quality validator before export. */
  requiresValidation: boolean;
  /** Tier 3/4 must emit a source register + cite client-specific facts. */
  requiresCitations: boolean;
  /** Tier 3/4 must persist to Blob + File Cabinet (no local-only artifacts). */
  requiresFileCabinet: boolean;
  /** True for tier1 only — used to reject chat budgets on deliverable paths. */
  isChatTier: boolean;
}

// ── Env-configurable model ids (latest, most-capable defaults) ──────────────
// Defaults track the current Claude family; override per environment to upgrade.
function envModel(key: string, fallback: string): string {
  const v = process.env[key]?.trim();
  return v && v.length > 0 ? v : fallback;
}

function envTokens(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function qualityProfile(): DocGenQualityProfile {
  const raw = process.env.ABARVA_DOCGEN_QUALITY_PROFILE?.trim().toLowerCase();
  switch (raw) {
    case "engagement":
    case "real":
    case "real_engagement":
    case "real-engagement":
      return "real_engagement";
    case "premium":
    case "final":
    case "premium_final":
    case "premium-final":
      return "premium_final";
    default:
      return "standard";
  }
}

function modelFor(tier: DocGenTier): string {
  switch (tier) {
    case "tier1_chat":
      return envModel("ABARVA_CLAUDE_CHAT_MODEL", "claude-haiku-4-5-20251001");
    case "tier2_working_draft":
      return envModel("ABARVA_CLAUDE_WORKING_DRAFT_MODEL", "claude-sonnet-4-6");
    case "tier3_board_grade":
      return envModel("ABARVA_CLAUDE_BOARD_GRADE_MODEL", "claude-opus-4-8");
    case "tier4_large_package":
      return envModel("ABARVA_CLAUDE_LARGE_PACKAGE_MODEL", "claude-opus-4-8");
  }
}

const TIER_TOKEN_DEFAULTS: Readonly<
  Record<DocGenQualityProfile, Record<DocGenTier, number>>
> = {
  standard: {
    tier1_chat: 1024,
    tier2_working_draft: 4000,
    tier3_board_grade: 16000,
    tier4_large_package: 16000,
  },
  real_engagement: {
    tier1_chat: 1024,
    tier2_working_draft: 8000,
    tier3_board_grade: 32000,
    tier4_large_package: 48000,
  },
  premium_final: {
    tier1_chat: 1024,
    tier2_working_draft: 12000,
    tier3_board_grade: 64000,
    tier4_large_package: 128000,
  },
};

function tokensForTier(tier: DocGenTier): number {
  const profile = qualityProfile();
  switch (tier) {
    case "tier1_chat":
      return envTokens(
        "ABARVA_DOCGEN_CHAT_MAX_TOKENS",
        TIER_TOKEN_DEFAULTS[profile][tier],
      );
    case "tier2_working_draft":
      return envTokens(
        "ABARVA_DOCGEN_DRAFT_MAX_TOKENS",
        TIER_TOKEN_DEFAULTS[profile][tier],
      );
    case "tier3_board_grade":
      return envTokens(
        "ABARVA_DOCGEN_BOARD_MAX_TOKENS",
        TIER_TOKEN_DEFAULTS[profile][tier],
      );
    case "tier4_large_package":
      return envTokens(
        "ABARVA_DOCGEN_PACKAGE_MAX_TOKENS",
        TIER_TOKEN_DEFAULTS[profile][tier],
      );
  }
}

const PASS_ENV_KEY: Readonly<Record<DocumentGenerationPass, string>> = {
  architect: "ARCHITECT",
  evidence_grounding: "EVIDENCE_GROUNDING",
  full_draft: "FULL_DRAFT",
  red_team: "RED_TEAM",
  board_grade_rewrite: "BOARD_GRADE_REWRITE",
  render_package: "RENDER_PACKAGE",
  section_draft: "SECTION_DRAFT",
  synthesis: "SYNTHESIS",
};

const PASS_TOKEN_DEFAULTS: Readonly<
  Record<DocGenQualityProfile, Record<DocumentGenerationPass, number>>
> = {
  // Current production-safe profile. Total high-stakes ceiling: 66k output.
  standard: {
    architect: 6000,
    evidence_grounding: 6000,
    full_draft: 16000,
    red_team: 6000,
    board_grade_rewrite: 16000,
    render_package: 16000,
    section_draft: 12000,
    synthesis: 6000,
  },
  // Real paid engagement profile. Total high-stakes ceiling: 132k output.
  real_engagement: {
    architect: 12000,
    evidence_grounding: 12000,
    full_draft: 32000,
    red_team: 12000,
    board_grade_rewrite: 32000,
    render_package: 32000,
    section_draft: 16000,
    synthesis: 8000,
  },
  // Final board/executive pack profile. Total high-stakes ceiling: 456k output.
  premium_final: {
    architect: 24000,
    evidence_grounding: 24000,
    full_draft: 128000,
    red_team: 24000,
    board_grade_rewrite: 128000,
    render_package: 128000,
    section_draft: 24000,
    synthesis: 12000,
  },
};

function defaultMaxPassTokens(profile: DocGenQualityProfile): number {
  return profile === "premium_final" ? 128000 : 64000;
}

export interface ResolvePassTokenBudgetInput {
  pass: DocumentGenerationPass;
  deliverableType?: string;
  tier?: DocGenTier;
  highStakes?: boolean;
}

export function resolveDocGenQualityProfile(): DocGenQualityProfile {
  return qualityProfile();
}

export function resolvePassTokenBudget(
  input: ResolvePassTokenBudgetInput,
): number {
  const profile = qualityProfile();
  const envKey = `ABARVA_DOCGEN_PASS_${PASS_ENV_KEY[input.pass]}_MAX_TOKENS`;
  const fallback = PASS_TOKEN_DEFAULTS[profile][input.pass];
  const highStakes = input.highStakes ?? true;
  const requested = envTokens(envKey, fallback);
  const adjusted = highStakes ? requested : Math.round(requested * 0.6);
  const capped = Math.min(
    adjusted,
    envTokens("ABARVA_DOCGEN_MAX_PASS_TOKENS", defaultMaxPassTokens(profile)),
  );
  return Math.max(1, capped);
}

export function estimateMaxPassOutputTokens(input?: {
  highStakes?: boolean;
}): number {
  const passes: DocumentGenerationPass[] = [
    "architect",
    "evidence_grounding",
    "full_draft",
    "red_team",
    "board_grade_rewrite",
    "render_package",
  ];
  return passes.reduce(
    (sum, pass) =>
      sum + resolvePassTokenBudget({ pass, highStakes: input?.highStakes }),
    0,
  );
}

// ── Deliverable → tier registry ─────────────────────────────────────────────
// Keys are normalized (lowercase, non-alphanumerics → "_"). Both human names
// ("Program Charter") and product codes ("d09_rfp_pack", "business_case")
// resolve via normalization. Tier 4 = large packages / RFPs / exec packs.
const DELIVERABLE_TIER: Readonly<Record<string, DocGenTier>> = {
  // ── Moves ──
  program_charter: "tier3_board_grade",
  charter: "tier3_board_grade",
  discovery_report: "tier3_board_grade",
  discovery_plan: "tier3_board_grade",
  evidence_request_pack: "tier3_board_grade",
  current_state_assessment: "tier3_board_grade",
  current_state: "tier3_board_grade",
  solution_design: "tier3_board_grade",
  design_spec: "tier3_board_grade",
  target_architecture: "tier3_board_grade",
  operating_model: "tier3_board_grade",
  estimate_model: "tier3_board_grade",
  value_model: "tier3_board_grade",
  mobilization_plan: "tier3_board_grade",
  handoff_pack: "tier3_board_grade",
  tower_handoff_plan: "tier3_board_grade",
  roadmap: "tier4_large_package",
  business_case: "tier4_large_package",
  executive_playback: "tier4_large_package",
  // ── Source ──
  source_event_brief: "tier3_board_grade",
  evidence_readiness_report: "tier3_board_grade",
  vendor_discussion_guide: "tier3_board_grade",
  proposal_health_summary: "tier3_board_grade",
  bafo_ask_sheet: "tier3_board_grade",
  contracting_handoff_pack: "tier3_board_grade",
  sourcing_strategy_memo: "tier4_large_package",
  strategy_memo: "tier4_large_package",
  rfp_package: "tier4_large_package",
  rfp: "tier4_large_package",
  proposal_normalization_workbook: "tier4_large_package",
  evaluation_workbook: "tier4_large_package",
  pricing_negotiation_memo: "tier4_large_package",
  negotiation_memo: "tier4_large_package",
  executive_recommendation: "tier4_large_package",
  // ── Source product codes (prompt-registry) ──
  d01_strategy_memo: "tier4_large_package",
  d05_scope_memo: "tier3_board_grade",
  d09_rfp_pack: "tier4_large_package",
  // ── Non-deliverable paths ──
  nexus_chat: "tier1_chat",
  sentinel_chat: "tier1_chat",
  chat: "tier1_chat",
  internal_analysis: "tier2_working_draft",
  preliminary_draft: "tier2_working_draft",
};

export function normalizeDeliverableKey(deliverableType: string): string {
  return deliverableType
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Resolve the tier for a deliverable type. Unknown deliverable types default to
 * **tier3_board_grade** (fail-safe toward quality, never toward a chat budget) —
 * a final-artifact path is never silently starved because its key was unmapped.
 */
export function tierForDeliverable(deliverableType: string): DocGenTier {
  return (
    DELIVERABLE_TIER[normalizeDeliverableKey(deliverableType)] ??
    "tier3_board_grade"
  );
}

export function policyForTier(tier: DocGenTier): ResolvedDocPolicy {
  const high = tier === "tier3_board_grade" || tier === "tier4_large_package";
  return {
    tier,
    qualityProfile: qualityProfile(),
    model: modelFor(tier),
    maxTokens: tokensForTier(tier),
    multiPass: high,
    requiresValidation: high,
    requiresCitations: high,
    requiresFileCabinet: high,
    isChatTier: tier === "tier1_chat",
  };
}

export interface ResolvePolicyInput {
  deliverableType?: string;
  tier?: DocGenTier;
}

/** Resolve the full policy for a deliverable type or an explicit tier. */
export function resolveDocumentPolicy(
  input: ResolvePolicyInput,
): ResolvedDocPolicy {
  const tier = input.tier ?? tierForDeliverable(input.deliverableType ?? "");
  return policyForTier(tier);
}

/**
 * GUARD: a final/near-final deliverable must never run on a chat-tier budget.
 * Throws when the resolved tier is tier1 (or the budget is at/below the chat
 * ceiling). Call this at deliverable-generation entry points and in tests.
 */
export function assertDeliverablePolicy(
  deliverableType: string,
): ResolvedDocPolicy {
  const policy = resolveDocumentPolicy({ deliverableType });
  const chatCeiling = tokensForTier("tier1_chat");
  if (policy.isChatTier) {
    throw new Error(
      `[docgen-policy] "${deliverableType}" resolved to a chat tier; final deliverables must use tier2+ (working/board/package).`,
    );
  }
  if (policy.maxTokens <= chatCeiling) {
    throw new Error(
      `[docgen-policy] "${deliverableType}" resolved to ${policy.maxTokens} tokens (≤ chat ceiling ${chatCeiling}); final deliverables must not use chat-answer budgets.`,
    );
  }
  return policy;
}
