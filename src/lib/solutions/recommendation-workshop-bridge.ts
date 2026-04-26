// SOL10 · Recommendation → Program Workshop Bridge.
//
// Pure deterministic library that maps SOL9 solution recommendations
// (or any caller-shaped input that supplies the same minimum surface)
// onto recommended workshops, SME role bundles, evidence-need hints,
// and deliverable hints that the Program Workshop Mode shell can later
// surface without inventing context.
//
// SOL9 returns archetype-anchored recommendations carrying
// recommendedComponents, recommendedWorkshops, smesRequired,
// architectureBuildingBlocks, and deliverablesGenerated. SOL10 takes
// that surface and projects it into a workshop-bridge map: per
// recommendation we produce one or more workshop bundles (with role
// hints and a recommended first workshop), one or more SME role
// bundles, evidence needs derived from architecture building blocks
// and current-state inputs, and deliverable hints derived from the
// archetype's canonical deliverables list.
//
// This module is a *library*. It does NOT compose tenant-specific live
// architectures, it does NOT invoke models, and it does NOT read
// tenant runtime state. All projection is integer / canonical-order
// arithmetic. Tie-breaks fall back to canonical recommendation order
// for byte-equal determinism across calls.
//
// No live runtime, no live model invocation, no clock reads,
// no random IDs, no Supabase reads, no migrations.
//
// This module does NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public input shape
// ---------------------------------------------------------------------
//
// SOL10 keeps its input contract structural so the bridge runs even
// when SOL9 is unavailable. Callers may pass any object shaped like
// the canonical SolutionRecommendation surface; only the listed fields
// are read.

export interface RecommendationInputForBridge {
  archetypeKey: string;
  archetypeName: string;
  confidence: 'low' | 'medium' | 'high';
  recommendedComponents: readonly string[];
  recommendedWorkshops: readonly string[];
  smesRequired: readonly string[];
  architectureBuildingBlocks: readonly string[];
  deliverablesGenerated: readonly string[];
  missingInputs?: readonly { kind: string; impact: string; reason: string }[];
}

// ---------------------------------------------------------------------
// Public output types
// ---------------------------------------------------------------------

export interface RecommendedWorkshopBundle {
  workshopKey: string;
  isFirstWorkshop: boolean;
  rationale: string;
  expectedRoles: readonly string[];
}

export interface RecommendedSmeRoleBundle {
  roleKey: string;
  roleLabel: string;
  workshopKey: string;
  rationale: string;
}

export interface EvidenceNeedHint {
  kind:
    | 'current_state_input'
    | 'architecture_building_block'
    | 'governance_review';
  description: string;
  severity: 'must_capture' | 'should_capture' | 'nice_to_have';
  workshopKey: string;
}

export interface DeliverableHint {
  deliverableKey: string;
  workshopKey: string;
  rationale: string;
}

export interface RecommendationWorkshopMap {
  archetypeKey: string;
  archetypeName: string;
  recommendedFirstWorkshopKey: string;
  workshops: readonly RecommendedWorkshopBundle[];
  smes: readonly RecommendedSmeRoleBundle[];
  evidenceNeeds: readonly EvidenceNeedHint[];
  deliverables: readonly DeliverableHint[];
  createdFrom: 'deterministic_recommendation_workshop_bridge_seed';
}

export interface WorkshopBridgeSummary {
  totalMaps: number;
  totalWorkshops: number;
  totalSmes: number;
  totalEvidenceNeeds: number;
  totalDeliverables: number;
  archetypeKeys: readonly string[];
  firstWorkshopKeys: readonly string[];
}

// ---------------------------------------------------------------------
// Internal canonical lookups
// ---------------------------------------------------------------------

const ROLE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  business_sponsor: 'Business sponsor',
  product_owner: 'Product owner',
  data_owner: 'Data owner',
  data_engineer: 'Data engineer',
  ml_engineer: 'ML engineer',
  ai_architect: 'AI architect',
  enterprise_architect: 'Enterprise architect',
  governance_lead: 'Governance lead',
  privacy_officer: 'Privacy officer',
  security_lead: 'Security lead',
  compliance_officer: 'Compliance officer',
  clinical_informaticist: 'Clinical informaticist',
  physician_champion: 'Physician champion',
  nurse_champion: 'Nurse champion',
  utilization_management_lead: 'Utilization management lead',
  payer_operations_lead: 'Payer operations lead',
  contact_center_operations_lead: 'Contact center operations lead',
  customer_experience_lead: 'Customer experience lead',
  finance_lead: 'Finance lead',
  fpna_lead: 'FP&A lead',
  engineering_lead: 'Engineering lead',
  developer_experience_lead: 'Developer experience lead',
  platform_lead: 'Platform lead',
  steward_agent: 'Steward agent (governance gate)',
  kyc_operations_lead: 'KYC operations lead',
  aml_compliance_lead: 'AML compliance lead',
  service_operations_lead: 'Service operations lead',
  reliability_engineering_lead: 'Reliability engineering lead',
  field_operations_lead: 'Field operations lead',
  sme_subject_matter_expert: 'Subject matter expert',
});

