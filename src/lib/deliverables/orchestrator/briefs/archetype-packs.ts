// Archetype packs — the use-case-specific artifact intelligence.
//
// Each pack carries the exhibits, tables, and key evidence families a senior
// consultant expects for that use case. The brief registry composes a pack with a
// deliverable structure to produce a full DeliverableArtifactBrief, so deliverables
// genuinely DIFFER by archetype rather than sharing one generic template.

import { z } from "zod";

import type { ExpectedExhibit, ExpectedTable } from "../types";

import { resolveArchetypeCatalogEntry } from "./archetype-identity";
import {
  nearestDeclaredPackEvidenceFamily,
  unknownPackEvidenceFamilies,
} from "./evidence-family-vocabulary";
import { GOVERNED_DATA_FOUNDATION_PACK } from "./archetype-pack-governed-data-foundation";

export interface ArchetypePack {
  archetype: string;
  label: string; // how the role line describes the expertise
  /** evidence families this use case typically needs (drives grounding + intake). */
  keyEvidenceFamilies: string[];
  /**
   * Family ids this pack INTRODUCES, for a configured archetype that needs
   * evidence the shipped vocabulary does not declare. Naming them is what
   * separates a new family from a misspelling of an existing one; a built-in
   * pack needs none, because the vocabulary is built from the built-in packs.
   */
  declaresEvidenceFamilies?: string[];
  exhibits: ExpectedExhibit[];
  tables: ExpectedTable[];
  /** extra governance note appended to the disallowed-fabrication boundary. */
  governanceNote?: string;
}

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

const RISK_TABLE = tbl(
  "risk_register",
  "Risks, Issues & Dependencies",
  ["Item", "Type", "Impact", "Owner", "Mitigation"],
  "mixed",
  false,
);

// ── AMS / IT outsourcing ──
const AMS: ArchetypePack = {
  archetype: "AMS_IT_OUTSOURCING",
  label: "application management services and IT outsourcing",
  keyEvidenceFamilies: [
    "service_tower_scope",
    "application_inventory",
    "sla_baseline",
    "ticket_volumes",
    "incident_problem_change",
    "staffing_baseline",
    "run_cost_baseline",
    "contract_baseline",
    "transition_constraints",
  ],
  exhibits: [
    ex(
      "tower_scope_map",
      "Service Tower Scope Map",
      "matrix",
      "Towers × services × in/out of scope.",
      "xlsx",
    ),
    ex(
      "transition_timeline",
      "Transition Timeline",
      "timeline",
      "Phased transition with KT, parallel run, and gates.",
    ),
    ex(
      "evaluation_model",
      "Evaluation Model",
      "matrix",
      "Criteria × weights × scoring method.",
      "xlsx",
    ),
    ex(
      "negotiation_levers",
      "Negotiation Levers",
      "matrix",
      "Levers × leverage × target outcome (internal).",
    ),
  ],
  tables: [
    tbl("application_inventory", "Application Inventory", [
      "App",
      "Criticality",
      "Business function",
      "Tower",
    ]),
    tbl("sla_schedule", "SLA / KPI Schedule", [
      "Service",
      "Metric",
      "Target",
      "Window",
      "Credit",
    ]),
    tbl("volume_baseline", "Demand Baseline", [
      "Tower",
      "Priority",
      "Period",
      "Volume",
    ]),
    tbl(
      "staffing_baseline",
      "Staffing / Retained-Org Baseline",
      ["Role", "Tower", "FTE", "Location mix"],
      "mixed",
    ),
    tbl(
      "pricing_template",
      "Pricing Response Template",
      ["Tower", "Resource unit", "Rate", "Volume", "Annual"],
      "expert_template",
    ),
    RISK_TABLE,
  ],
  governanceNote:
    "For an ISSUED RFP, never disclose incumbent vendor names or incumbent spend — those are internal-only.",
};

