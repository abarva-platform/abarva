// =============================================================================
// Governed Data Foundation — evidence families + per-phase requirements.
// -----------------------------------------------------------------------------
// This archetype exists because the strategic-move registry had no entry for a
// data-governance / platform-readiness Move, and `resolveProgramArchetype`
// answers with `DEFAULT_ARCHETYPE_ID` (AI-PDLC) when nothing matches. A Move
// that DECLARES the `governed_data_foundation` discovery archetype was therefore
// graded, at P2, against AI-PDLC's hard instruments:
//
//   eng_performance_dora   -> tower_dora_metrics.client_id
//   it_systems_landscape   -> tower_cmdb_cis.client_id
//   it_org_structure       -> tower_workforce.client_id
//
// All three are TENANT-scoped `tower_*` tables. The evidence a governed-data-
// foundation Move actually collects is MOVE-scoped documentary evidence keyed by
// the discovery blueprint's family ids, so those three instruments can never be
// satisfied by this Move's own evidence, and the eleven families it does collect
// are graded by nothing. `currentStateReadiness.hardGaps` is what the capture
// screen's Approve & Build blocker counts at P2, so the phase is gated on
// evidence that belongs to a different kind of work.
//
// The sibling `COMMERCIAL_LENDING_AGENT_ASSIST` archetype already names this
// hazard in its own `agentGuidance.systemFraming` ("Do not require DORA, CI/CD,
// or engineering SDLC evidence for P2 strategy discovery") and solved it the
// same way: by declaring an archetype rather than by special-casing the default.
//
// The family KEYS below are the discovery blueprint's family `id`s verbatim
// (`getDiscoveryBlueprint("governed_data_foundation").evidenceFamilies[].id`).
// That is load-bearing, not cosmetic: a family with no `backing` is resolved by
// `resolveDocFamilyReviews(ctx, moveId, family.key)`, so the key is what joins
// an approved upload to the instrument it satisfies. A rename on either side
// silently reopens every gap; `governed-data-foundation-archetype.test.ts`
// pins the two sets against each other in both directions.
//
// Severity mirrors the blueprint's own `required` flag — the eleven required
// families are `hard` at `diagnose`, and the optional change/adoption owner is
// `soft`. Nothing here is `estateScoped`, so the estate axis never prunes a
// family (see `resolveArchetypeRequirements`); this archetype's evidence is
// declared by the Move, not inferred from the client's estate.
// =============================================================================

import type {
  EvidenceFamilySpec,
  PhaseRequirements,
} from "@/lib/programs/archetypes/types";

/**
 * The twelve families, keyed EXACTLY as the discovery blueprint keys them.
 *
 * Every one is documentary (no `backing`): a governed data foundation is
 * evidenced by the client's own governance, architecture and control records,
 * reviewed and approved against this Move — not by rows that happen to exist in
 * a tenant-wide `tower_*` table.
 */