// Default role hints per workshop key. These are *roles*, not people;
// no live SME directory or calendar is consulted.
const WORKSHOP_DEFAULT_ROLES: Readonly<Record<string, readonly string[]>> =
  Object.freeze({
    current_state_discovery: Object.freeze([
      'business_sponsor',
      'product_owner',
      'enterprise_architect',
    ]),
    data_foundation_assessment: Object.freeze([
      'data_owner',
      'data_engineer',
      'enterprise_architect',
    ]),
    governance_risk_review: Object.freeze([
      'governance_lead',
      'privacy_officer',
      'compliance_officer',
      'steward_agent',
    ]),
    architecture_solution_design: Object.freeze([
      'ai_architect',
      'enterprise_architect',
      'platform_lead',
    ]),
    operating_model_alignment: Object.freeze([
      'business_sponsor',
      'governance_lead',
      'product_owner',
    ]),
    failure_mode_signal_review: Object.freeze([
      'product_owner',
      'governance_lead',
      'sme_subject_matter_expert',
    ]),
    deliverable_synthesis: Object.freeze([
      'product_owner',
      'ai_architect',
      'sme_subject_matter_expert',
    ]),
  });

// Short, deterministic rationales per workshop key. Surfaced verbatim
// in the workshop bundle so callers see honest reasoning.
const WORKSHOP_RATIONALES: Readonly<Record<string, string>> = Object.freeze({
  current_state_discovery:
    'Capture industry context, current-state signals, and existing platforms before scoring solution options.',
  data_foundation_assessment:
    'Assess dataset domains, data quality, lineage, and semantic layer readiness for the candidate archetype.',
  governance_risk_review:
    'Review governance, regulatory, and risk considerations the archetype surfaces before composing architecture.',
  architecture_solution_design:
    'Compose the target-state architecture from canonical building blocks; align with build/buy/partner posture.',
  operating_model_alignment:
    'Align operating model, role accountabilities, and rollout cadence to the recommended archetype.',
  failure_mode_signal_review:
    'Walk detected failure modes and patterns against the archetype contract; capture mitigations.',
  deliverable_synthesis:
    'Synthesize archetype deliverables into program-ready artifacts for review and handoff.',
});

const FALLBACK_FIRST_WORKSHOP = 'current_state_discovery';

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Project a recommendation list into a deterministic workshop-bridge
 * map list. Pure and byte-equal across calls for the same input.
 *
 * Each input recommendation produces exactly one
 * RecommendationWorkshopMap. Within a map:
 *   - workshops covers archetype.recommendedWorkshops in canonical
 *     order; the first canonical workshop is marked as the
 *     recommendedFirstWorkshop and gets isFirstWorkshop = true.
 *   - smes covers archetype.smesRequired joined with the workshop's
 *     default role hints, in canonical order, deduplicated by
 *     (roleKey, workshopKey).
 *   - evidenceNeeds projects architecture building blocks and current-
 *     state inputs into capture hints; severity is must_capture for
 *     the first canonical workshop, should_capture for subsequent
 *     workshops, and nice_to_have for governance fallbacks.
 *   - deliverables maps archetype.deliverablesGenerated onto the
 *     deliverable_synthesis workshop (or the last canonical workshop
 *     if deliverable_synthesis is not in the recommended list).
 */
export function buildRecommendationWorkshopMap(
  recommendations: readonly RecommendationInputForBridge[],
): readonly RecommendationWorkshopMap[] {
  const out: RecommendationWorkshopMap[] = [];
  for (let i = 0; i < recommendations.length; i++) {
    const rec = recommendations[i];
    out.push(buildSingleMap(rec));
  }
  return Object.freeze(out);
}

/**
 * Reduce a workshop-bridge map list into an at-a-glance summary. Pure.
 */
export function summarizeWorkshopBridge(
  maps: readonly RecommendationWorkshopMap[],
): WorkshopBridgeSummary {
  let workshops = 0;
  let smes = 0;
  let evidenceNeeds = 0;
  let deliverables = 0;
  const archetypeKeys: string[] = [];
  const firstWorkshopKeys: string[] = [];
  for (const m of maps) {
    workshops += m.workshops.length;
    smes += m.smes.length;
    evidenceNeeds += m.evidenceNeeds.length;
    deliverables += m.deliverables.length;
    archetypeKeys.push(m.archetypeKey);
    firstWorkshopKeys.push(m.recommendedFirstWorkshopKey);
  }
  return {
    totalMaps: maps.length,
    totalWorkshops: workshops,
    totalSmes: smes,
    totalEvidenceNeeds: evidenceNeeds,
    totalDeliverables: deliverables,
    archetypeKeys: Object.freeze(archetypeKeys),
    firstWorkshopKeys: Object.freeze(firstWorkshopKeys),
  };
}