// ── ERP / SI selection ──
const ERP_SI: ArchetypePack = {
  archetype: "ERP_SI_SELECTION",
  label: "ERP and systems-integrator selection",
  keyEvidenceFamilies: [
    "process_scope",
    "integration_landscape",
    "data_migration_complexity",
    "business_readiness",
    "application_inventory",
    "run_cost_baseline",
  ],
  exhibits: [
    ex(
      "process_scope_map",
      "Process Scope Map",
      "matrix",
      "L1/L2 processes × in-scope × rollout wave.",
      "xlsx",
    ),
    ex(
      "rollout_waves",
      "Rollout Waves",
      "timeline",
      "Geographies/entities × waves with go-lives.",
    ),
    ex(
      "integration_landscape",
      "Integration Landscape",
      "flow",
      "Source/target systems × interfaces × pattern.",
    ),
    ex(
      "cutover_plan",
      "Testing & Cutover Plan",
      "timeline",
      "Test stages, mock cutovers, go/no-go gates.",
    ),
    ex(
      "evaluation_model",
      "SI Evaluation Model",
      "matrix",
      "Criteria × weights × scoring.",
      "xlsx",
    ),
  ],
  tables: [
    tbl("process_scope", "Process Scope", [
      "Process (L1/L2)",
      "In scope",
      "Wave",
      "Owner",
    ]),
    tbl("integration_register", "Integration Register", [
      "Source",
      "Target",
      "Pattern",
      "Volume",
      "Criticality",
    ]),
    tbl("data_objects", "Data Migration Objects", [
      "Object",
      "Source",
      "Records",
      "Complexity",
      "Cleansing",
    ]),
    tbl(
      "si_staffing",
      "SI Staffing Model",
      ["Role", "Onshore/Offshore", "FTE", "Phase"],
      "mixed",
    ),
    tbl(
      "pricing_template",
      "Pricing Template",
      ["Phase", "Deliverable", "Effort", "Rate", "Cost"],
      "expert_template",
    ),
    RISK_TABLE,
  ],
};

// ── Cloud modernization ──
const CLOUD_MOD: ArchetypePack = {
  archetype: "CLOUD_MODERNIZATION",
  label: "cloud modernization and migration",
  keyEvidenceFamilies: [
    "application_inventory",
    "app_dependency_map",
    "infrastructure_estate",
    "cloud_cost_baseline",
    "security_network_constraints",
    "run_cost_baseline",
  ],
  exhibits: [
    ex(
      "app_dependency_map",
      "Application Dependency Map",
      "flow",
      "Apps × dependencies × migration grouping.",
    ),
    ex(
      "migration_waves",
      "Migration Waves",
      "timeline",
      "Move-groups × waves × disposition (6Rs).",
    ),
    ex(
      "landing_zone",
      "Landing Zone Readiness",
      "heatmap",
      "Foundation controls × readiness state.",
    ),
    ex(
      "finops_model",
      "FinOps / Cost Model",
      "chart",
      "Baseline vs target run-rate by service.",
      "xlsx",
    ),
  ],
  tables: [
    tbl("app_disposition", "Application Disposition (6Rs)", [
      "App",
      "Disposition",
      "Wave",
      "Complexity",
      "Risk",
    ]),
    tbl("infra_estate", "Infrastructure Estate", [
      "Asset",
      "Class",
      "Location",
      "Lifecycle",
    ]),
    tbl(
      "cost_baseline",
      "Cloud Cost Baseline",
      ["Service", "Current $", "Target $", "Driver"],
      "mixed",
    ),
    tbl(
      "security_constraints",
      "Security / Network Constraints",
      ["Constraint", "Scope", "Control owner"],
      "mixed",
    ),
    RISK_TABLE,
  ],
};

// ── AI-powered product development lifecycle ──
const AI_PDLC: ArchetypePack = {
  archetype: "AI_PDLC",
  label: "the AI-powered product development lifecycle",
  keyEvidenceFamilies: [
    "dora_baseline",
    "engineering_operating_model",
    "platform_architecture",
    "ai_tooling_adoption",
    "security_governance_gates",
  ],
  exhibits: [
    ex(
      "dora_baseline",
      "DORA Baseline",
      "chart",
      "Deploy freq, lead time, CFR, MTTR vs benchmark.",
      "xlsx",
    ),
    ex(
      "operating_model",
      "Engineering / Product Operating Model",
      "matrix",
      "Teams × responsibilities × interfaces.",
    ),
    ex(
      "platform_architecture",
      "Application / Platform Architecture",
      "flow",
      "Platforms, services, and data flows.",
    ),
    ex(
      "human_agent_workflow",
      "Human + Agent Workflow",
      "flow",
      "Where agents act vs humans decide, with gates.",
    ),
    ex(
      "governance_gates",
      "Security / Governance Gates",
      "flow",
      "SDLC gates for AI-generated change.",
    ),
    ex(
      "phase_roadmap",
      "Phase Roadmap",
      "timeline",
      "Capability build-out by phase.",
    ),
  ],
  tables: [
    tbl(
      "dora_metrics",
      "DORA Metrics",
      ["Metric", "Current", "Target", "Benchmark"],
      "mixed",
    ),
    tbl(
      "ai_tooling",
      "AI Tooling Adoption",
      ["Tool", "Use case", "Adoption %", "Owner"],
      "mixed",
    ),
    tbl(
      "value_hypothesis",
      "Value Hypothesis",
      ["Lever", "Mechanism", "KPI", "Target"],
      "mixed",
    ),
    RISK_TABLE,
  ],
};

