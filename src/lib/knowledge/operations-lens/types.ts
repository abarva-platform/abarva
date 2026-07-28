/**
 * View-model types for the Operations & Vendor Intelligence lens.
 *
 * These are PRESENTATION composites derived from the governed consumption
 * projections (application inventory, vendor/contract inventory, relationships,
 * evidence gaps, enterprise brief). They are NOT a new projection and NOT a new
 * source of truth — every field traces to an envelope the provider returned. The
 * lens re-organizes governed knowledge by operational capability and vendor; it
 * never computes a governed business measure (spend/incident/SLA totals come from
 * governed metrics when present, otherwise an explicit unavailable state).
 */

import type {
  AvailabilityState,
  DomainReadinessV1,
  EntityFieldValue,
  EntitySummaryV1,
  EvidenceGapV1,
  RelationshipEdgeV1,
  RelationshipNodeV1,
  RelationshipProjectionV1,
} from "../consumption-contracts";
import type { OperationsCapabilityKey } from "./taxonomy";
/**
 * A count of governed objects *represented in the active baseline*. This is a
 * count of what is loaded/represented, deliberately distinct from a governed
 * measure. When the underlying domain is not loaded/withheld the value is null
 * with a reason — never coerced to 0.
 */
export interface RepresentedCount {
  label: string;
  value: number | null;
  availabilityState: AvailabilityState;
  /** Present when value is null — e.g. "programs domain not loaded". */
  absenceReason?: string | null;
  /** Displayable evidence refs backing the represented set, when any. */
  evidenceRefs: string[];
}

/** A single link in a capability→…→program dependency chain. */
export interface DependencyLink {
  edgeId: string;
  fromRef: string;
  fromLabel: string;
  fromType: string;
  toRef: string;
  toLabel: string;
  toType: string;
  relationshipType: string;
  authorityState: RelationshipEdgeV1["authorityState"];
  availabilityState: AvailabilityState;
  scope: "current" | "target";
  evidenceRefs: string[];
}

/** A node in the dependency view, with its resolved evidence refs. */
export interface DependencyNodeView {
  ref: string;
  label: string;
  type: string;
  availabilityState: AvailabilityState;
  hop: 0 | 1 | 2;
  evidenceRefs: string[];
}

export interface DependencyChainView {
  focalRef: string;
  focalLabel: string;
  nodes: DependencyNodeView[];
  links: DependencyLink[];
  /** True when caps were hit — UI says so rather than implying completeness. */
  truncated: boolean;
  omittedNodeCount: number;
}

/** A vendor as seen through the operations lens. */
export interface VendorIntelView {
  vendorRef: string;
  displayName: string;
  availabilityState: AvailabilityState;
  /** Applications this vendor supports (from governed relationships/inventory). */
  supportedApplications: EntitySummaryV1[];
  /** Capabilities touched by the vendor's supported applications. */
  capabilitiesTouched: OperationsCapabilityKey[];
  /** Contract objects / contract-bearing fields for this vendor. */
  contractCount: RepresentedCount;
  /** Renewals within the baseline's 12-month window (or explicit unavailable). */
  renewalsApproaching: RepresentedCount;
  /**
   * Incident / SLA summary as governed entity fields when the baseline supplies
   * them. Null-valued fields render as their state (e.g. "not measured"), never 0.
   */
  incidentSummary: EntityFieldValue[];
  /** Programs whose scope touches this vendor's applications. */
  transformationExposure: RepresentedCount;
  /**
   * Concentration INDICATORS only (counts). No judgment label is produced here;
   * a "risk" is surfaced only when a governed risk/gap is linked (see linkedRisks).
   */
  concentration: {
    applicationsSupported: number;
    tierOneApplications: number;
    capabilitiesTouched: number;
  };
  /**
   * Governed risk objects reachable from this vendor's supported applications in
   * the relationship graph (evidence-backed edges) — the ONLY risk voice. No
   * "concentration risk" judgment is synthesized here.
   */
  linkedRisks: EntitySummaryV1[];
  /** Evidence gaps in the vendors domain relevant to vendor coverage. */
  evidenceGaps: EvidenceGapV1[];
  evidenceRefs: string[];
}

/** A capability tile: connected systems/vendors/risks/programs, or explicit empty. */
export interface CapabilityView {
  key: OperationsCapabilityKey;
  label: string;
  description: string;
  /** Whether the baseline represents this capability at all. */
  represented: boolean;
  applications: EntitySummaryV1[];
  vendorRefs: string[];
  /** Risk objects reachable from this capability's applications (graph-backed). */
  linkedRisks: EntitySummaryV1[];
  /** Coverage/availability rollup for the capability's represented objects. */
  availabilityState: AvailabilityState;
  /** Reason shown when represented === false. */
  absenceReason?: string | null;
}

/** The executive overview payload for the lens. */
export interface OperationsOverview {
  criticalCapabilities: RepresentedCount;
  applications: RepresentedCount;
  materialVendors: RepresentedCount;
  contracts: RepresentedCount;
  renewalsApproaching: RepresentedCount;
  operationalRisks: RepresentedCount;
  /** Governed coverage rollup (0..1), from the brief/gaps projections. */
  evidenceCoverage: number | null;
  deferredAssertions: RepresentedCount;
  conflictingAssertions: RepresentedCount;
}

/**
 * Normalized input to the pure compose functions. Every field is data the
 * governed provider already returned (envelope `.data`), plus the baseline as-of
 * date used as the deterministic reference for renewal windows. The compose layer
 * reads ONLY this — it never calls a provider or a clock, so it is fully testable.
 */
export interface LensSource {
  /** Baseline as-of ISO timestamp — the reference date for "renewals approaching". */
  asOf: string;
  applications: EntitySummaryV1[];
  vendors: EntitySummaryV1[];
  /** Contract objects (entityType `contract`), each ideally carrying a `vendor` field. */
  contracts: EntitySummaryV1[];
  risks: EntitySummaryV1[];
  programs: EntitySummaryV1[];
  relationships: RelationshipProjectionV1;
  gaps: EvidenceGapV1[];
  /** Governed coverage rollup (0..1) from the brief/gaps projections, or null. */
  overallEvidenceCoverage: number | null;
  /** Domain readiness rows, used for per-domain availability + not_loaded states. */
  domains: DomainReadinessV1[];
}

/** Re-exported for convenience in the hook/UI layer. */
export type { RelationshipNodeV1 };

