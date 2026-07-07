// =============================================================================
// Discovery Intake — contract (S1)
// -----------------------------------------------------------------------------
// The typed contract the enhanced Originate (P0) and Charter (P1) steps emit:
//   - DiscoveryShape  (P0 emit)  — frames the investigation
//   - DiscoveryPlan   (P1 emit)  — arms Diagnose with a scoped plan
//
// Pure + deterministic: types + transformer functions only. NO DB, NO routes,
// NO UI — those are later slices. Every captured fact carries its source(s),
// confidence, and review state, so provenance is first-class from intake on.
//
// Design: docs/build/moves-design/discovery-engine-design.md + the front-of-funnel
// chain (Originate emits discoveryShape → Charter emits discoveryPlan → Diagnose).
// =============================================================================

/** How a fact got in. */
export type IntakeSource = 'chat' | 'upload' | 'context';
/** Confidence in a captured value. */
export type Confidence = 'high' | 'medium' | 'low';
/** Whether a fact is blessed, needs review, or absent. */
export type ReviewState = 'confirmed' | 'review_pending' | 'empty';

/** A single captured field — value plus its provenance. */
export interface CapturedField<T> {
  value: T | null;
  /** distinct sources that contributed (chat / upload / context). */
  sources: IntakeSource[];
  confidence: Confidence;
  review: ReviewState;
  /** optional citation, e.g. "clarity_data_dictionary.xlsx". */
  provenance?: string;
}

export type FoundationIntent = 'first_of_kind' | 'rides_existing';
export type EngagementMode = 'full_strategy' | 'point_use_case';
export type CommitmentState = 'accepted' | 'declined' | 'pending';

/** An extracted landscape fact for a data domain. */
export interface LandscapeFact {
  domain: string;
  system: string;
  volumetrics?: string;
  tool?: string;
  source: IntakeSource;
  review: ReviewState;
}

/** A current→target maturity ambition for one dimension. */
export interface MaturityTarget {
  dimension: string;
  current: number | null;
  target: number | null;
  source: IntakeSource;
  review: ReviewState;
}

/** An interviewee in the discovery plan. */
export interface RosterEntry {
  role: string;
  guideReady: boolean;
  source: IntakeSource;
}

/** One cell of the domain × dimension assessment matrix. */
export interface AssessCell {
  domain: string;
  dimension: string;
  inScope: boolean;
}

// ---------------------------------------------------------------------------
// DiscoveryShape — emitted by Originate (P0)
// ---------------------------------------------------------------------------

export interface DiscoveryShape {
  problem: CapturedField<string>;
  foundationIntent: CapturedField<FoundationIntent>;
  archetype: CapturedField<string>;
  engagementMode: CapturedField<EngagementMode>;
  dataDomains: CapturedField<string[]>;
  landscape: CapturedField<LandscapeFact[]>;
  sponsor: CapturedField<string>;
  valueHypothesis: CapturedField<string>;
  /** known facts pre-filled from the context layer. */
  known: string[];
  /** open unknowns that seed the Diagnose template list. */
  openUnknowns: string[];
}

// ---------------------------------------------------------------------------
// DiscoveryPlan — emitted by Charter (P1), inherits the shape
// ---------------------------------------------------------------------------

export interface DiscoveryPlan {
  foundationCommitment: CapturedField<CommitmentState>;
  maturityTargets: MaturityTarget[];
  changeAmbition: CapturedField<string>;
  interviewRoster: RosterEntry[];
  domainsXDimensions: AssessCell[];
  successMetric: CapturedField<string>;
}

/** The frozen handoff Diagnose (P2) inherits. */
export interface DiscoveryHandoff {
  shape: DiscoveryShape;
  plan: DiscoveryPlan;
}

// ---------------------------------------------------------------------------
// Transformers (pure)
// ---------------------------------------------------------------------------

export const DEFAULT_MATURITY_DIMENSIONS: readonly string[] = [
  'Data Architecture',
  'Data Governance',
  'Data Management / Quality',
  'Platform / Infrastructure',
  'Analytics / AI',
  'Operating Model & Process',
  'People / Skills',
  'Adoption / Change Readiness',
];

/**
 * The narrower core for a point use case riding an EXISTING foundation — the
 * dimensions that use case actually needs assessed. The foundation-heavy
 * dimensions (governance, platform, operating model, people) are assumed
 * handled by the platform that already exists, so discovery stays scoped.
 */
export const POINT_USE_CASE_DIMENSIONS: readonly string[] = [
  'Data Architecture',
  'Data Management / Quality',
  'Analytics / AI',
  'Adoption / Change Readiness',
];

/**
 * What gets discovered flexes by use case. A full data & AI strategy, or a
 * first-of-kind that BUILDS the foundation, assesses the full dimension set
 * (broad). A point use case riding an existing foundation assesses the narrower
 * core. Driven by the shape's engagementMode + foundationIntent.
 */
export function dimensionsForShape(shape: DiscoveryShape): readonly string[] {
  const broad =
    shape.engagementMode.value === 'full_strategy' ||
    shape.foundationIntent.value === 'first_of_kind';
  return broad ? DEFAULT_MATURITY_DIMENSIONS : POINT_USE_CASE_DIMENSIONS;
}