// ── Analytics capability repatriation / managed analytics exit ──
const ANALYTICS_REPATRIATION: ArchetypePack = {
  archetype: "ANALYTICS_CAPABILITY_REPATRIATION",
  label: "analytics capability repatriation and managed analytics exit",
  keyEvidenceFamilies: [
    "analytics_capability_inventory",
    "vendor_data_feed_register",
    "processing_transparency",
    "business_rules_measure_logic",
    "output_workflow_inventory",
    "data_quality_identity_conformance",
    "internal_databricks_readiness",
    "controls_privacy_security_regulatory",
    "sla_operations_baseline",
    "contract_ip_data_return_exit",
    "current_cost_value_baseline",
    "operating_model_readiness",
  ],
  exhibits: [
    ex(
      "strategic_control_repatriation_readiness",
      "Strategic Control x Repatriation Readiness",
      "matrix",
      "Four-quadrant decision view: retain/optimize, hybrid/coexistence, phased repatriation, or full repatriation.",
    ),
    ex(
      "vendor_to_databricks_traceability",
      "Vendor-to-Databricks Capability Traceability",
      "matrix",
      "Existing vendor capability -> inputs -> known/unknown logic -> target component -> output/workflow -> control -> acceptance/parity test -> treatment.",
      "xlsx",
    ),
    ex(
      "target_analytics_architecture",
      "Target Analytics Architecture on a Page",
      "logical_architecture",
      "Capability, ingestion, Bronze/Silver/Gold, semantic/metric, governance, activation, monitoring, and coexistence views when evidenced.",
    ),
    ex(
      "parallel_run_parity_plan",
      "Parallel Run and Parity Plan",
      "timeline",
      "Sequenced proof of output parity, reconciliation, operating readiness, and exit/reset gates.",
    ),
    ex(
      "transition_cost_stack",
      "Investment and Transition Cost Stack",
      "chart",
      "Separates shared foundation, capability reconstruction, transition/double-run, retained vendor obligations, cloud run, and reuse value.",
      "xlsx",
    ),
  ],
  tables: [
    tbl("capability_inventory", "Managed Analytics Capability Inventory", [
      "Capability",
      "Business owner",
      "Inputs",
      "Outputs",
      "Workflow",
      "Criticality",
    ]),
    tbl("vendor_data_flows", "Data Sent to Provider", [
      "Source",
      "Dataset",
      "Frequency",
      "PII/PHI/regulated data",
      "Return path",
      "Control",
    ]),
    tbl("logic_transparency", "Business Rules, Measures and Model Logic", [
      "Capability",
      "Known logic",
      "Unknown logic",
      "Evidence",
      "Treatment",
    ]),
    tbl("parity_traceability", "Capability Parity Traceability Matrix", [
      "Vendor capability",
      "Target component",
      "Control",
      "Acceptance/parity test",
      "Treatment",
    ]),
    tbl(
      "exit_posture",
      "Contract, IP, Data Return and Exit Posture",
      ["Contract area", "Known position", "Risk", "Required decision", "Owner"],
      "mixed",
    ),
    tbl(
      "cost_value_stack",
      "Cost, Value and Reuse Stack",
      [
        "Cost/value bucket",
        "Evidence status",
        "Amount/range",
        "Timing",
        "Condition",
      ],
      "mixed",
    ),
    RISK_TABLE,
  ],
  governanceNote:
    "For analytics repatriation, migrate capabilities rather than screens. Never compute savings as vendor spend minus internal platform cost; quantified value requires validated vendor cost, retained obligations, foundation investment, capability investment, transition/double-run cost, run cost, timing, and risk conditions.",
};

export const ARCHETYPE_PACKS: Record<string, ArchetypePack> = {
  AMS_IT_OUTSOURCING: AMS,
  ERP_SI_SELECTION: ERP_SI,
  CLOUD_MODERNIZATION: CLOUD_MOD,
  AI_PDLC,
  ANALYTICS_CAPABILITY_REPATRIATION: ANALYTICS_REPATRIATION,
  // Content lives beside the contract, not inside it — see that module's header.
  GOVERNED_DATA_FOUNDATION: GOVERNED_DATA_FOUNDATION_PACK,
};

