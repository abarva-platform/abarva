// The declared vocabulary of evidence families the ARTIFACT-PACK catalog may
// name, plus the measured relationship between the product's two family id
// spaces.
//
// Why this exists. A pack (`archetype-packs.ts`) names the evidence families
// its use case needs as `keyEvidenceFamilies: string[]`, and those strings are
// load-bearing in three places: they land in a deliverable's sections
// (`composeBrief`), they become the TEXT of a retrieval query
// (`generate-service.ts`), and they are the only thing the pack half derives a
// client-facing evidence ask from. Until now the contract behind them was
// `z.string().min(1)` — any non-empty string. A misspelled family id therefore
// produced a confident retrieval query for a family that does not exist and
// grounded a section against nothing, with no error anywhere. Spelling the
// identifier into words for retrieval makes that WORSE, not better: a typo now
// retrieves prose that is merely irrelevant instead of matching nothing.
//
// The product's first rule is that identity is declared, never inferred. So the
// legitimate family ids are declared here, once, and a pack may name a family
// only if this vocabulary holds it or the pack itself declares the family as one
// it introduces. A deploying firm adding an archetype can still bring new
// families — it just has to say so, which is the whole difference between a new
// family and a typo.
//
// This module deliberately does NOT invent a mapping between the two id spaces.
// The discovery-blueprint catalog and the pack catalog declare entirely separate
// family vocabularies; which ids the two halves should share is a product
// decision, not something to derive here. What this module does is MEASURE the
// relationship, so that decision is taken against a number rather than a
// sentence in a gap list.

import { DISCOVERY_BLUEPRINT_CATALOG } from "./discovery-blueprint";
import { SHARED_EVIDENCE_FAMILIES } from "./discovery-evidence-library";

/** A family id an archetype pack may name, with what it is and what it grounds. */
export interface PackEvidenceFamily {
  id: string;
  /** How a person refers to this family — the pack half had no label at all. */
  label: string;
  /** Which deliverable surfaces this family grounds, in the blueprint's idiom. */
  grounds: string;
}

const family = (
  id: string,
  label: string,
  grounds: string,
): PackEvidenceFamily => ({
  id,
  label,
  grounds,
});

/**
 * Every evidence family the built-in pack catalog names, keyed by id.
 *
 * Kept exactly equal to the union of the seed packs' `keyEvidenceFamilies`: an
 * entry here that no pack names would be a family nothing can ask for, and a
 * pack family missing here fails `validateBuiltInArchetypePackCatalog()`. Both
 * directions are pinned, so this cannot drift from the catalog it describes.
 */
export const PACK_EVIDENCE_FAMILY_VOCABULARY: Readonly<
  Record<string, PackEvidenceFamily>