/**
 * Collect every must_capture / should_capture evidence need across the
 * supplied maps. Returns the entries in canonical (map, evidence)
 * order so callers can render an aggregate "what to capture next" list
 * without re-walking the maps. Pure.
 */
export function getMissingEvidenceForBridge(
  maps: readonly RecommendationWorkshopMap[],
): readonly EvidenceNeedHint[] {
  const out: EvidenceNeedHint[] = [];
  for (const m of maps) {
    for (const ev of m.evidenceNeeds) {
      if (ev.severity === 'must_capture' || ev.severity === 'should_capture') {
        out.push(ev);
      }
    }
  }
  return Object.freeze(out);
}

// ---------------------------------------------------------------------
// Internal: per-recommendation projection
// ---------------------------------------------------------------------

function buildSingleMap(
  rec: RecommendationInputForBridge,
): RecommendationWorkshopMap {
  const canonicalWorkshops = canonicalWorkshopList(rec.recommendedWorkshops);
  const firstWorkshopKey =
    canonicalWorkshops.length > 0
      ? canonicalWorkshops[0]
      : FALLBACK_FIRST_WORKSHOP;

  const workshops = buildWorkshopBundles(canonicalWorkshops, firstWorkshopKey);
  const smes = buildSmeBundles(rec, canonicalWorkshops);
  const evidenceNeeds = buildEvidenceNeeds(rec, canonicalWorkshops);
  const deliverables = buildDeliverables(rec, canonicalWorkshops);

  return {
    archetypeKey: rec.archetypeKey,
    archetypeName: rec.archetypeName,
    recommendedFirstWorkshopKey: firstWorkshopKey,
    workshops,
    smes,
    evidenceNeeds,
    deliverables,
    createdFrom: 'deterministic_recommendation_workshop_bridge_seed',
  };
}

function canonicalWorkshopList(
  recommended: readonly string[],
): readonly string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of recommended) {
    const key = (w ?? '').trim();
    if (key.length === 0) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  if (out.length === 0) {
    out.push(FALLBACK_FIRST_WORKSHOP);
  }
  return Object.freeze(out);
}

function buildWorkshopBundles(
  canonicalWorkshops: readonly string[],
  firstWorkshopKey: string,
): readonly RecommendedWorkshopBundle[] {
  const bundles: RecommendedWorkshopBundle[] = [];
  for (let i = 0; i < canonicalWorkshops.length; i++) {
    const key = canonicalWorkshops[i];
    const rationale =
      WORKSHOP_RATIONALES[key] ??
      `Canonical workshop "${key}" recommended by archetype contract.`;
    const expectedRoles =
      WORKSHOP_DEFAULT_ROLES[key] ??
      Object.freeze(['sme_subject_matter_expert']);
    bundles.push({
      workshopKey: key,
      isFirstWorkshop: key === firstWorkshopKey,
      rationale,
      expectedRoles,
    });
  }
  return Object.freeze(bundles);
}

function buildSmeBundles(
  rec: RecommendationInputForBridge,
  canonicalWorkshops: readonly string[],
): readonly RecommendedSmeRoleBundle[] {
  const seen = new Set<string>();
  const bundles: RecommendedSmeRoleBundle[] = [];

  // Phase 1: archetype.smesRequired anchored to the first workshop.
  const firstWorkshop = canonicalWorkshops[0] ?? FALLBACK_FIRST_WORKSHOP;
  for (const r of rec.smesRequired) {
    const roleKey = (r ?? '').trim();
    if (roleKey.length === 0) continue;
    const dedupeKey = `${roleKey}::${firstWorkshop}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    bundles.push({
      roleKey,
      roleLabel: ROLE_LABELS[roleKey] ?? humanizeRoleKey(roleKey),
      workshopKey: firstWorkshop,
      rationale: `Archetype "${rec.archetypeName}" names this role as required for the recommended workshop set.`,
    });
  }

  // Phase 2: per-workshop default role hints.
  for (const ws of canonicalWorkshops) {
    const defaultRoles =
      WORKSHOP_DEFAULT_ROLES[ws] ??
      Object.freeze(['sme_subject_matter_expert']);
    for (const r of defaultRoles) {
      const dedupeKey = `${r}::${ws}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      bundles.push({
        roleKey: r,
        roleLabel: ROLE_LABELS[r] ?? humanizeRoleKey(r),
        workshopKey: ws,
        rationale: `Default role hint for workshop "${ws}".`,
      });
    }
  }

  return Object.freeze(bundles);
}