/**
 * Resolve the pack for a declared archetype. Shares one identity rule with the
 * discovery blueprint catalog (`archetype-identity.ts`), so the SAME declared
 * value selects both the pack and the blueprint instead of only whichever
 * catalog happens to be keyed in the spelling the declaration used.
 */
export function getArchetypePack(archetype: string): ArchetypePack | undefined {
  return resolveArchetypeCatalogEntry(ARCHETYPE_PACKS, archetype) ?? undefined;
}

// ── Config contract + loader (Phase 4 of the configurable archetype layer) ──
//
// An archetype is declared in TWO catalogs: the discovery blueprint (evidence
// families + interview roster) and the pack below (exhibits, tables, governance
// note). The blueprint half already has a config contract and an overlay
// loader, so a deploying firm can add or override one WITHOUT shipping code.
// This half did not — which made "configure an archetype without code" only
// half true: the configured archetype collected the right evidence and then
// produced generic exhibits and tables, because the pack it needed could only
// be added by editing this file.
//
// Same contract as the blueprint loader so an operator learns one rule: a
// configured source is validated and either applied whole or rejected whole,
// never partially, so the catalog cannot be left half-corrupted.
//
// Two deliberate differences from the blueprint loader, both of which answer a
// question an operator actually asks of a setup screen:
//
//   1. The outcome names what each configured entry DID. A flat "applied" list
//      cannot distinguish adding an archetype from replacing a shipped one, and
//      those differ by one typo: an id meant to be new that happens to match a
//      built-in silently REPLACES it and reads as a successful add.
//   2. A configured source that declares the same id twice is rejected rather
//      than letting the later entry quietly win, because the operator who
//      wrote both definitions gets no signal that one was discarded.

const EXHIBIT_KINDS = [
  "diagram",
  "matrix",
  "timeline",
  "heatmap",
  "flow",
  "chart",
  "conceptual_architecture",
  "logical_architecture",
  "physical_architecture",
  "agent_orchestration",
  "roadmap",
] as const;

const OUTPUT_FORMATS = ["docx", "pptx", "xlsx", "html", "pdf"] as const;

const GROUNDING_MODES = [
  "governed_facts",
  "expert_template",
  "assumption_driven",
  "client_to_complete",
  "mixed",
] as const;

export const ExpectedExhibitSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(EXHIBIT_KINDS),
  purpose: z.string().min(1),
  preferredFormat: z.enum(OUTPUT_FORMATS),
  requiredElements: z.array(z.string().min(1)).optional(),
  legendRequired: z.boolean().optional(),
});

export const ExpectedTableSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  columns: z.array(z.string().min(1)).min(1),
  groundingMode: z.enum(GROUNDING_MODES),
  moveToExcelIfWide: z.boolean(),
});

const uniqueBy = <T>(items: T[], key: (item: T) => string): boolean =>
  new Set(items.map(key)).size === items.length;

/**
 * Said when a pack names an evidence family nothing declares. Exported so the
 * message a configured source is refused with has one spelling.
 */
export const UNKNOWN_EVIDENCE_FAMILY_MESSAGE =
  "unknown evidence family — add it to the shipped vocabulary or list it in declaresEvidenceFamilies";

