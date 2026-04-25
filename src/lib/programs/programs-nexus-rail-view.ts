// Deterministic helpers that produce S5/S6-aware RenderedResponse
// objects for the Programs Nexus rail. S9b slice.
//
// What this module does
// ---------------------
// 1. Assembles a platform Context Bundle (S1) for a Programs surface
//    using only seed data.
// 2. Scores the bundle (S2) and derives honest_disclosure metadata
//    (S5) so the renderer can surface confidence, context-used,
//    missing-input, and response-gate state without fabricating data.
// 3. Builds a RenderedResponse per rail "choice" (or the opener) so
//    AgentRail can render it through <AgentResponse>.
//
// What this module does NOT do
// ----------------------------
// - No live agent / model calls.
// - No Date.now() reads (deterministic across renders).
// - No Source UI / mock.ts / Nexus runtime imports.
// - No prompt content changes.
// - No I/O.
//
// Honest fallbacks
// ----------------
// Today's seed does not capture per-program value, risk, evidence, or
// decisions. The bundle declares those categories absent (present:false
// with explicit missingFields). The honest_disclosure metadata then
// surfaces the gap as a missing-input and a low confidence tier rather
// than fabricating a number.

import {
  CONTEXT_BUNDLE_CATEGORY_KEYS,
  createEmptyContextBundle,
  type ContextBundle,
  type ContextBundleAllowedAction,
  type ContextBundleArtifactReference,
  type ContextBundleAssemblyInput,
  type ContextBundleConfidenceTier,
  type ContextBundleConversationReference,
  type ContextBundleEvidenceReference,
  type ContextBundleMissingInput,
  type ContextBundlePatternReference,
} from '@/lib/agent/context-bundle';
import {
  classifyContextBundle,
  createResponseGate,
  scoreContextBundle,
} from '@/lib/agent/context-bundle-scoring';
import { deriveHonestDisclosureMetadata } from '@/lib/agent/honestDisclosure';
import type {
  HonestDisclosureMetadata,
  RenderedResponse,
} from '@/lib/agent/renderedResponse';
import type {
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';
import {
  countDeliverableTiers,
  HONEST_FALLBACK_LABELS,
  mapSpecPhaseToCanonicalIndex,
  CANONICAL_SIX_PHASES,
  summarizeProgram,
} from '@/lib/programs/programs-canonical-view';

// =====================================================================
// Public types
// =====================================================================

export type ProgramNexusRailMode =
  | 'opener'
  | 'walk-charter'
  | 'pressure-test'
  | 'surface-contradictions'
  | 'phase-readiness'
  | 'next-step';

export interface ProgramNexusRailChoice {
  id: ProgramNexusRailMode;
  label: string;
  sub: string;
}

export interface ProgramNexusRailRenderedTurn {
  rendered: RenderedResponse;
  bundle: ContextBundle;
  metadata: HonestDisclosureMetadata;
}

const STABLE_TIMESTAMP = '2026-04-24T00:00:00.000Z';
const TENANT_USER_ID = 'programs-rail-viewer';
const TENANT_USER_ROLE = 'sponsor';

// =====================================================================
// Context Bundle builder
// =====================================================================

/**
 * Build a fully-scored Context Bundle for the canonical Programs detail
 * surface. Pure: same tenant + program input always returns identical
 * bundle, score, and gate.
 */
export function buildProgramNexusContextBundle(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
): ContextBundle {
  const view = summarizeProgram(program);
  const tiers = countDeliverableTiers(program.deliverables);
  const canonicalIndex = mapSpecPhaseToCanonicalIndex(program.currentPhaseSpec);
  const canonicalPhase = CANONICAL_SIX_PHASES[canonicalIndex - 1];

  const assemblyInput: ContextBundleAssemblyInput = {
    tenantId: tenant.tenantKey,
    tenantName: tenant.displayName,
    userId: TENANT_USER_ID,
    userRole: TENANT_USER_ROLE,
    route: program.routePath,
    surface: 'programs',
    assignedAgent: 'nexus',
    workObjectId: program.programSlug,
    workObjectKind: 'program',
    requestedAt: STABLE_TIMESTAMP,
  };
  const bundle = createEmptyContextBundle(assemblyInput);

  // ---- Identity -----------------------------------------------------
  bundle.categories.identity = {
    key: 'identity',
    present: true,
    provenance: 'deterministic',
    data: {
      tenantKey: tenant.tenantKey,
      tenantName: tenant.displayName,
      tenantRouteSlug: tenant.routeSlug,
      userRole: TENANT_USER_ROLE,
    },
    missingFields: [],
    loadedAt: STABLE_TIMESTAMP,
  };

  // ---- Work Object --------------------------------------------------
  bundle.categories.workObject = {
    key: 'workObject',
    present: true,
    provenance: 'deterministic',
    data: {
      code: program.code,
      slug: program.programSlug,
      name: program.name,
      archetypeCode: program.archetypeCode,
      appArchetype: program.appArchetype,
      status: program.status,
      patternSlug: program.patternSlug,
      roleInDemo: program.roleInDemo,
    },
    missingFields: [],
    loadedAt: STABLE_TIMESTAMP,
  };

  // ---- Workflow State ----------------------------------------------
  bundle.categories.workflowState = {
    key: 'workflowState',
    present: true,
    provenance: 'deterministic',
    data: {
      currentPhaseSpec: program.currentPhaseSpec,
      currentCanonicalIndex: canonicalIndex,
      currentCanonicalPhaseLabel: canonicalPhase.label,
      lifecycleStatus: program.status,
    },
    // Hard-gate state machine is not yet seeded (deferred to S9c).
    missingFields: ['gates_status', 'blockers', 'nextActionDueDate'],
    loadedAt: STABLE_TIMESTAMP,
  };

  // ---- Business Context (NOT seeded) -------------------------------
  // Honestly absent — deferred to S9d.
  bundle.categories.businessContext = {
    key: 'businessContext',
    present: false,
    provenance: 'unknown',
    missingFields: ['projectedValue', 'risks', 'decisionsPending'],
  };

  // ---- Artifacts ---------------------------------------------------
  bundle.artifactReferences = program.deliverables
    .slice(0, 6)
    .map<ContextBundleArtifactReference>((deliverable) => ({
      id: deliverable.deliverableCode,
      title: deliverable.title,
      kind: deliverable.deliverableTypeKey,
      tier:
        deliverable.renderTier === 'rich'
          ? 'rich'
          : deliverable.renderTier === 'outline'
            ? 'outline'
            : 'stub',
      status: deliverable.status,
      missingInputs: [],
      evidenceIds: [],
    }));
  bundle.categories.artifacts = {
    key: 'artifacts',
    present: tiers.total > 0,
    provenance: tiers.total > 0 ? 'deterministic' : 'unknown',
    data: tiers.total > 0
      ? {
          totalCount: tiers.total,
          richCount: tiers.rich,
          outlineCount: tiers.outline,
          stubCount: tiers.stub,
        }
      : undefined,
    missingFields: tiers.total === 0 ? ['deliverables'] : [],
    loadedAt: STABLE_TIMESTAMP,
  };

  // ---- Patterns ----------------------------------------------------
  if (program.patternSlug) {
    bundle.patternReferences = [
      buildPatternReference(program.patternSlug),
    ];
    bundle.categories.patterns = {
      key: 'patterns',
      present: true,
      provenance: 'retrieved',
      data: {
        patternSlug: program.patternSlug,
        patternCount: 1,
      },
      missingFields: ['contradictsPatternIds'],
      loadedAt: STABLE_TIMESTAMP,
    };
  } else {
    bundle.categories.patterns = {
      key: 'patterns',
      present: false,
      provenance: 'unknown',
      missingFields: ['patternSlug'],
    };
  }

  // ---- Evidence (NOT seeded) ---------------------------------------
  // Honestly absent — deferred to S9d.
  bundle.evidenceReferences = [];
  bundle.categories.evidence = {
    key: 'evidence',
    present: false,
    provenance: 'unknown',
    missingFields: ['evidenceBase', 'citations'],
  };

  // ---- Conversation (first turn) -----------------------------------
  bundle.conversationReferences = [];
  bundle.categories.conversation = {
    key: 'conversation',
    present: true,
    provenance: 'deterministic',
    data: {
      conversationTurnCount: 1,
      isFirstTurn: true,
    },
    missingFields: [],
    loadedAt: STABLE_TIMESTAMP,
  };

  // ---- Missing inputs ----------------------------------------------
  bundle.missingInputs = collectMissingInputs(view);

  // ---- Allowed actions (deterministic, surface-specific) -----------
  bundle.allowedActions = buildAllowedActions(program);

  // ---- Score + classify + gate -------------------------------------
  bundle.state = classifyContextBundle(bundle);
  bundle.qualityScore = scoreContextBundle(bundle);
  bundle.responseGate = createResponseGate(bundle);

  return bundle;
}

function buildPatternReference(slug: string): ContextBundlePatternReference {
  return {
    id: slug,
    name: humanizePatternSlug(slug),
    tier: 'useCase',
    relevanceScore: 80,
    authoringStatus: 'AUTHORED-REVIEWED',
    sectionsCited: [],
  };
}

function humanizePatternSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function collectMissingInputs(view: ReturnType<typeof summarizeProgram>): ContextBundleMissingInput[] {
  const missing: ContextBundleMissingInput[] = [
    {
      id: 'business-context-value',
      label: 'Projected value not yet captured',
      category: 'businessContext',
      blocking: false,
    },
    {
      id: 'business-context-risks',
      label: 'Risk register not yet captured',
      category: 'businessContext',
      blocking: false,
    },
    {
      id: 'evidence-citations',
      label: 'Evidence citations not yet captured',
      category: 'evidence',
      blocking: false,
    },
  ];
  if (view.deliverableTiers.total === 0) {
    missing.push({
      id: 'deliverables',
      label: 'Deliverables not yet seeded',
      category: 'artifacts',
      blocking: false,
    });
  }
  return missing;
}

function buildAllowedActions(program: ProgramSeedPlan): ContextBundleAllowedAction[] {
  return [
    {
      id: 'walk-charter',
      label: 'Walk me through the charter',
      kind: 'ask',
      allowed: true,
      requiresGateCheck: false,
      requiresEvidenceCheck: false,
    },
    {
      id: 'pressure-test',
      label: 'Pressure-test the business case',
      kind: 'ask',
      allowed: true,
      requiresGateCheck: false,
      requiresEvidenceCheck: false,
    },
    {
      id: 'surface-contradictions',
      label: 'Surface the top contradictions',
      kind: 'ask',
      allowed: program.deliverables.length > 0,
      requiresGateCheck: false,
      requiresEvidenceCheck: false,
    },
    {
      id: 'phase-readiness',
      label: 'Am I ready to advance this phase?',
      kind: 'reviewGate',
      allowed: true,
      requiresGateCheck: true,
      requiresEvidenceCheck: false,
    },
    {
      id: 'next-step',
      label: 'What is the next step I should take?',
      kind: 'ask',
      allowed: true,
      requiresGateCheck: false,
      requiresEvidenceCheck: false,
    },
  ];
}

// =====================================================================
// Choice catalog
// =====================================================================

export function buildProgramNexusRailChoices(
  _tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
): ProgramNexusRailChoice[] {
  const phase = mapSpecPhaseToCanonicalIndex(program.currentPhaseSpec);
  const phaseLabel = CANONICAL_SIX_PHASES[phase - 1].label;
  return [
    {
      id: 'walk-charter',
      label: 'Walk me through the charter',
      sub: 'Scope, target state, success metrics',
    },
    {
      id: 'pressure-test',
      label: 'Pressure-test the business case',
      sub: 'What assumptions might not hold?',
    },
    {
      id: 'surface-contradictions',
      label: 'Surface the top contradictions',
      sub: 'Blockers to value or trust',
    },
    {
      id: 'phase-readiness',
      label: 'Am I ready to advance this phase?',
      sub: `Gate conditions for ${phaseLabel}`,
    },
    {
      id: 'next-step',
      label: "What's the next step I should take?",
      sub: 'Concrete decision or action',
    },
  ];
}

// =====================================================================
// RenderedResponse builder
// =====================================================================

export function buildProgramNexusRenderedResponse(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  mode: ProgramNexusRailMode = 'opener',
): ProgramNexusRailRenderedTurn {
  const bundle = buildProgramNexusContextBundle(tenant, program);
  const metadata = deriveHonestDisclosureMetadata({
    bundle,
    state: bundle.state ?? null,
    qualityScore: bundle.qualityScore ?? null,
    responseGate: bundle.responseGate ?? null,
  });

  const proseLines = composeProse(tenant, program, mode, metadata);
  const followUps = followUpsFor(mode);
  const confidenceSignal = mapConfidenceSignal(metadata.confidenceLevel);

  const rendered: RenderedResponse = {
    response_text: proseLines.join('\n\n'),
    citations: [],
    confidence_signal: confidenceSignal,
    sparsity_flag: bundle.evidenceReferences.length === 0,
    follow_up_actions: followUps,
    handoff_affordance: null,
    quality_issues: undefined,
    honest_disclosure: metadata,
  };

  return { rendered, bundle, metadata };
}

// =====================================================================
// Prose composition (deterministic, no model calls)
// =====================================================================

function composeProse(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  mode: ProgramNexusRailMode,
  metadata: HonestDisclosureMetadata,
): string[] {
  const view = summarizeProgram(program);
  const phaseLabel = view.currentCanonicalPhase.label;
  const lines: string[] = [];

  // Open with the disclosure message so the reader sees the framing
  // before any substantive claim.
  if (metadata.disclosureMessage) {
    lines.push(metadata.disclosureMessage);
  }

  switch (mode) {
    case 'opener':
      lines.push(
        `${program.code} · ${program.name} is in canonical ${phaseLabel} (P${view.currentCanonicalPhase.index}). ${program.roleInDemo}.`,
      );
      lines.push(
        'I can walk the charter, pressure-test the business case, surface contradictions, or talk through phase readiness. What would you like to do first?',
      );
      break;
    case 'walk-charter':
      lines.push(
        `${program.name} charter framing: scope, target state, and success metrics. The defensible move is to open the charter deliverable and walk it top-down — flag any line you cannot defend to the sponsor.`,
      );
      lines.push(
        `${HONEST_FALLBACK_LABELS.valueAtStake} I will not assert dollar amounts until evidence is seeded.`,
      );
      break;
    case 'pressure-test':
      lines.push(
        `Pressure-test order for ${program.name}: (1) name the counterfactual, (2) verify attribution methodology, (3) check confidence on headline numbers, (4) confirm the risk register names real financial or operational risks, not artifact-level meta-risks.`,
      );
      lines.push(
        `${HONEST_FALLBACK_LABELS.valueAtStake} ${HONEST_FALLBACK_LABELS.riskRegister}`,
      );
      break;
    case 'surface-contradictions':
      lines.push(
        `Contradictions surface as Tower pressure cards. For ${program.name}, contradictions filter to Active Programs in the Tower lens.`,
      );
      lines.push(
        'Zero surfaced contradictions does not mean zero exist — it can also mean the Tower has no recent telemetry for this program.',
      );
      break;
    case 'phase-readiness':
      lines.push(
        `${phaseLabel} (P${view.currentCanonicalPhase.index}) gate conditions for ${program.name} are listed on the phase page. The honest answer is "ready when every prerequisite deliverable is at Rich tier, every evidence citation resolves, every open decision has a named owner and target date."`,
      );
      lines.push(HONEST_FALLBACK_LABELS.gateState);
      break;
    case 'next-step':
      lines.push(
        `For ${program.name} at ${phaseLabel}, the highest-leverage next step is almost always to close one named open decision and replace one seeded assumption with sponsor-verified evidence. Pick the deliverable carrying the most dollars and work backward from its open-decisions list.`,
      );
      lines.push(HONEST_FALLBACK_LABELS.decisionsPending);
      break;
  }

  // Always close with a tenant-anchored line so the response is not
  // generic — distinguishes one tenant's context from another.
  lines.push(`Tenant context: ${tenant.displayName} · ${program.code}.`);

  return lines;
}

function followUpsFor(mode: ProgramNexusRailMode): RenderedResponse['follow_up_actions'] {
  if (mode === 'opener') {
    return [];
  }
  return [
    {
      id: 'open-deliverables',
      label: 'Open deliverables list',
      kind: 'open_drawer',
    },
    {
      id: 'review-canonical-phase',
      label: 'Review canonical phase timeline',
      kind: 'open_drawer',
    },
    {
      id: 'ask-something-else',
      label: 'Ask Nexus something else',
      kind: 'next_turn',
    },
  ];
}

function mapConfidenceSignal(
  tier: ContextBundleConfidenceTier | undefined,
): RenderedResponse['confidence_signal'] {
  if (tier === 'HIGH') return 'high';
  if (tier === 'MEDIUM') return 'medium';
  if (tier === 'LOW') return 'low';
  return 'none';
}

// =====================================================================
// Internal exports for test introspection
// =====================================================================

/**
 * Test-only convenience that returns the canonical category keys this
 * module knows how to populate. Mirrors S1's CONTEXT_BUNDLE_CATEGORY_KEYS
 * so a regression in either the bundle contract or this builder is
 * caught.
 */
export function listKnownCategoryKeys(): ReadonlyArray<(typeof CONTEXT_BUNDLE_CATEGORY_KEYS)[number]> {
  return CONTEXT_BUNDLE_CATEGORY_KEYS;
}

// Conversation refs are emitted empty for the first turn (placeholder
// for the future per-turn history wiring in S9c). Re-export the type so
// tests can assert shape without reaching into the bundle module.
export type { ContextBundleConversationReference, ContextBundleEvidenceReference };