export const GOVERNED_DATA_FOUNDATION_FAMILIES: EvidenceFamilySpec[] = [
  {
    key: "data_governance_ownership",
    label:
      "Data governance ownership (council, policies, decision rights, stewardship)",
    kind: "org",
    whyNeeded:
      "Names who decides, who stewards, and under which policy — without it no certification of the foundation can be attributed to an accountable owner.",
    sourceDocHint: "Data governance / CDO office charter, policy set, or RACI",
    acceptedFormats: ["docx", "pdf", "pptx", "xlsx"],
    feedsMethods: ["maturity_scoring", "two_gap"],
  },
  {
    key: "semantic_layer_certification",
    label: "Semantic layer / certified metric & entity definitions and ownership",
    kind: "qualitative",
    whyNeeded:
      "A certified metric and entity layer is what makes a number mean the same thing twice; it is the unit the target architecture and value model both build on.",
    sourceDocHint:
      "Metric dictionary, semantic model export, or certified-definition register",
    acceptedFormats: ["xlsx", "csv", "docx", "pdf"],
    feedsMethods: ["maturity_scoring", "two_gap", "leverage_ranking"],
  },
  {
    key: "data_lineage_audit_trail",
    label: "Data lineage + AI/model audit trail (source-to-use traceability)",
    kind: "qualitative",
    whyNeeded:
      "Source-to-use traceability is the control that lets a downstream AI answer be audited back to the record it came from.",
    sourceDocHint:
      "Lineage export, catalog impact analysis, or model audit-trail specification",
    acceptedFormats: ["xlsx", "csv", "docx", "pdf"],
    feedsMethods: ["maturity_scoring", "two_gap"],
  },
  {
    key: "data_quality_rules",
    label: "Data quality rules (defined, loaded, monitored) + exception owners",
    kind: "qualitative",
    whyNeeded:
      "Quality rules that are defined but not loaded or monitored, or monitored with no exception owner, are the usual reason a certified foundation degrades after go-live.",
    sourceDocHint:
      "Data-quality rule register, monitoring dashboard extract, or exception log",
    acceptedFormats: ["xlsx", "csv", "pdf", "docx"],
    feedsMethods: ["maturity_scoring", "two_gap", "leverage_ranking"],
  },
  {
    key: "source_system_data_access",
    label:
      "Source system data access (EMR, claims, pharmacy, marts) + contracts/SLAs",
    kind: "inventory",
    whyNeeded:
      "Establishes which source systems the foundation may actually read, on what refresh, and under which contractual and SLA limits.",
    sourceDocHint:
      "System inventory, interface register, data-sharing agreement, or vendor SLA extract",
    acceptedFormats: ["xlsx", "csv", "docx", "pdf"],
    feedsMethods: ["maturity_scoring", "two_gap"],
  },
  {
    key: "platform_architecture_readiness",
    label: "Platform & architecture readiness (lakehouse/medallion, environments)",
    kind: "inventory",
    whyNeeded:
      "The platform, layering and environment story decides what can be certified now versus what the roadmap must build first.",
    sourceDocHint:
      "Architecture diagram, platform inventory, or environment/landing-zone description",
    acceptedFormats: ["pptx", "pdf", "docx", "xlsx"],
    feedsMethods: ["maturity_scoring", "two_gap", "workpackage_roadmap_estimate"],
  },
  {
    key: "master_identity_resolution",
    label: "Master / entity identity resolution (patient, member, provider spine)",
    kind: "qualitative",
    whyNeeded:
      "Without a resolved identity spine, every cross-source metric double-counts or drops records, and no certified entity definition can hold.",
    sourceDocHint:
      "MDM design, identity-resolution rules, or match/merge quality report",
    acceptedFormats: ["docx", "pdf", "xlsx", "csv"],
    feedsMethods: ["maturity_scoring", "two_gap"],
  },
  {
    key: "privacy_security_controls",
    label: "Privacy & security controls for the data foundation (PHI, access)",
    kind: "qualitative",
    whyNeeded:
      "Access, minimisation and PHI-handling controls bound what the foundation may expose to any downstream automation.",
    sourceDocHint:
      "Access-control matrix, privacy assessment, or security control description",
    acceptedFormats: ["docx", "pdf", "xlsx"],
    feedsMethods: ["maturity_scoring", "two_gap"],
  },
  {
    key: "model_risk_responsible_ai_controls",
    label: "Responsible-AI / model-risk controls for downstream automation",
    kind: "qualitative",
    whyNeeded:
      "The foundation is being certified so automation can rely on it; the model-risk and responsible-AI controls are what make that reliance governable.",
    sourceDocHint:
      "Model-risk policy, responsible-AI standard, or review-board terms of reference",
    acceptedFormats: ["docx", "pdf", "pptx"],
    feedsMethods: ["maturity_scoring", "two_gap"],
  },
  {
    key: "measurement_owner_cadence",
    label: "Measurement owners + cadence for the certified foundation",
    kind: "org",
    whyNeeded:
      "Names who reports the foundation's health, to whom, and how often — the handoff Tower picks up after P5.",
    sourceDocHint:
      "Operating-cadence description, scorecard owner list, or governance calendar",
    acceptedFormats: ["docx", "pdf", "xlsx", "pptx"],
    feedsMethods: ["maturity_scoring"],
  },
  {
    key: "finance_baseline_value_plan",
    label: "Finance baseline + value plan (quantify after baselines sign off)",
    kind: "financial",
    whyNeeded:
      "The value case for a foundation is only honest once the baselines it is measured against are signed off; this family is that baseline.",
    sourceDocHint:
      "Finance baseline workbook, cost extract, or signed-off value plan",
    acceptedFormats: ["xlsx", "csv", "pdf", "docx"],
    feedsMethods: ["leverage_ranking", "workpackage_roadmap_estimate"],
  },
  {
    key: "change_adoption_owner",
    label: "Change / adoption owner for governed-foundation rollout",
    kind: "org",
    whyNeeded:
      "Optional at discovery: a named adoption owner is what carries stewardship and certification practice into the business after rollout.",
    sourceDocHint:
      "Change plan, adoption owner assignment, or enablement approach",
    acceptedFormats: ["docx", "pdf", "pptx"],
    feedsMethods: ["maturity_scoring"],
  },
];

