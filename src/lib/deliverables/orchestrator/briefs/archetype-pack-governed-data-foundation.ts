// The artifact pack for the governed-data-foundation archetype.
//
// Why this is a file of its own rather than a sixth literal in
// `archetype-packs.ts`: that module is the pack CONTRACT (the type, the config
// schema, the loader, the identity rule) and it is edited constantly. A pack is
// content. Keeping this one beside the contract instead of inside it means a
// declaration can be added without touching the schema it is validated by.
//
// Why it exists at all. An archetype is declared in two catalogs: the discovery
// blueprint (which evidence to collect, who to interview) and the pack below
// (which exhibits, tables and grounding the deliverables get). This archetype
// had the first half and not the second. Measured across every shipped
// deliverable structure, that meant all 21 of them grounded NONE of this
// archetype's evidence families and carried NONE of its exhibits or tables:
// `composeBrief` falls through to a generic one-row risk register when
// `getArchetypePack` answers nothing. So a Move declaring this archetype
// collected eleven required families of discovery evidence through P2 and then
// produced P3/P4/P5 deliverables that could not see any of it.
//
// The family ids here are deliberately the SAME ids the discovery blueprint
// collects under, not a parallel spelling of them. That is what makes approved
// P2 evidence land in the P3 sections that assert client facts; a pack naming
// its own synonyms would ask the corpus for evidence under a name no evidence
// carries, and get a plausible answer back.

import type { ExpectedExhibit, ExpectedTable } from "../types";

import type { ArchetypePack } from "./archetype-packs";

const ex = (
  key: string,
  title: string,
  kind: ExpectedExhibit["kind"],
  purpose: string,
  preferredFormat: ExpectedExhibit["preferredFormat"] = "pptx",
): ExpectedExhibit => ({ key, title, kind, purpose, preferredFormat });

const tbl = (
  key: string,
  title: string,
  columns: string[],
  groundingMode: ExpectedTable["groundingMode"] = "governed_facts",
  moveToExcelIfWide = true,
): ExpectedTable => ({ key, title, columns, groundingMode, moveToExcelIfWide });

/**
 * The pack for `governed_data_foundation`.
 *
 * `keyEvidenceFamilies` carries the blueprint's ELEVEN REQUIRED families and
 * not its optional twelfth (`change_adoption_owner`). The list drives both
 * grounding and the retrieval query, so naming a family the gate does not
 * require would make every deliverable ask for evidence a compliant Move is
 * never asked to supply.
 */
export const GOVERNED_DATA_FOUNDATION_PACK: ArchetypePack = {
  archetype: "GOVERNED_DATA_FOUNDATION",
  label:
    "governed data foundation that automation and language models may consume",
  keyEvidenceFamilies: [
    "data_governance_ownership",
    "semantic_layer_certification",
    "data_lineage_audit_trail",
    "data_quality_rules",
    "source_system_data_access",
    "platform_architecture_readiness",
    "master_identity_resolution",
    "privacy_security_controls",
    "model_risk_responsible_ai_controls",
    "measurement_owner_cadence",
    "finance_baseline_value_plan",
  ],
  exhibits: [
    ex(
      "domain_certification_readiness",
      "Which Data Domains Are Ready to Be Trusted, and Which Are Not",
      "matrix",
      "Domain x readiness dimension (named owner, certified definitions, loaded quality rules, traced lineage, access posture). Each cell states the evidence behind it; a domain missing any dimension is not certified, whatever its other scores.",
    ),
    ex(
      "target_governed_foundation_architecture",
      "Target Governed Foundation on a Page",
      "logical_architecture",
      "Source systems, ingestion, curation layers, the identity spine, the certified semantic layer, governed consumption for automation, plus the control and observability points that make each hop auditable. Shows only components the evidence supports; everything else is marked as a decision, not drawn as built.",
    ),
    ex(
      "source_to_use_control_chain",
      "Source to Use, and the Control That Proves Each Hop",
      "flow",
      "Traces one certified metric end to end: source of record, transformation, quality rule, lineage record, access control, consuming automation. The argument is that traceability is a chain, so the weakest hop is the foundation's real standing.",
    ),
    ex(
      "certification_sequence_and_unlocks",
      "The Order Domains Get Certified, and What Each One Unlocks",
      "roadmap",
      "Sequenced certification waves with the downstream automation each wave makes permissible. Dependencies are drawn from evidenced source access and identity coverage, never from desired start dates.",
    ),
    ex(
      "consumption_control_gate",
      "What Must Hold Before an Automation May Read a Domain",
      "matrix",
      "Responsible-AI and model-risk control x domain, stating for each pair whether the control is attested, who attested it, and what consumption it therefore permits. Unattested is rendered as unattested, never as low risk.",
    ),
  ],
  tables: [
    tbl("domain_ownership_register", "Data Domain Ownership and Decision Rights", [
      "Domain",
      "Accountable owner",
      "Steward",
      "Decision rights held",
      "Policy in force",
      "Evidence",
    ]),
    tbl("certified_definitions", "Certified Entity and Metric Definitions", [
      "Entity/metric",
      "Definition owner",
      "Certified",
      "Source of record",
      "Known consumers",
    ]),
    tbl("quality_rule_coverage", "Data Quality Rules, Monitoring and Exception Owners", [
      "Domain",
      "Rule",
      "Defined",
      "Loaded",
      "Monitored",
      "Exception owner",
    ]),
    tbl("source_access_posture", "Source System Access, Contracts and Restrictions", [
      "Source system",
      "Data scope",
      "Access path",
      "Contract/SLA position",
      "Restriction or condition",
    ]),
    tbl("identity_spine_coverage", "Entity Identity Resolution Coverage", [
      "Entity",
      "Spine source",
      "Resolution method",
      "Known gap",
      "Owner",
    ]),
    tbl(
      "control_attestation",
      "Privacy, Security and Model-Risk Control Attestation",
      ["Control", "Applies to", "Attested by", "Evidence", "Status"],
      "mixed",
    ),
    tbl(
      "measurement_ownership",
      "Measurement Owners and Reporting Cadence",
      ["Measure", "Owner", "Cadence", "Source", "First reportable date"],
      "mixed",
    ),
    tbl(
      "value_baseline_conditions",
      "Value Levers and the Baselines They Depend On",
      [
        "Value lever",
        "Baseline evidence status",
        "Amount/range",
        "Timing",
        "Condition",
      ],
      "mixed",
    ),
    tbl(
      "risk_register",
      "Risks, Issues & Dependencies",
      ["Item", "Type", "Impact", "Owner", "Mitigation"],
      "mixed",
      false,
    ),
  ],
  governanceNote:
    "For a governed data foundation, certified means attested: do not describe a domain, entity or metric as certified, governed or trusted unless the evidence names who owns the definition and who attested the control. Do not present a target component as in place when the evidence only shows it was decided. Do not quantify value before the finance baselines it depends on are signed off — state the lever, the baseline it waits on, and the condition instead.",
};