> = Object.freeze({
  // ── service management / sourcing ──
  service_tower_scope: family(
    "service_tower_scope",
    "Service tower scope",
    "Scope Definition · Tower Scope Map",
  ),
  application_inventory: family(
    "application_inventory",
    "Application inventory",
    "Current-State · Application Inventory",
  ),
  sla_baseline: family(
    "sla_baseline",
    "Service-level and KPI baseline",
    "SLA / KPI Schedule",
  ),
  ticket_volumes: family(
    "ticket_volumes",
    "Ticket and demand volumes",
    "Demand Baseline · Pricing Response",
  ),
  incident_problem_change: family(
    "incident_problem_change",
    "Incident, problem and change records",
    "Current-State · Service Quality",
  ),
  staffing_baseline: family(
    "staffing_baseline",
    "Staffing and retained-organisation baseline",
    "Staffing Baseline · Operating Model",
  ),
  run_cost_baseline: family(
    "run_cost_baseline",
    "Run-cost baseline",
    "Cost Baseline · Business Case",
  ),
  contract_baseline: family(
    "contract_baseline",
    "Incumbent contract baseline",
    "Commercial Baseline · Negotiation Levers",
  ),
  transition_constraints: family(
    "transition_constraints",
    "Transition constraints",
    "Transition Timeline · Risk",
  ),
  // ── package selection and implementation ──
  process_scope: family(
    "process_scope",
    "Process scope (L1/L2)",
    "Scope Definition · Process Scope Map",
  ),
  integration_landscape: family(
    "integration_landscape",
    "Integration landscape",
    "Integration Register · Target Architecture",
  ),
  data_migration_complexity: family(
    "data_migration_complexity",
    "Data migration complexity",
    "Data Migration Objects · Cutover Plan",
  ),
  business_readiness: family(
    "business_readiness",
    "Business readiness for change",
    "Change Plan · Rollout Waves",
  ),
  // ── platform and infrastructure modernisation ──
  app_dependency_map: family(
    "app_dependency_map",
    "Application dependency map",
    "Dependency Map · Migration Waves",
  ),
  infrastructure_estate: family(
    "infrastructure_estate",
    "Infrastructure estate",
    "Infrastructure Estate · Target Architecture",
  ),
  cloud_cost_baseline: family(
    "cloud_cost_baseline",
    "Cloud cost baseline",
    "FinOps / Cost Model · Business Case",
  ),
  security_network_constraints: family(
    "security_network_constraints",
    "Security and network constraints",
    "Landing Zone Readiness · Risk",
  ),
  // ── engineering and delivery performance ──
  dora_baseline: family(
    "dora_baseline",
    "Delivery performance baseline",
    "DORA Baseline · Value Model",
  ),
  engineering_operating_model: family(
    "engineering_operating_model",
    "Engineering and product operating model",
    "Operating Model",
  ),
  platform_architecture: family(
    "platform_architecture",
    "Application and platform architecture",
    "Platform Architecture · Target Architecture",
  ),
  ai_tooling_adoption: family(
    "ai_tooling_adoption",
    "Agent and tooling adoption",
    "Tooling Adoption · Value Hypothesis",
  ),
  security_governance_gates: family(
    "security_governance_gates",
    "Security and governance gates for generated change",
    "Governance Gates · Risk",
  ),
  // ── analytics capability repatriation ──
  analytics_capability_inventory: family(
    "analytics_capability_inventory",
    "Managed analytics capability inventory",
    "Capability Inventory · Scope Definition",
  ),
  vendor_data_feed_register: family(
    "vendor_data_feed_register",
    "Vendor data feed register",
    "Data Sent to Provider · Controls",
  ),
  processing_transparency: family(
    "processing_transparency",
    "Provider processing transparency",
    "Logic Transparency · Parity Traceability",
  ),
  business_rules_measure_logic: family(
    "business_rules_measure_logic",
    "Business rules, measures and model logic",
    "Logic Transparency · Parity Plan",
  ),
  output_workflow_inventory: family(
    "output_workflow_inventory",
    "Output and workflow inventory",
    "Capability Inventory · Parity Traceability",
  ),
  data_quality_identity_conformance: family(
    "data_quality_identity_conformance",
    "Data quality, identity and conformance",
    "Parity Plan · Risk",
  ),
  internal_databricks_readiness: family(
    "internal_databricks_readiness",
    "Internal analytics platform readiness",
    "Target Architecture · Readiness",
  ),
  controls_privacy_security_regulatory: family(
    "controls_privacy_security_regulatory",
    "Privacy, security and regulatory controls",
    "Controls · Risk",
  ),
  sla_operations_baseline: family(
    "sla_operations_baseline",
    "Operations and service-level baseline",
    "Operating Model · Service Levels",
  ),
  contract_ip_data_return_exit: family(
    "contract_ip_data_return_exit",
    "Contract, IP, data return and exit posture",
    "Exit Posture · Required Decisions",
  ),
  current_cost_value_baseline: family(
    "current_cost_value_baseline",
    "Current cost and value baseline",
    "Cost, Value and Reuse Stack · Business Case",
  ),
  operating_model_readiness: family(
    "operating_model_readiness",
    "Target operating-model readiness",
    "Operating Model · Change Plan",
  ),
  // ── governed data foundation ──
  data_governance_ownership: family(
    "data_governance_ownership",
    "Data governance ownership, decision rights and stewardship",
    "Current-State Assessment · Operating Model · Gate controls",
  ),
  semantic_layer_certification: family(
    "semantic_layer_certification",
    "Certified semantic layer, entity and metric definitions",
    "Target Architecture · Value Model",
  ),
  data_lineage_audit_trail: family(
    "data_lineage_audit_trail",
    "Source-to-use lineage and model audit trail",
    "Current-State · Responsible-AI controls",
  ),
  data_quality_rules: family(
    "data_quality_rules",
    "Data quality rules, monitoring and exception owners",
    "Current-State Assessment · Gate controls",
  ),
  source_system_data_access: family(
    "source_system_data_access",
    "Source system data access, contracts and SLAs",
    "Current-State · Target Architecture",
  ),
  platform_architecture_readiness: family(
    "platform_architecture_readiness",
    "Data platform and curation-layer readiness",
    "Target Architecture",
  ),
  master_identity_resolution: family(
    "master_identity_resolution",
    "Master and entity identity resolution spine",
    "Target Architecture · Value Model",
  ),
  privacy_security_controls: family(
    "privacy_security_controls",
    "Privacy and security controls over the data foundation",
    "Risk · Gate controls",
  ),
  model_risk_responsible_ai_controls: family(
    "model_risk_responsible_ai_controls",
    "Responsible-AI and model-risk controls for downstream automation",
    "Risk · Responsible-AI controls",
  ),
  measurement_owner_cadence: family(
    "measurement_owner_cadence",
    "Measurement owners and reporting cadence",
    "Value Model · Operating Model",
  ),
  finance_baseline_value_plan: family(
    "finance_baseline_value_plan",
    "Finance baseline and conditional value plan",
    "Value Model · Business Case",
  ),
});

