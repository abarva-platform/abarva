// Moves Expert Kernel — public surface.
//
// Deterministic, pure expert modules the Moves agent orchestrates to turn a
// structured Move into a costed, CFO-readable business case. See
// `docs/strategy/APEX-REALNESS-AUDIT-CONTACT-CENTER.md` for the first proven
// case.

export * from "./types";
export * from "./baseline-model";
export * from "./assumption-ledger";
export * from "./effort-estimator";
export * from "./value-forecast";
export * from "./critic";
export * from "./business-case-compiler";
export * from "./qa-rubric";
export * from "./roadmap";
export * from "./raci";
// Shared phase-playbook types (`PhaseTrap`, `KillTrigger`) — exported once,
// from one place, so Design & Plan and Mobilize do not each re-export them.
export * from "./phase-playbooks/shared-types";
export * from "./phase-playbooks/design-plan";
// Mobilize & Handoff phase — playbook, adoption approach, Tower measurement
// handoff, go-decision pack.
export * from "./phase-playbooks/mobilize";
export * from "./adoption-approach";
export * from "./measurement-handoff";
export * from "./go-decision-pack";
export * from "./expert-review-calibration";
export * from "./expert-review-console";
export * from "./use-case-archetype-playbooks";
export * from "./advisory-session";
export * from "./outcome-calibration";
export * from "./scenario-updates";
export * from "./watched-session-mode";
export * from "./scenario-regeneration-preview";
export * from "./scenario-regeneration-signoff";
export * from "./scenario-quality-lab";
export * from "./artifact-standards";
export * from "./artifact-quality-rubric";
export * from "./artifact-visual-exhibits";
export * from "./solution-architecture-pack";
export * from "./master-move-dossier";
export * from "./apex-contact-center-case";
export * from "./meridian-ambient-clinical-case";
export * from "./firstcapital-fraud-detection-case";
export * from "./expert-review-cases";
// The living Move — the tenant-agnostic parametrised costed business case and
// its three-anchor case registry.
export * from "./living-move";
export * from "./living-move-cases";
export * from "./phase-playbooks/discover";
export * from "./phase-playbooks/apex-discover-case";
export * from "./rate-card/comprehensive-rate-card";
export * from "./rate-card/demo-rate-card-packs";
export {
  ANNUAL_BILLABLE_HOURS_V2,
  FUNCTION_GROUPS,
  ROLE_LEVELS,
  SOURCING_LOCATIONS,
  VENDOR_GOVERNANCE_OVERHEAD_DEFAULT,
  VENDOR_TIERS,
  buildRoleConstantSourcingComparison,
  computeInternalPlanningRate,
  computeVendorPlanningRate,
  validateGeoModifierRows,
  validateInternalRateRows,
  validateVendorRateRows,
  type BuildRoleConstantComparisonInput,
  type FunctionGroup,
  type GeoModifierRow,
  type InternalComputedRate,
  type InternalRateCardRow,
  type RateCardProvenance as IngestedRateCardProvenance,
  type RateCardRowKind,
  type RateCardValidationMessage,
  type RateCardValidationResult,
  type RoleLevel,
  type SourcingComparisonOption,
  type SourcingLocation,
  type VendorComputedRate,
  type VendorRateCardRow,
  type VendorTier,
} from "./rate-card/rate-card-ingestion";
export * from "./rate-card/rate-card-row-parser";
export * from "./rate-card/rate-card-templates";
export * from "./modernization";
// Domain Function Packs — the curated, function-indexed industry-depth layer
// bound into context before the agent reaches for general intelligence.
export * from "./domain";
