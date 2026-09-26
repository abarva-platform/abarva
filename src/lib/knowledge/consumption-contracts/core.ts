/**
 * Core consumption envelope + baseline metadata for Home / Knowledge vNext.
 *
 * SOURCE OF TRUTH: clients/shared/20-phase3c2d-consumption-contracts/
 *   - CONSUMPTION_PROJECTION_REGISTRY.json  (projection names, required metadata)
 *   - CONSUMPTION_OBJECT_AND_FIELD_CONTRACT.xlsx (baseline_metadata fields)
 *   - HOME_KNOWLEDGE_READ_MODEL_DDL.sql     (per-row metadata columns)
 *
 * Every response the UI consumes is a ConsumptionEnvelope<T>. Components never
 * see a raw row; they see an envelope that always carries governance metadata,
 * evidence refs, known-gap refs and warnings.
 */

import type {
  AuthorityState,
  AvailabilityState,
  FreshnessState,
} from "./states";

/** The single contract version this build targets. Bump only with a contract amendment. */
export const PROJECTION_CONTRACT_VERSION =
  "phase3c2d-consumption-contracts-v1.0.0" as const;

/**
 * Canonical projection (read-model) names, transcribed verbatim from
 * CONSUMPTION_PROJECTION_REGISTRY.json. Do not invent new names.
 */
export const PROJECTION_NAMES = [
  "consumption.enterprise_brief_v1",
  "consumption.enterprise_identity_v1",
  "consumption.executive_perspective_v1",
  "consumption.strategic_interpretation_v1",
  "consumption.domain_summary_v1",
  "consumption.application_inventory_v1",
  "consumption.technology_estate_v1",
  "consumption.data_product_inventory_v1",
  "consumption.vendor_contract_inventory_v1",
  "consumption.metric_observation_v1",
  "consumption.relationship_node_v1",
  "consumption.relationship_edge_v1",
  "consumption.relationship_evidence_v1",
  "consumption.evidence_gap_v1",
  "consumption.search_document_v1",
  "consumption.module_knowledge_packet_v1",
] as const;
export type ProjectionName = (typeof PROJECTION_NAMES)[number];

/**
 * Per-row baseline metadata required on every consumption view.
 * CONSUMPTION_OBJECT_AND_FIELD_CONTRACT "baseline_metadata" object family.
 */
export interface BaselineMetadata {
  /** Tenant identity from the registry — never path/filename-inferred. */
  tenant_key: string;
  /** Pins the row to exactly one active Knowledge Baseline. */
  knowledge_baseline_ref: string;
  /** Domain publication ref; required for domain/module-specific rows. */
  domain_publication_ref: string | null;
  /** Versioned compatibility contract. */
  projection_contract_version: string;
  /** Reader-visible freshness anchor (ISO date). */
  as_of_date: string;
  authority_state: AuthorityState;
  freshness_state: FreshnessState;
  availability_state: AvailabilityState;
  /** 0..1 — coverage, never truth by itself. */
  evidence_coverage: number;
  /** Supports parity/rollback checks. */
  content_hash: string;
}

/** Non-blocking condition surfaced to the reader (e.g. a stale-baseline banner). */
export interface ConsumptionWarning {
  code:
    | "newer_baseline_available"
    | "partial_domain"
    | "cube_unavailable"
    | "models_disabled"
    | "last_known_good"
    | "conflict_detected"
    | "evidence_withheld"
    | "not_measured"
    | "not_loaded";
  message: string;
  /** Optional pointer to the affected projection or field. */
  scope?: string;
}

/**
 * The universal response wrapper. Components must not know which provider
 * produced it. Field names follow the front-end brief's envelope; the
 * governance state enums follow the merged contract.
 */
export interface ConsumptionEnvelope<T> {
  tenantKey: string;
  knowledgeBaselineRef: string;
  /** Map of enterprise/technology/data/vendor/metric/relationship publication versions. */
  domainPublicationVersions: Record<string, string>;
  projectionName: ProjectionName;
  projectionContractVersion: string;
  /** ISO timestamp the projection was materialized / read as-of. */
  asOf: string;
  contentHash: string;

  authorityState: AuthorityState;
  availabilityState: AvailabilityState;
  freshnessState: FreshnessState;

  data: T;

  /** Displayable source refs — never hidden truth. */
  evidenceRefs: string[];
  /** Refs into evidence_gap_v1 explaining what is missing/withheld/conflicting. */
  knownGapRefs: string[];
  warnings: ConsumptionWarning[];
}

/**
 * A descriptor for a single evidence item, powering the evidence drawer.
 * Fields the drawer "should eventually support" (front-end brief). Anything
 * unavailable is null with a state, never omitted-as-zero.
 */
export interface EvidenceDescriptor {
  evidenceRef: string;
  sourceName: string | null;
  sourceType: string | null;
  /** ISO date or null. */
  sourceDate: string | null;
  /** Citation / location within the source. */
  citation: string | null;
  authorityState: AuthorityState;
  /** Human review state of the evidence itself. */
  reviewState: "unreviewed" | "in_review" | "reviewed" | "disputed" | null;
  /** 0..1 or null when not scored. */
  confidence: number | null;
  effectivePeriod: string | null;
  /** Ordered lineage steps: source -> evidence -> assertion -> publication. */
  lineage: string[];
  /** Refs to conflicting evidence, if any. */
  relatedConflicts: string[];
  /** Present when access is limited; content stays withheld, never leaked. */
  accessRestriction: "none" | "restricted" | "withheld" | null;
  availabilityState: AvailabilityState;
}

/** A quote/perspective tested against evidence — a leadership quote is never a fact. */
export interface PerspectiveEvidenceStance {
  supporting: string[];
  challenging: string[];
  uncertain: string[];
}

/** Convenience: an envelope carrying no useful data (not_loaded / withheld / etc.). */
export type EmptyEnvelope = ConsumptionEnvelope<null>;