/** Does the shipped vocabulary declare this family id? */
export function isDeclaredPackEvidenceFamily(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(
    PACK_EVIDENCE_FAMILY_VOCABULARY,
    id,
  );
}

/**
 * The family ids in `named` that neither the shipped vocabulary nor
 * `alsoDeclared` accounts for, in the order they were named and without
 * repeats. `alsoDeclared` is the escape hatch a configured archetype uses to
 * bring families of its own: it has to NAME them, which is what separates a new
 * family from a misspelling of an existing one.
 */
export function unknownPackEvidenceFamilies(
  named: readonly string[],
  alsoDeclared: readonly string[] = [],
): string[] {
  const declared = new Set(alsoDeclared);
  const unknown: string[] = [];
  for (const id of named) {
    if (isDeclaredPackEvidenceFamily(id)) continue;
    if (declared.has(id)) continue;
    if (unknown.includes(id)) continue;
    unknown.push(id);
  }
  return unknown;
}

/**
 * The nearest declared family id to `id`, when one is near enough that `id`
 * reads as a misspelling of it rather than as a different family.
 *
 * This exists because the refusal it feeds is read by whoever wrote the typo.
 * "unknown evidence family: aplication_inventory" sends them to the vocabulary
 * to look; "did you mean application_inventory?" ends it. The threshold is
 * deliberately tight — three edits over ids this long is a slip, while a
 * genuinely new family gets no suggestion at all, because suggesting an
 * unrelated family is worse than suggesting nothing.
 */
export function nearestDeclaredPackEvidenceFamily(
  id: string,
): string | undefined {
  const MAX_EDITS = 3;
  let best: string | undefined;
  let bestDistance = MAX_EDITS + 1;
  // Sorted so a tie resolves the same way on every run.
  for (const candidate of Object.keys(PACK_EVIDENCE_FAMILY_VOCABULARY).sort()) {
    const distance = editDistance(id, candidate, bestDistance);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  // `bestDistance` starts past MAX_EDITS and a candidate is only taken when
  // it beats it, so the ceiling IS the threshold — nothing further to check.
  return best;
}

/**
 * Levenshtein distance, abandoned once every cell in a row exceeds `ceiling`
 * (no closer candidate can come out of a row that is already too far).
 */
function editDistance(a: string, b: string, ceiling: number): number {
  if (Math.abs(a.length - b.length) > ceiling) return ceiling + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let rowMinimum = i;
    for (let j = 1; j <= b.length; j += 1) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      const cell = Math.min(substitution, previous[j] + 1, row[j - 1] + 1);
      row.push(cell);
      if (cell < rowMinimum) rowMinimum = cell;
    }
    if (rowMinimum > ceiling) return ceiling + 1;
    previous = row;
  }
  return previous[b.length];
}

/** How the two halves' family id spaces actually relate, as measured. */
export interface EvidenceFamilyVocabularyOverlap {
  /** Ids only the pack catalog names. */
  packOnly: string[];
  /** Ids only the discovery blueprint catalog or the shared library declares. */
  discoveryOnly: string[];
  /** Ids both halves use — a family a Move asks for once and grounds twice. */
  shared: string[];
}

/**
 * Measure the two id spaces against each other.
 *
 * `shared` is empty today: 34 pack ids and 43 discovery ids, nothing in common,
 * so a Move's two halves ask for evidence under two unrelated names. That is a
 * product decision to take (which families the halves should share), and this
 * report is what it should be taken against — not a correctness bug to fix by
 * renaming one side.
 */
export function evidenceFamilyVocabularyOverlap(): EvidenceFamilyVocabularyOverlap {
  const discovery = new Set<string>(Object.keys(SHARED_EVIDENCE_FAMILIES));
  for (const blueprint of Object.values(DISCOVERY_BLUEPRINT_CATALOG)) {
    for (const evidenceFamily of blueprint.evidenceFamilies) {
      discovery.add(evidenceFamily.id);
    }
  }
  const pack = new Set(Object.keys(PACK_EVIDENCE_FAMILY_VOCABULARY));
  const sorted = (ids: Iterable<string>) => [...ids].sort();
  return {
    packOnly: sorted([...pack].filter((id) => !discovery.has(id))),
    discoveryOnly: sorted([...discovery].filter((id) => !pack.has(id))),
    shared: sorted([...pack].filter((id) => discovery.has(id))),
  };
}