export const ArchetypePackSchema = z
  .object({
    // UPPER_SNAKE because that is how this catalog keys its own entries. The
    // blueprint catalog keys lower_snake; they are separate id spaces and a
    // declaration is matched against each catalog's own declared ids.
    archetype: z
      .string()
      .min(1)
      .regex(/^[A-Z0-9_]+$/, "archetype must be UPPER_SNAKE [A-Z0-9_]"),
    label: z.string().min(1),
    keyEvidenceFamilies: z
      .array(z.string().min(1))
      .min(1)
      .refine((families) => uniqueBy(families, (family) => family), {
        message: "keyEvidenceFamilies must not repeat a family",
      }),
    // The escape hatch for a configured archetype that needs evidence families
    // the shipped vocabulary does not declare. lower_snake is enforced HERE and
    // not on `keyEvidenceFamilies`, because every id a pack merely NAMES is
    // already checked against the vocabulary (which is lower_snake throughout) —
    // whereas an id declared here is vouched for by nothing else.
    declaresEvidenceFamilies: z
      .array(
        z
          .string()
          .min(1)
          .regex(
            /^[a-z0-9_]+$/,
            "a declared evidence family id must be lower_snake [a-z0-9_]",
          ),
      )
      .refine((families) => uniqueBy(families, (family) => family), {
        message: "declaresEvidenceFamilies must not repeat a family",
      })
      .optional(),
    exhibits: z
      .array(ExpectedExhibitSchema)
      .min(1)
      .refine((exhibits) => uniqueBy(exhibits, (exhibit) => exhibit.key), {
        message: "exhibit keys must be unique within a pack",
      }),
    tables: z
      .array(ExpectedTableSchema)
      .min(1)
      .refine((tables) => uniqueBy(tables, (table) => table.key), {
        message: "table keys must be unique within a pack",
      }),
    governanceNote: z.string().min(1).optional(),
  })
  // Every family a pack NAMES must be a family something declares. These ids
  // are not labels: they land in a deliverable's sections, and they become the
  // text of the retrieval query that grounds those sections. An id nothing
  // declares is therefore not a cosmetic slip — it asks the corpus for evidence
  // under a name no evidence carries, and the answer comes back plausible.
  .superRefine((pack, ctx) => {
    const unknown = unknownPackEvidenceFamilies(
      pack.keyEvidenceFamilies,
      pack.declaresEvidenceFamilies ?? [],
    );
    for (const id of unknown) {
      const nearest = nearestDeclaredPackEvidenceFamily(id);
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["keyEvidenceFamilies", pack.keyEvidenceFamilies.indexOf(id)],
        message: nearest
          ? `${UNKNOWN_EVIDENCE_FAMILY_MESSAGE}: ${id} — did you mean ${nearest}?`
          : `${UNKNOWN_EVIDENCE_FAMILY_MESSAGE}: ${id}`,
      });
    }
  });

export const ArchetypePackCatalogSchema = z
  .array(ArchetypePackSchema)
  .refine((packs) => uniqueBy(packs, (pack) => pack.archetype), {
    message: "a configured source must not declare the same archetype twice",
  });

export type ArchetypePackConfig = z.infer<typeof ArchetypePackSchema>;

/** What one configured entry did to the catalog. */
export interface AppliedArchetypePack {
  archetype: string;
  /**
   * `added` — an archetype the built-in catalog did not declare.
   * `overrode` — a built-in archetype this entry replaced.
   */
  outcome: "added" | "overrode";
}

export interface LoadedArchetypePackCatalog {
  catalog: Record<string, ArchetypePack>;
  /** Per configured entry, in source order, what it did. */
  applied: AppliedArchetypePack[];
  /** Validation errors; when non-empty the configured source was rejected. */
  errors: string[];
}

/**
 * Build the effective pack catalog: the built-in seed with a validated
 * configured source overlaid. An entry whose `archetype` matches a seed id
 * overrides it; a new id adds an archetype. A configured source that fails
 * validation is rejected whole — the seed is returned unchanged and the errors
 * are surfaced — so a malformed config cannot partially corrupt the catalog.
 *
 * The returned catalog has a null prototype, so indexing it answers only ids it
 * actually holds. A plain object copy answers `constructor` and `toString` with
 * inherited members, which read as truthy entries to any caller that treats a
 * lookup result as "this archetype is configured".
 */
export function loadArchetypePackCatalog(
  configuredPacks?: unknown,
): LoadedArchetypePackCatalog {
  const catalog: Record<string, ArchetypePack> = Object.assign(
    Object.create(null) as Record<string, ArchetypePack>,
    ARCHETYPE_PACKS,
  );
  if (configuredPacks == null) {
    return { catalog, applied: [], errors: [] };
  }
  const parsed = ArchetypePackCatalogSchema.safeParse(configuredPacks);
  if (!parsed.success) {
    return {
      catalog,
      applied: [],
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
      ),
    };
  }
  const applied: AppliedArchetypePack[] = [];
  for (const pack of parsed.data) {
    // Against the SEED, not the catalog being built: "overrode" means this
    // entry replaced a shipped archetype. Duplicate configured ids are already
    // rejected above, so there is no earlier configured entry to shadow.
    const outcome =
      pack.archetype in ARCHETYPE_PACKS ? "overrode" : ("added" as const);
    catalog[pack.archetype] = pack as ArchetypePack;
    applied.push({ archetype: pack.archetype, outcome });
  }
  return { catalog, applied, errors: [] };
}

/**
 * Validate the built-in seed against the schema. The seam only holds if the
 * seed itself conforms to the contract a configured source must meet.
 */
export function validateBuiltInArchetypePackCatalog(): string[] {
  const parsed = ArchetypePackCatalogSchema.safeParse(
    Object.values(ARCHETYPE_PACKS),
  );
  if (parsed.success) return [];
  return parsed.error.issues.map(
    (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
}