/**
 * Per-phase requirements.
 *
 * The blueprint declares these families as DISCOVERY evidence, so the eleven
 * hard requirements land at `diagnose` (P2) and nowhere earlier. `charter`
 * carries two of them as `soft` only: a Move should not be newly blocked at P1
 * by a declaration made for P2's benefit, and `soft` families are context, not
 * blockers (`resolveArchetypeRequirements` keeps the severity it is given).
 *
 * `design`, `roadmap_business_case` and `mobilize` declare no evidence, matching
 * every other archetype in the registry: the later phases consume what P2
 * certified rather than demanding new families. `gateRequirements` are
 * declarative today — nothing in the product reads them (the phase gate is
 * `src/lib/programs/governance.ts`), so they describe intent without gating.
 */
export const GOVERNED_DATA_FOUNDATION_PHASES: PhaseRequirements[] = [
  {
    phase: "originate",
    requiredEvidence: [],
    analysisMethods: [],
    deliverables: ["origination_brief"],
    gateRequirements: [
      {
        key: "program_seed_recorded",
        describe:
          "Brief signed off with the governed data-foundation archetype declared",
        severity: "hard",
      },
      {
        key: "value_hypothesis_seed",
        describe:
          "Value hypothesis names the certification trigger and the outcome it unlocks",
        severity: "hard",
      },
    ],
  },
  {
    phase: "charter",
    requiredEvidence: [
      { family: "data_governance_ownership", severity: "soft" },
      { family: "finance_baseline_value_plan", severity: "soft" },
    ],
    analysisMethods: ["maturity_scoring", "two_gap"],
    deliverables: ["program_charter"],
    gateRequirements: [
      {
        key: "charter_signed_off",
        describe: "Charter approved by an authorized workspace user",
        severity: "hard",
      },
    ],
  },
  {
    phase: "diagnose",
    requiredEvidence: [
      { family: "data_governance_ownership", severity: "hard" },
      { family: "semantic_layer_certification", severity: "hard" },
      { family: "data_lineage_audit_trail", severity: "hard" },
      { family: "data_quality_rules", severity: "hard" },
      { family: "source_system_data_access", severity: "hard" },
      { family: "platform_architecture_readiness", severity: "hard" },
      { family: "master_identity_resolution", severity: "hard" },
      { family: "privacy_security_controls", severity: "hard" },
      { family: "model_risk_responsible_ai_controls", severity: "hard" },
      { family: "measurement_owner_cadence", severity: "hard" },
      { family: "finance_baseline_value_plan", severity: "hard" },
      { family: "change_adoption_owner", severity: "soft" },
    ],
    analysisMethods: ["maturity_scoring", "two_gap", "leverage_ranking"],
    deliverables: ["discovery_report"],
    gateRequirements: [
      {
        key: "foundation_evidence_approved",
        describe:
          "Every required data-foundation family is approved against this Move",
        severity: "hard",
      },
    ],
  },
  {
    phase: "design",
    requiredEvidence: [],
    analysisMethods: ["two_gap", "leverage_ranking"],
    deliverables: ["target_state_architecture"],
    gateRequirements: [
      {
        key: "certification_route_selected",
        describe:
          "A certification route is selected and its control implications recorded",
        severity: "hard",
      },
    ],
  },
  {
    phase: "roadmap_business_case",
    requiredEvidence: [],
    analysisMethods: ["workpackage_roadmap_estimate", "leverage_ranking"],
    deliverables: ["execution_roadmap", "financial_model"],
    gateRequirements: [
      {
        key: "value_traced_to_baseline",
        describe:
          "Every quantified figure traces to the signed-off finance baseline",
        severity: "hard",
      },
    ],
  },
  {
    phase: "mobilize",
    requiredEvidence: [],
    analysisMethods: [],
    deliverables: ["handoff_package", "value_measurement_contract"],
    gateRequirements: [
      {
        key: "measurement_owner_named",
        describe:
          "A named owner and cadence carry the foundation's measurement into Tower",
        severity: "hard",
      },
    ],
  },
];