function buildEvidenceNeeds(
  rec: RecommendationInputForBridge,
  canonicalWorkshops: readonly string[],
): readonly EvidenceNeedHint[] {
  const out: EvidenceNeedHint[] = [];
  const firstWorkshop = canonicalWorkshops[0] ?? FALLBACK_FIRST_WORKSHOP;
  const lastWorkshop =
    canonicalWorkshops[canonicalWorkshops.length - 1] ?? firstWorkshop;

  // Architecture building blocks → must_capture or should_capture
  // depending on whether they sit on the first canonical workshop.
  for (let i = 0; i < rec.architectureBuildingBlocks.length; i++) {
    const bb = (rec.architectureBuildingBlocks[i] ?? '').trim();
    if (bb.length === 0) continue;
    const severity: EvidenceNeedHint['severity'] =
      i === 0 ? 'must_capture' : 'should_capture';
    out.push({
      kind: 'architecture_building_block',
      description: `Confirm presence and ownership of "${bb}" before composing the target architecture.`,
      severity,
      workshopKey: chooseEvidenceWorkshop(canonicalWorkshops, 'architecture'),
    });
  }

  // Recommended components → should_capture against the architecture
  // workshop (or the last workshop if no architecture workshop is
  // recommended). Treated as current-state inputs because the caller
  // needs to record which components are already in place.
  for (const cmp of rec.recommendedComponents) {
    const key = (cmp ?? '').trim();
    if (key.length === 0) continue;
    out.push({
      kind: 'current_state_input',
      description: `Verify if component "${key}" already exists in current state and capture its operational owner.`,
      severity: 'should_capture',
      workshopKey: firstWorkshop,
    });
  }

  // Governance fallback → nice_to_have on the governance workshop if
  // present, otherwise on the last canonical workshop. Always emitted
  // so every map has at least one evidence_needs entry even when the
  // archetype contract is sparse.
  const governanceWorkshop =
    canonicalWorkshops.find((w) => w === 'governance_risk_review') ??
    lastWorkshop;
  out.push({
    kind: 'governance_review',
    description: `Confirm governance, regulatory, and risk posture for archetype "${rec.archetypeName}" before approving handoff to delivery.`,
    severity: 'nice_to_have',
    workshopKey: governanceWorkshop,
  });

  return Object.freeze(out);
}

function buildDeliverables(
  rec: RecommendationInputForBridge,
  canonicalWorkshops: readonly string[],
): readonly DeliverableHint[] {
  const synthesisWorkshop =
    canonicalWorkshops.find((w) => w === 'deliverable_synthesis') ??
    canonicalWorkshops[canonicalWorkshops.length - 1] ??
    FALLBACK_FIRST_WORKSHOP;

  const out: DeliverableHint[] = [];
  const seen = new Set<string>();

  for (const d of rec.deliverablesGenerated) {
    const key = (d ?? '').trim();
    if (key.length === 0) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      deliverableKey: key,
      workshopKey: synthesisWorkshop,
      rationale: `Archetype "${rec.archetypeName}" produces this deliverable; synthesize it during the workshop set.`,
    });
  }

  // Always emit at least one deliverable hint so every map has a
  // canonical handoff target, even when the archetype contract does
  // not list any deliverables.
  if (out.length === 0) {
    out.push({
      deliverableKey: 'archetype_solution_brief',
      workshopKey: synthesisWorkshop,
      rationale: `Default solution brief deliverable for archetype "${rec.archetypeName}" pending explicit deliverable contract.`,
    });
  }

  return Object.freeze(out);
}

function chooseEvidenceWorkshop(
  canonicalWorkshops: readonly string[],
  kind: 'architecture' | 'data',
): string {
  if (kind === 'architecture') {
    const arch = canonicalWorkshops.find(
      (w) => w === 'architecture_solution_design',
    );
    if (arch !== undefined) return arch;
  }
  if (kind === 'data') {
    const data = canonicalWorkshops.find(
      (w) => w === 'data_foundation_assessment',
    );
    if (data !== undefined) return data;
  }
  return canonicalWorkshops[0] ?? FALLBACK_FIRST_WORKSHOP;
}

function humanizeRoleKey(key: string): string {
  if (key.length === 0) return key;
  const parts = key.split('_');
  const out: string[] = [];
  for (const p of parts) {
    if (p.length === 0) continue;
    out.push(p.charAt(0).toUpperCase() + p.slice(1));
  }
  return out.join(' ');
}