function emptyField<T>(): CapturedField<T> {
  return { value: null, sources: [], confidence: 'low', review: 'empty' };
}

/** Review semantics by source: chat/context are user-grade → confirmed; an
 *  upload is document-derived → review_pending until a human blesses it. */
function reviewForSource(source: IntakeSource, confirmed: boolean): ReviewState {
  if (confirmed) return 'confirmed';
  return source === 'upload' ? 'review_pending' : 'confirmed';
}

/**
 * Capture (or merge) a value into a field, tracking its source. `confirmed`
 * forces a human-blessed state (e.g. the maestro accepted a reviewed upload).
 */
export function captureField<T>(
  prev: CapturedField<T> | undefined,
  value: T,
  source: IntakeSource,
  opts?: { confidence?: Confidence; provenance?: string; confirmed?: boolean },
): CapturedField<T> {
  const sources = Array.from(new Set([...(prev?.sources ?? []), source]));
  return {
    value,
    sources,
    confidence: opts?.confidence ?? prev?.confidence ?? 'medium',
    review: reviewForSource(source, opts?.confirmed ?? false),
    provenance: opts?.provenance ?? prev?.provenance,
  };
}

export function emptyDiscoveryShape(): DiscoveryShape {
  return {
    problem: emptyField<string>(),
    foundationIntent: emptyField<FoundationIntent>(),
    archetype: emptyField<string>(),
    engagementMode: emptyField<EngagementMode>(),
    dataDomains: emptyField<string[]>(),
    landscape: emptyField<LandscapeFact[]>(),
    sponsor: emptyField<string>(),
    valueHypothesis: emptyField<string>(),
    known: [],
    openUnknowns: [],
  };
}

export function emptyDiscoveryPlan(): DiscoveryPlan {
  return {
    foundationCommitment: emptyField<CommitmentState>(),
    maturityTargets: [],
    changeAmbition: emptyField<string>(),
    interviewRoster: [],
    domainsXDimensions: [],
    successMetric: emptyField<string>(),
  };
}

/** The fields that make up the captured "frame" of the shape (for completeness). */
const SHAPE_FIELDS: (keyof DiscoveryShape)[] = [
  'problem',
  'foundationIntent',
  'archetype',
  'engagementMode',
  'dataDomains',
  'landscape',
  'sponsor',
  'valueHypothesis',
];

export interface Completeness {
  captured: number;
  total: number;
  pendingReview: number;
}

export function shapeCompleteness(shape: DiscoveryShape): Completeness {
  let captured = 0;
  let pending = 0;
  for (const k of SHAPE_FIELDS) {
    const f = shape[k] as CapturedField<unknown>;
    if (f.review !== 'empty' && f.value != null) captured += 1;
    if (f.review === 'review_pending') pending += 1;
  }
  return { captured, total: SHAPE_FIELDS.length, pendingReview: pending };
}

/** P0 → P1 hard gate: seed recorded (problem), value hypothesis, sponsor. */
export function shapeGateReady(shape: DiscoveryShape): boolean {
  const has = (f: CapturedField<unknown>) => f.review !== 'empty' && f.value != null;
  return has(shape.problem) && has(shape.valueHypothesis) && has(shape.sponsor);
}

/**
 * Seed a DiscoveryPlan from an emitted shape: the domains in scope become the
 * rows of the assessment matrix across the dimension set. Breadth flexes by use
 * case (`dimensionsForShape`) unless an explicit set is passed. The maestro then
 * refines targets, roster, and change ambition during Charter.
 */
export function planFromShape(
  shape: DiscoveryShape,
  dimensions: readonly string[] = dimensionsForShape(shape),
): DiscoveryPlan {
  const plan = emptyDiscoveryPlan();
  const domains = shape.dataDomains.value ?? [];
  plan.domainsXDimensions = domains.flatMap((domain) =>
    dimensions.map((dimension) => ({ domain, dimension, inScope: true })),
  );
  plan.maturityTargets = dimensions.map((dimension) => ({
    dimension,
    current: null,
    target: null,
    source: 'chat' as IntakeSource,
    review: 'empty' as ReviewState,
  }));
  return plan;
}

/** P1 → P2 hard gate: foundation decided (not pending), success metric named. */
export function planGateReady(plan: DiscoveryPlan): boolean {
  const fc = plan.foundationCommitment;
  const foundationDecided = fc.review !== 'empty' && fc.value != null && fc.value !== 'pending';
  const hasMetric = plan.successMetric.review !== 'empty' && plan.successMetric.value != null;
  return foundationDecided && hasMetric;
}

/** Freeze the handoff Diagnose inherits. Throws if either gate is not ready —
 *  the chain must not hand a half-formed plan forward. */
export function emitDiscoveryHandoff(shape: DiscoveryShape, plan: DiscoveryPlan): DiscoveryHandoff {
  if (!shapeGateReady(shape)) {
    throw new Error('discovery: shape gate not ready (problem, value hypothesis, sponsor required)');
  }
  if (!planGateReady(plan)) {
    throw new Error('discovery: plan gate not ready (foundation decision + success metric required)');
  }
  return { shape, plan };
}
