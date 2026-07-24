#!/usr/bin/env tsx
/**
 * Nexus Pricing Engine — PR1 taxonomy pack converter.
 *
 * Reads the seed workbook (see PRICING_ENGINE_CURRENT_STATE.md §14 and the
 * PR1 execution prompt for why this specific file, not the brief's originally
 * guessed filename) and emits a deterministic, checked-in reference pack
 * under `datasets/reference/pricing-engine-v1/`.
 *
 * ## Why this script recomputes rates instead of reading them off the sheet
 *
 * The source workbook's `Roles` and `Role Rate Card` sheets carry their
 * priced columns ("Loaded $/hr", "Scarcity-Adj $/hr", "Indic. Bill $/hr") as
 * live Excel formulas (`VLOOKUP` against the `Internal Cost Model` and
 * `Assumptions` sheets) that were never opened/recalculated in Excel — the
 * workbook has no cached formula results (confirmed: `openpyxl`/ExcelJS both
 * return `undefined`/`null` for those cells' `.result`). Rather than silently
 * emit blank rates or fabricate numbers, this script reads the *literal*
 * (non-formula) input cells on the `Assumptions` sheet — the fully-loaded
 * cost components, billable hours, provider-tier multipliers, and the
 * market-base-bill-rate/base-salary table — and reproduces the exact formula
 * chain documented on the `Internal Cost Model` / `Role Rate Card` sheets:
 *
 *   loaded_hourly(level)      = base_salary(level) * (1 + total_load_factor) / billable_hours
 *   scarcity_adj(level,tier)  = loaded_hourly(level) * scarcity_multiplier(tier)
 *   indicative_bill(level,tier) = market_base_bill_rate(level) * SI-T1_tier_multiplier * scarcity_multiplier(tier)
 *
 * This was independently cross-checked against a manual Python
 * (`openpyxl`, formula text inspection) walk of the same workbook during
 * PR1 authoring; the computed numbers match the workbook's own disclosed
 * formulas cell-for-cell.
 *
 * ## Usage
 *
 *   npx tsx scripts/pricing/convert-workbook-to-reference-pack.ts <path-to-xlsx>
 *   PRICING_TAXONOMY_SOURCE_XLSX=/path/to.xlsx npx tsx scripts/pricing/convert-workbook-to-reference-pack.ts
 *   npm run pricing:build-reference-pack -- /path/to.xlsx
 *
 * The source workbook is NOT part of this repository (machine-specific path,
 * e.g. under `~/Downloads`) — it is provenance input only. The durable,
 * checked-in artifact is the CSV output under `datasets/reference/
 * pricing-engine-v1/` plus this script; re-running requires the source file
 * to be present again at a supplied path, but the committed CSVs do not.
 */
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { sha256File, writeCsv } from "./csv-utils";

const OUT_DIR = path.resolve(
  __dirname,
  "..",
  "..",
  "datasets",
  "reference",
  "pricing-engine-v1",
);
const DATASET_ID = "pricing-engine-v1";
const PACK_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Seniority levels — most senior first. This literally IS the business
// taxonomy (career-ladder order), not incidental spreadsheet layout, so it is
// a reviewable constant here. The read step below asserts the source
// workbook's `Career Levels` sheet lists exactly these names, in this exact
// order, and throws if it does not — so the script fails loudly on drift
// rather than silently mis-ranking levels.
// ---------------------------------------------------------------------------
const LEVEL_NAMES_EXPECTED = [
  "Partner",
  "Managing Director",
  "Principal",
  "Director",
  "Senior Manager",
  "Manager",
  "Lead",
  "Senior",
  "Intermediate",
  "Junior",
] as const;
type LevelName = (typeof LEVEL_NAMES_EXPECTED)[number];

function levelCode(levelName: string): string {
  const rank = LEVEL_NAMES_EXPECTED.indexOf(levelName as LevelName);
  if (rank < 0) {
    throw new Error(`Unknown seniority level "${levelName}"`);
  }
  return `LVL-${String(rank + 1).padStart(2, "0")}`;
}
function levelRank(levelName: string): number {
  const rank = LEVEL_NAMES_EXPECTED.indexOf(levelName as LevelName);
  if (rank < 0) {
    throw new Error(`Unknown seniority level "${levelName}"`);
  }
  return rank + 1; // 1 = most senior (Partner)
}
/** All level names from `min` (least senior) to `max` (most senior), i.e. the
 * allowed-range expansion used to generate one rate-band row per level. */
function levelsInRange(minLevel: string, maxLevel: string): string[] {
  const minRank = levelRank(minLevel);
  const maxRank = levelRank(maxLevel);
  if (maxRank > minRank) {
    throw new Error(
      `Invalid range: min="${minLevel}" (rank ${minRank}) is more senior than max="${maxLevel}" (rank ${maxRank})`,
    );
  }
  const out: string[] = [];
  for (let r = maxRank; r <= minRank; r++) {
    out.push(LEVEL_NAMES_EXPECTED[r - 1]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Role-type classification — heuristic, not source data. This is a
// reviewable rule table (see PR1 execution prompt): reviewers should be able
// to see and challenge it. Rules are evaluated in order; first match wins.
// ---------------------------------------------------------------------------
type RoleType =
  | "delivery"
  | "architecture"
  | "functional"
  | "governance"
  | "client"
  | "operations";

interface RoleTypeContext {
  towerName: string;
  roleName: string;
  capabilityName: string;
}

const ROLE_TYPE_RULES: ReadonlyArray<{
  description: string;
  test: (r: RoleTypeContext) => boolean;
  roleType: RoleType;
}> = [
  {
    description: "Enterprise Architecture tower -> architecture",
    test: (r) => r.towerName === "Enterprise Architecture",
    roleType: "architecture",
  },
  {
    description: 'Role name contains "Architect" -> architecture',
    test: (r) => /architect/i.test(r.roleName),
    roleType: "architecture",
  },
  {
    description:
      "Program Management or Change Management tower -> governance",
    test: (r) =>
      r.towerName === "Program Management" ||
      r.towerName === "Change Management",
    roleType: "governance",
  },
  {
    description:
      'Role name mentions PMO/Governance/Compliance -> governance',
    test: (r) => /\b(PMO|Governance|Compliance)\b/i.test(r.roleName),
    roleType: "governance",
  },
  {
    description: "Managed Services or Operations tower -> operations",
    test: (r) =>
      r.towerName === "Managed Services" || r.towerName === "Operations",
    roleType: "operations",
  },
  {
    description: "Industry SMEs tower -> functional",
    test: (r) => r.towerName === "Industry SMEs",
    roleType: "functional",
  },
  {
    description:
      "Role name mentions Client/Relationship/Account -> client",
    test: (r) => /\b(Client|Relationship|Account)\b/i.test(r.roleName),
    roleType: "client",
  },
];
function classifyRoleType(r: RoleTypeContext): RoleType {
  for (const rule of ROLE_TYPE_RULES) {
    if (rule.test(r)) return rule.roleType;
  }
  return "delivery";
}

// ---------------------------------------------------------------------------
// Role normalization — collapses the exact brief §4.2 anti-pattern found in
// the seed data: a canonical role split into multiple rows by a seniority
// prefix in the *name* (e.g. "Lead Data Engineer" / "Senior Data Engineer" /
// "Data Engineer" all under the same tower+capability), rather than one
// canonical role with an allowed-level range. Found by scanning all 321 seed
// roles for name-prefix collisions within the same (tower, capability) group
// during PR1 authoring; verified against the `Role Rate Card` sheet to
// confirm no rate data is lost by the collapse (see rationale per entry).
//
// This is a reviewable, explicit constant — not fuzzy runtime string
// matching — precisely so a reviewer can see and challenge each merge
// decision individually.
// ---------------------------------------------------------------------------
interface RoleMerge {
  canonicalRoleCode: string;
  canonicalName: string;
  mergedAway: Array<{ roleCode: string; name: string }>;
  rationale: string;
}
const ROLE_NORMALIZATION_MERGES: readonly RoleMerge[] = [
  {
    canonicalRoleCode: "ROL-037",
    canonicalName: "Data Engineer",
    mergedAway: [
      { roleCode: "ROL-035", name: "Lead Data Engineer" },
      { roleCode: "ROL-036", name: "Senior Data Engineer" },
    ],
    rationale:
      'Seed modeled "Data Engineer" as three role rows split by a seniority ' +
      'prefix in the name (Lead Data Engineer, Senior Data Engineer, Data ' +
      "Engineer), all under Data & Analytics / Data Engineering — the exact " +
      "brief §4.2 anti-pattern. Collapsed to the base/unmodified name " +
      "(ROL-037) with an allowed-level range spanning the union of all three " +
      "(Intermediate .. Senior Manager). The two modifier-prefixed names " +
      "become role aliases. All three source rows carried the same scarcity " +
      'tier (High), so no rate conflict; the "Senior Data Engineer" Role ' +
      "Rate Card row at the Senior level (RC-0104) duplicates the canonical " +
      "row's own Senior-level row (RC-0105, identical value) and is dropped " +
      "as a redundant duplicate, not a data loss.",
  },
  {
    canonicalRoleCode: "ROL-193",
    canonicalName: "Data Scientist",
    mergedAway: [{ roleCode: "ROL-194", name: "Senior Data Scientist" }],
    rationale:
      '"Senior Data Scientist" (Senior .. Lead) is a strict sub-range of ' +
      '"Data Scientist" (Intermediate .. Senior Manager) under the same ' +
      "tower+capability (AI & GenAI / Machine Learning) — same seniority-" +
      "prefix anti-pattern. Collapsed to ROL-193; both source rows carried " +
      "scarcity tier High, so the merged-away role's Lead/Senior Role Rate " +
      "Card rows (RC-0543, RC-0544) duplicate the canonical role's own " +
      "rows at those levels (RC-0540, RC-0541, identical value) and are " +
      "dropped as redundant duplicates.",
  },
  {
    canonicalRoleCode: "ROL-080",
    canonicalName: "Software Engineer",
    mergedAway: [{ roleCode: "ROL-079", name: "Senior Software Engineer" }],
    rationale:
      '"Senior Software Engineer" (Senior .. Senior) duplicates a level ' +
      'already inside "Software Engineer" (Intermediate .. Senior) under ' +
      "the same tower+capability (Application Engineering / Backend " +
      "Engineering). Collapsed to ROL-080. UNLIKE the other two merges, the " +
      "merged-away role carried a *different* scarcity tier (High) than the " +
      "canonical role (Medium) at the overlapping Senior level. Policy " +
      "applied uniformly across all three merges: the base/unmodified " +
      "name's own declared scarcity tier is canonical, so Medium wins here. " +
      "The merged-away role's Senior-level Role Rate Card row (RC-0215, " +
      "priced at the High tier) is dropped as superseded by normalization — " +
      "not silently averaged, not silently duplicated alongside the " +
      "canonical Medium-tier row for the same role+level.",
  },
];

/** Role Rate Card rows dropped as redundant/superseded duplicates created by
 * the merges above — see each merge's rationale for why. Cross-referenced
 * against the merges: every code here belongs to a `mergedAway` role in
 * `ROLE_NORMALIZATION_MERGES` at a level the canonical role's own rows
 * already cover. */
const DROPPED_RATE_CARD_ROW_CODES = new Set([
  "RC-0104", // "Senior Data Engineer" @ Senior — dup of RC-0105 ("Data Engineer" @ Senior)
  "RC-0543", // "Senior Data Scientist" @ Lead — dup of RC-0540 ("Data Scientist" @ Lead)
  "RC-0544", // "Senior Data Scientist" @ Senior — dup of RC-0541 ("Data Scientist" @ Senior)
  "RC-0215", // "Senior Software Engineer" @ Senior (High tier) — superseded by RC-0216 (Medium tier, canonical)
]);

/** The seed workbook has exactly one genuine same-name-different-role
 * collision: "Automation Engineer" appears twice as two legitimately
 * distinct canonical roles (different tower+capability), not a normalization
 * anti-pattern. We do NOT merge these — they are different jobs that happen
 * to share a display name — but we add a disambiguating alias to each so a
 * plain-text lookup of "Automation Engineer" alone is flagged ambiguous by
 * the coverage validator (by design) while a qualified label resolves
 * cleanly. This is also the demonstration case for the alias mechanism
 * itself, per the PR1 execution prompt.
 */
const HAND_AUTHORED_DISAMBIGUATION_ALIASES: ReadonlyArray<{
  roleCode: string;
  aliasLabel: string;
}> = [
  { roleCode: "ROL-020", aliasLabel: "Business Process Automation Engineer" },
  { roleCode: "ROL-120", aliasLabel: "QE Automation Engineer" },
];

// ---------------------------------------------------------------------------
// Tower coverage reconciliation — brief §4.3's 20 required tower topics vs.
// the seed's 21 towers. See the PR1 execution prompt for the reconciliation
// policy. `fold` entries add hand-authored capabilities/roles to an existing
// seed tower rather than minting a new tower (per policy: prefer folding when
// the seed tower already substantially covers the topic).
// ---------------------------------------------------------------------------
interface TowerReconciliationEntry {
  briefTopicNumber: number;
  briefTopicLabel: string;
  seedTowers: string[];
  mappingType: "clean" | "partial" | "fold_subscope";
  notes: string;
}
const TOWER_RECONCILIATION: readonly TowerReconciliationEntry[] = [
  {
    briefTopicNumber: 1,
    briefTopicLabel:
      "Enterprise Strategy, Architecture & Technology Management",
    seedTowers: ["Strategy & Transformation", "Enterprise Architecture"],
    mappingType: "clean",
    notes: "Split cleanly across two seed towers; no additions needed.",
  },
  {
    briefTopicNumber: 2,
    briefTopicLabel: "Product Management, Process Design & Business Analysis",
    seedTowers: ["Product Management", "Business Process"],
    mappingType: "clean",
    notes: "Split cleanly across two seed towers; no additions needed.",
  },
  {
    briefTopicNumber: 3,
    briefTopicLabel: "AI, GenAI, Agentic AI, MLOps & Responsible AI",
    seedTowers: ["AI & GenAI"],
    mappingType: "clean",
    notes: "Direct 1:1 match.",
  },
  {
    briefTopicNumber: 4,
    briefTopicLabel:
      "Data Strategy, Architecture, Engineering, Governance, BI, MDM & Platforms",
    seedTowers: ["Data & Analytics"],
    mappingType: "clean",
    notes: "Direct 1:1 match.",
  },
  {
    briefTopicNumber: 5,
    briefTopicLabel:
      "Application Engineering — Java, .NET, Python, web, mobile, packaged and low-code",
    seedTowers: ["Application Engineering"],
    mappingType: "clean",
    notes: "Direct 1:1 match; language-specific capabilities present (Java, .NET, Python engineering).",
  },
  {
    briefTopicNumber: 6,
    briefTopicLabel: "Integration, API, Event, EDI & Middleware",
    seedTowers: ["Integration"],
    mappingType: "clean",
    notes: "Direct 1:1 match.",
  },
  {
    briefTopicNumber: 7,
    briefTopicLabel:
      "ERP & Enterprise Platforms — SAP, Oracle, Workday, ServiceNow, Salesforce",
    seedTowers: ["ERP", "Application Engineering"],
    mappingType: "clean",
    notes:
      "SAP/Oracle/Workday under ERP tower; ServiceNow/Salesforce capabilities are filed under Application Engineering in the seed (platform engineering, not functional ERP) — noted, not moved.",
  },
  {
    briefTopicNumber: 8,
    briefTopicLabel: "Digital Experience, Content, MarTech & Commerce",
    seedTowers: ["Digital Experience", "Marketing Technology"],
    mappingType: "clean",
    notes: "Split cleanly across two seed towers; no additions needed.",
  },
  {
    briefTopicNumber: 9,
    briefTopicLabel:
      "Cloud, Platform Engineering, Containers, DevSecOps & SRE",
    seedTowers: ["Cloud"],
    mappingType: "clean",
    notes: "Direct 1:1 match (Kubernetes, IaC, DevOps, SRE capabilities present).",
  },
  {
    briefTopicNumber: 10,
    briefTopicLabel:
      "Infrastructure, Network, Telecom, Storage, Backup & Disaster Recovery",
    seedTowers: ["Infrastructure"],
    mappingType: "partial",
    notes:
      "Network/Storage/Compute/Identity capabilities present; telecom and backup/DR are not individually broken out as separate capabilities. Not in this build's explicit hand-author list (only topics 15/16/20 were called out) — accepted as adequate coverage, flagged for a future PR to consider a dedicated Backup & DR capability if it matters to the effort model.",
  },
  {
    briefTopicNumber: 11,
    briefTopicLabel: "Database, Middleware & Platform Operations",
    seedTowers: ["Operations", "Integration"],
    mappingType: "partial",
    notes:
      "Service Operations/Monitoring/SRE under Operations; ESB/Middleware under Integration. No dedicated DBA/database-administration capability exists in the seed. Not in this build's explicit hand-author list — accepted as adequate, flagged for future consideration.",
  },
  {
    briefTopicNumber: 12,
    briefTopicLabel:
      "Legacy & Mainframe — z/OS, COBOL, CICS, IMS, DB2, MQ, batch, RACF and modernization",
    seedTowers: ["Legacy & Mainframe"],
    mappingType: "clean",
    notes:
      "Mainframe/COBOL/DB2/z/OS capabilities present at a coarser grain than the brief's list (no separate CICS/IMS/MQ/RACF/batch capabilities) — accepted, capability grain is coarser by design across this taxonomy.",
  },
  {
    briefTopicNumber: 13,
    briefTopicLabel:
      "Cybersecurity, IAM, SOC, AppSec, Cloud Security, GRC, Privacy & Resilience",
    seedTowers: ["Cybersecurity"],
    mappingType: "clean",
    notes: "Direct 1:1 match (IAM, SOC, GRC, AppSec, Threat & Vuln, Zero Trust capabilities present).",
  },
  {
    briefTopicNumber: 14,
    briefTopicLabel:
      "Quality Engineering, Functional, Automation, Performance, Security and Data Testing",
    seedTowers: ["Quality Engineering"],
    mappingType: "clean",
    notes: "Direct 1:1 match.",
  },
  {
    briefTopicNumber: 15,
    briefTopicLabel:
      "ITSM, Service Delivery, NOC, Observability, Incident, Problem, Change and Capacity",
    seedTowers: ["Operations"],
    mappingType: "fold_subscope",
    notes:
      "Operations tower already covers Service Operations/Monitoring & Observability/Site Reliability, but has no ITSM practice-level capability (service desk, incident/problem/change/capacity management as a governed discipline). Note: the seed's \"ServiceNow ITSM\" capability (CAP-115) is filed under Application Engineering and is about *engineering/configuring* the ServiceNow platform, not the operational ITSM practice — a real but distinct thing, not double-counted here. Folded as a documented sub-scope of Operations with 3 hand-authored capabilities (CAP-143 ITSM & Service Delivery, CAP-144 Incident & Problem Management, CAP-145 Capacity & Availability Management) and 3 hand-authored roles, tagged source_artifact hand-authored-pr1.",
  },
  {
    briefTopicNumber: 16,
    briefTopicLabel:
      "End-User Computing, Workplace, Collaboration and Field Support",
    seedTowers: ["Infrastructure"],
    mappingType: "fold_subscope",
    notes:
      'Infrastructure tower has a narrow "End-User Compute" capability (CAP-076, device/compute only) but no Workplace/Collaboration or Field Support capability. Folded as a documented sub-scope of Infrastructure with 2 hand-authored capabilities (CAP-146 Workplace & Collaboration, CAP-147 Field Support & Deskside) and 3 hand-authored roles, tagged source_artifact hand-authored-pr1.',
  },
  {
    briefTopicNumber: 17,
    briefTopicLabel:
      "Change, Adoption, Communications, Organization Design and Training",
    seedTowers: ["Change Management"],
    mappingType: "clean",
    notes:
      "Organizational Change/Training/Communications/Adoption capabilities present; Organization Design is not separately broken out but is closely adjacent to Organizational Change — accepted, not flagged for hand-authoring.",
  },
  {
    briefTopicNumber: 18,
    briefTopicLabel:
      "Program, Portfolio, PMO, Governance, Finance, Commercial, Sourcing and Vendor Management",
    seedTowers: ["Program Management"],
    mappingType: "partial",
    notes:
      "PMO/Program Delivery/Agile Delivery capabilities present; Finance/Commercial/Sourcing/Vendor Management sub-topics are not individually broken out as separate capabilities. Not in this build's explicit hand-author list (only 15/16/20 were called out) — accepted as adequate practice-level coverage.",
  },
  {
    briefTopicNumber: 19,
    briefTopicLabel: "Industry / Functional SMEs and Process Transformation",
    seedTowers: ["Industry SMEs", "Business Process"],
    mappingType: "clean",
    notes: "Split cleanly across two seed towers; no additions needed.",
  },
  {
    briefTopicNumber: 20,
    briefTopicLabel:
      "FinOps, TBM, Value Management and Benefits Realization",
    seedTowers: ["Program Management"],
    mappingType: "fold_subscope",
    notes:
      'No seed tower distinctly covers enterprise Technology Business Management / Value Management / Benefits Realization. The seed\'s "FinOps" capability (CAP-126) is filed under Cloud and is narrowly about cloud cost-optimization engineering tactics, not enterprise TBM/value governance — a real but distinct thing, not double-counted here. The seed\'s "Business Case" *workbook sheet* (not a taxonomy tower/capability sheet — it is a small traditional-vs-AI-native ROI calculator) and the Program Management tower\'s existing PMO/Program Delivery capabilities were checked for partial overlap; Program Management is the closest practice home for delivery-spend governance. Folded as a documented sub-scope of Program Management with 3 hand-authored capabilities (CAP-140 Technology Business Management (TBM) & FinOps Governance, CAP-141 Value Management, CAP-142 Benefits Realization) and 3 hand-authored roles, tagged source_artifact hand-authored-pr1.',
  },
];

// ---------------------------------------------------------------------------
// Hand-authored additions (source_artifact: "hand-authored-pr1" — never
// attributed to the seed workbook). Capabilities/roles here fill the three
// brief topics (15, 16, 20) where the seed has no reasonable existing tower
// match, per the reconciliation table above. Rates for these roles are
// computed with the *same* disclosed Internal-Cost-Model/Assumptions formula
// engine the seed workbook itself uses (see header comment) — not fabricated
// — because the workbook simply has no Role Rate Card rows for roles it
// doesn't define.
// ---------------------------------------------------------------------------
interface HandAuthoredCapability {
  capabilityCode: string;
  towerName: string;
  capabilityName: string;
  scarcity: "High" | "Medium" | "Low";
  agentAmenability: number;
  briefTopicNumber: number;
}
const HAND_AUTHORED_CAPABILITIES: readonly HandAuthoredCapability[] = [
  {
    capabilityCode: "CAP-140",
    towerName: "Program Management",
    capabilityName: "Technology Business Management (TBM) & FinOps Governance",
    scarcity: "Medium",
    agentAmenability: 3,
    briefTopicNumber: 20,
  },
  {
    capabilityCode: "CAP-141",
    towerName: "Program Management",
    capabilityName: "Value Management",
    scarcity: "Medium",
    agentAmenability: 3,
    briefTopicNumber: 20,
  },
  {
    capabilityCode: "CAP-142",
    towerName: "Program Management",
    capabilityName: "Benefits Realization",
    scarcity: "Medium",
    agentAmenability: 3,
    briefTopicNumber: 20,
  },
  {
    capabilityCode: "CAP-143",
    towerName: "Operations",
    capabilityName: "ITSM & Service Delivery",
    scarcity: "Low",
    agentAmenability: 4,
    briefTopicNumber: 15,
  },
  {
    capabilityCode: "CAP-144",
    towerName: "Operations",
    capabilityName: "Incident & Problem Management",
    scarcity: "Medium",
    agentAmenability: 4,
    briefTopicNumber: 15,
  },
  {
    capabilityCode: "CAP-145",
    towerName: "Operations",
    capabilityName: "Capacity & Availability Management",
    scarcity: "Medium",
    agentAmenability: 4,
    briefTopicNumber: 15,
  },
  {
    capabilityCode: "CAP-146",
    towerName: "Infrastructure",
    capabilityName: "Workplace & Collaboration",
    scarcity: "Low",
    agentAmenability: 4,
    briefTopicNumber: 16,
  },
  {
    capabilityCode: "CAP-147",
    towerName: "Infrastructure",
    capabilityName: "Field Support & Deskside",
    scarcity: "Low",
    agentAmenability: 3,
    briefTopicNumber: 16,
  },
];

interface HandAuthoredRole {
  roleCode: string;
  towerName: string;
  roleName: string;
  capabilityCode: string;
  scarcity: "High" | "Medium" | "Low";
  minLevel: string;
  maxLevel: string;
}
const HAND_AUTHORED_ROLES: readonly HandAuthoredRole[] = [
  {
    roleCode: "ROL-322",
    towerName: "Program Management",
    roleName: "TBM & FinOps Governance Lead",
    capabilityCode: "CAP-140",
    scarcity: "Medium",
    minLevel: "Senior Manager",
    maxLevel: "Director",
  },
  {
    roleCode: "ROL-323",
    towerName: "Program Management",
    roleName: "Value Management Manager",
    capabilityCode: "CAP-141",
    scarcity: "Medium",
    minLevel: "Manager",
    maxLevel: "Senior Manager",
  },
  {
    roleCode: "ROL-324",
    towerName: "Program Management",
    roleName: "Benefits Realization Lead",
    capabilityCode: "CAP-142",
    scarcity: "Medium",
    minLevel: "Manager",
    maxLevel: "Director",
  },
  {
    roleCode: "ROL-325",
    towerName: "Operations",
    roleName: "ITSM Service Delivery Manager",
    capabilityCode: "CAP-143",
    scarcity: "Low",
    minLevel: "Manager",
    maxLevel: "Director",
  },
  {
    roleCode: "ROL-326",
    towerName: "Operations",
    roleName: "Incident & Problem Manager",
    capabilityCode: "CAP-144",
    scarcity: "Medium",
    minLevel: "Manager",
    maxLevel: "Senior Manager",
  },
  {
    roleCode: "ROL-327",
    towerName: "Operations",
    roleName: "Capacity & Availability Manager",
    capabilityCode: "CAP-145",
    scarcity: "Medium",
    minLevel: "Manager",
    maxLevel: "Senior Manager",
  },
  {
    roleCode: "ROL-328",
    towerName: "Infrastructure",
    roleName: "Workplace & Collaboration Lead",
    capabilityCode: "CAP-146",
    scarcity: "Low",
    minLevel: "Manager",
    maxLevel: "Senior Manager",
  },
  {
    roleCode: "ROL-329",
    towerName: "Infrastructure",
    roleName: "Field Support Engineer",
    capabilityCode: "CAP-147",
    scarcity: "Low",
    minLevel: "Intermediate",
    maxLevel: "Senior",
  },
  {
    roleCode: "ROL-330",
    towerName: "Infrastructure",
    roleName: "Deskside Support Lead",
    capabilityCode: "CAP-147",
    scarcity: "Low",
    minLevel: "Senior",
    maxLevel: "Manager",
  },
];

// ---------------------------------------------------------------------------
// Workbook reading
// ---------------------------------------------------------------------------
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && !(value instanceof Date)) {
    // Formula cell without a cached result, or rich text — not expected for
    // the literal columns this script reads. Surface loudly.
    if ("richText" in (value as unknown as Record<string, unknown>)) {
      return (value as unknown as { richText: Array<{ text: string }> }).richText
        .map((r) => r.text)
        .join("");
    }
    throw new Error(
      `Expected a literal cell value, got object: ${JSON.stringify(value)}`,
    );
  }
  return String(value).trim();
}
function cellNumber(value: ExcelJS.CellValue): number {
  if (typeof value === "number") return value;
  const text = cellText(value);
  const n = Number(text);
  if (Number.isNaN(n)) {
    throw new Error(`Expected a numeric cell value, got "${text}"`);
  }
  return n;
}

interface SheetRow {
  rowNumber: number;
  cells: string[]; // column B onward, 0-indexed (cells[0] === column B)
}
function readRows(worksheet: ExcelJS.Worksheet): SheetRow[] {
  const rows: SheetRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    const cells: string[] = [];
    // Column B is index 2 in ExcelJS (1-indexed, column A is 1).
    for (let col = 2; col <= 11; col++) {
      const cell = row.getCell(col);
      let text: string;
      try {
        text = cellText(cell.value);
      } catch {
        // Formula cell with no cached result (expected on Roles/Role Rate
        // Card priced columns) — record as empty; those columns are never
        // read as literal data by this script.
        text = "";
      }
      cells.push(text);
    }
    rows.push({ rowNumber, cells });
  });
  return rows;
}

async function loadWorkbook(sourcePath: string): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(sourcePath);
  return wb;
}

function sheet(wb: ExcelJS.Workbook, name: string): ExcelJS.Worksheet {
  const ws = wb.getWorksheet(name);
  if (!ws) throw new Error(`Source workbook is missing sheet "${name}"`);
  return ws;
}

// --- Assumptions sheet: literal inputs, extracted by label match (not fixed
// cell coordinates), so the script tolerates row-shift in the source file. ---
interface AssumptionsData {
  totalLoadFactor: number;
  billableHours: number;
  scarcityMultipliers: Record<string, number>; // "High" | "Medium" | "Low" -> multiplier
  providerTiers: Array<{
    code: string;
    multiplier: number;
    archetype: string;
    sourceRow: number;
  }>;
  marketBaseByLevel: Record<string, { baseBillRate: number; baseSalary: number }>;
}
const LOAD_FACTOR_COMPONENT_LABELS = [
  "Bonus",
  "Equity",
  "Benefits",
  "Payroll Taxes",
  "401k Match",
  "Recruiting",
  "Training",
  "Bench / Utilization",
  "Facilities",
  "Technology Allocation",
  "Corporate Allocation",
  "Administrative Allocation",
  "Travel Allocation",
];
const SCARCITY_TIERS = ["High", "Medium", "Low"];
function readAssumptions(wb: ExcelJS.Workbook): AssumptionsData {
  const rows = readRows(sheet(wb, "Assumptions"));
  let totalLoadFactor = 0;
  let foundComponents = 0;
  let billableHours: number | null = null;
  const scarcityMultipliers: Record<string, number> = {};
  const providerTiers: AssumptionsData["providerTiers"] = [];
  const marketBaseByLevel: AssumptionsData["marketBaseByLevel"] = {};

  for (const row of rows) {
    const [b, c, , , f] = row.cells; // b=col B, c=col C, f=col F
    if (LOAD_FACTOR_COMPONENT_LABELS.includes(b) && c !== "") {
      totalLoadFactor += cellNumber(c);
      foundComponents++;
    } else if (b === "Billable hours / year" && c !== "") {
      billableHours = cellNumber(c);
    } else if (SCARCITY_TIERS.includes(b) && c !== "") {
      scarcityMultipliers[b] = cellNumber(c);
    } else if (/^[A-Z]+-[A-Z0-9]+$/.test(b) && c !== "" && f !== "") {
      providerTiers.push({
        code: b,
        multiplier: cellNumber(c),
        archetype: f,
        sourceRow: row.rowNumber,
      });
    } else if (
      LEVEL_NAMES_EXPECTED.includes(b as LevelName) &&
      c !== "" &&
      row.cells[2] !== "" // column D (base salary), cells[2] = D
    ) {
      marketBaseByLevel[b] = {
        baseBillRate: cellNumber(c),
        baseSalary: cellNumber(row.cells[2]),
      };
    }
  }

  if (foundComponents !== LOAD_FACTOR_COMPONENT_LABELS.length) {
    throw new Error(
      `Assumptions sheet: expected ${LOAD_FACTOR_COMPONENT_LABELS.length} load-factor components, found ${foundComponents}`,
    );
  }
  if (billableHours === null) {
    throw new Error('Assumptions sheet: "Billable hours / year" not found');
  }
  for (const tier of SCARCITY_TIERS) {
    if (scarcityMultipliers[tier] === undefined) {
      throw new Error(`Assumptions sheet: scarcity multiplier for "${tier}" not found`);
    }
  }
  if (providerTiers.length === 0) {
    throw new Error("Assumptions sheet: no provider-tier multipliers found");
  }
  if (!providerTiers.some((t) => t.code === "SI-T1")) {
    throw new Error('Assumptions sheet: expected provider tier "SI-T1" not found');
  }
  for (const level of LEVEL_NAMES_EXPECTED) {
    if (!marketBaseByLevel[level]) {
      throw new Error(`Assumptions sheet: market-base bill rate for level "${level}" not found`);
    }
  }

  return {
    totalLoadFactor,
    billableHours,
    scarcityMultipliers,
    providerTiers,
    marketBaseByLevel,
  };
}

function loadedHourlyByLevel(a: AssumptionsData): Record<string, number> {
  const out: Record<string, number> = {};
  for (const level of LEVEL_NAMES_EXPECTED) {
    const baseSalary = a.marketBaseByLevel[level].baseSalary;
    out[level] = (baseSalary * (1 + a.totalLoadFactor)) / a.billableHours;
  }
  return out;
}

// --- Career Levels sheet ---
interface SeniorityLevelSeed {
  levelName: string;
  yearsExp: string;
  expectation: string;
  sourceRow: number;
}
function readCareerLevels(wb: ExcelJS.Workbook): SeniorityLevelSeed[] {
  const rows = readRows(sheet(wb, "Career Levels"));
  const out: SeniorityLevelSeed[] = [];
  for (const row of rows) {
    const [b, c, , e] = row.cells; // b=Level, c=Years Exp, d=Base Salary(unused/empty), e=Expectation
    if (LEVEL_NAMES_EXPECTED.includes(b as LevelName)) {
      out.push({ levelName: b, yearsExp: c, expectation: e, sourceRow: row.rowNumber });
    }
  }
  const foundOrder = out.map((l) => l.levelName);
  if (JSON.stringify(foundOrder) !== JSON.stringify(LEVEL_NAMES_EXPECTED)) {
    throw new Error(
      `Career Levels sheet order/membership drifted from expected. Expected ${JSON.stringify(
        LEVEL_NAMES_EXPECTED,
      )}, found ${JSON.stringify(foundOrder)}`,
    );
  }
  return out;
}

// --- Towers sheet ---
interface TowerSeed {
  towerCode: string;
  towerName: string;
  scope: string;
  sourceRow: number;
}
function readTowers(wb: ExcelJS.Workbook): TowerSeed[] {
  const rows = readRows(sheet(wb, "Towers"));
  const out: TowerSeed[] = [];
  for (const row of rows) {
    const [b, c, d] = row.cells;
    if (/^TWR-\d+$/.test(b)) {
      out.push({ towerCode: b, towerName: c, scope: d, sourceRow: row.rowNumber });
    }
  }
  return out;
}

// --- Capabilities sheet ---
interface CapabilitySeed {
  capabilityCode: string;
  towerName: string;
  capabilityName: string;
  scarcity: string;
  agentAmenability: number;
  sourceRow: number;
}
function readCapabilities(wb: ExcelJS.Workbook): CapabilitySeed[] {
  const rows = readRows(sheet(wb, "Capabilities"));
  const out: CapabilitySeed[] = [];
  for (const row of rows) {
    const [b, c, d, e, f] = row.cells;
    if (/^CAP-\d+$/.test(b)) {
      out.push({
        capabilityCode: b,
        towerName: c,
        capabilityName: d,
        scarcity: e,
        agentAmenability: cellNumber(f),
        sourceRow: row.rowNumber,
      });
    }
  }
  return out;
}

// --- Roles sheet ---
interface RoleSeed {
  roleCode: string;
  towerName: string;
  roleName: string;
  capabilityName: string;
  scarcity: string;
  minLevel: string;
  maxLevel: string;
  sourceRow: number;
}
function readRoles(wb: ExcelJS.Workbook): RoleSeed[] {
  const rows = readRows(sheet(wb, "Roles"));
  const out: RoleSeed[] = [];
  for (const row of rows) {
    const [b, c, d, e, f, g, h] = row.cells;
    if (/^ROL-\d+$/.test(b)) {
      out.push({
        roleCode: b,
        towerName: c,
        roleName: d,
        capabilityName: e,
        scarcity: f,
        minLevel: g,
        maxLevel: h,
        sourceRow: row.rowNumber,
      });
    }
  }
  return out;
}

// --- Role Rate Card sheet ---
interface RateCardSeed {
  rcCode: string;
  towerName: string;
  roleName: string;
  capabilityName: string;
  level: string;
  scarcity: string;
  sourceRow: number;
}
function readRoleRateCard(wb: ExcelJS.Workbook): RateCardSeed[] {
  const rows = readRows(sheet(wb, "Role Rate Card"));
  const out: RateCardSeed[] = [];
  for (const row of rows) {
    const [b, c, d, e, f, g] = row.cells;
    if (/^RC-\d+$/.test(b)) {
      out.push({
        rcCode: b,
        towerName: c,
        roleName: d,
        capabilityName: e,
        level: f,
        scarcity: g,
        sourceRow: row.rowNumber,
      });
    }
  }
  return out;
}

// --- Geography sheet ---
interface GeographySeed {
  region: string;
  shore: string;
  salaryMult: number;
  rateMult: number;
  scarcityMult: number;
  costOfLiving: number;
  sourceRow: number;
}
const SHORE_CATEGORIES = ["Onshore", "Nearshore", "Offshore"];
function readGeography(wb: ExcelJS.Workbook): GeographySeed[] {
  const rows = readRows(sheet(wb, "Geography"));
  const out: GeographySeed[] = [];
  for (const row of rows) {
    const [b, c, d, e, f, g] = row.cells;
    if (b !== "" && SHORE_CATEGORIES.includes(c)) {
      out.push({
        region: b,
        shore: c,
        salaryMult: cellNumber(d),
        rateMult: cellNumber(e),
        scarcityMult: cellNumber(f),
        costOfLiving: cellNumber(g),
        sourceRow: row.rowNumber,
      });
    }
  }
  return out;
}

function slugify(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const sourcePath =
    process.argv[2] ?? process.env.PRICING_TAXONOMY_SOURCE_XLSX;
  if (!sourcePath) {
    console.error(
      "Usage: npx tsx scripts/pricing/convert-workbook-to-reference-pack.ts <path-to-xlsx>\n" +
        "   or: PRICING_TAXONOMY_SOURCE_XLSX=/path/to.xlsx npx tsx scripts/pricing/convert-workbook-to-reference-pack.ts",
    );
    process.exit(1);
  }
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source workbook not found: ${sourcePath}`);
    process.exit(1);
  }

  const sourceSha256 = sha256File(sourcePath);
  const wb = await loadWorkbook(sourcePath);

  const assumptions = readAssumptions(wb);
  const loadedHourly = loadedHourlyByLevel(assumptions);
  const seedLevels = readCareerLevels(wb);
  const seedTowers = readTowers(wb);
  const seedCapabilities = readCapabilities(wb);
  const seedRoles = readRoles(wb);
  const seedRateCard = readRoleRateCard(wb);
  const geography = readGeography(wb);

  const siT1 = assumptions.providerTiers.find((t) => t.code === "SI-T1")!;

  // --- pricing_seniority_levels.csv ---
  const seniorityLevelRows = seedLevels.map((l, i) => ({
    level_code: levelCode(l.levelName),
    level_name: l.levelName,
    rank: i + 1,
    years_exp: l.yearsExp,
    expectation: l.expectation,
    source_artifact: "Workforce_Taxonomy_Master.xlsx:Career Levels",
    source_row: l.sourceRow,
    status: "active",
    version: 1,
  }));

  // --- pricing_towers.csv ---
  const towerNameToCode = new Map(seedTowers.map((t) => [t.towerName, t.towerCode]));
  const towerRows = seedTowers
    .map((t) => ({
      tower_code: t.towerCode,
      tower_name: t.towerName,
      scope: t.scope,
      source_artifact: "Workforce_Taxonomy_Master.xlsx:Towers",
      source_row: t.sourceRow,
      source_label: t.towerName,
      status: "active",
      version: 1,
    }))
    .sort((a, b) => a.tower_code.localeCompare(b.tower_code));

  // --- pricing_capabilities.csv ---
  type CapabilityOut = {
    capability_code: string;
    tower_code: string;
    capability_name: string;
    scarcity_tier: string;
    agent_amenability: number;
    source_artifact: string;
    source_row: number | "";
    source_label: string;
    status: string;
    version: number;
  };
  const seedCapabilityRows: CapabilityOut[] = seedCapabilities.map((c) => {
    const towerCode = towerNameToCode.get(c.towerName);
    if (!towerCode) {
      throw new Error(`Capability ${c.capabilityCode} references unknown tower "${c.towerName}"`);
    }
    return {
      capability_code: c.capabilityCode,
      tower_code: towerCode,
      capability_name: c.capabilityName,
      scarcity_tier: c.scarcity,
      agent_amenability: c.agentAmenability,
      source_artifact: "Workforce_Taxonomy_Master.xlsx:Capabilities",
      source_row: c.sourceRow,
      source_label: c.capabilityName,
      status: "active",
      version: 1,
    };
  });
  const handAuthoredCapabilityRows: CapabilityOut[] = HAND_AUTHORED_CAPABILITIES.map((c) => {
    const towerCode = towerNameToCode.get(c.towerName);
    if (!towerCode) {
      throw new Error(`Hand-authored capability ${c.capabilityCode} references unknown tower "${c.towerName}"`);
    }
    return {
      capability_code: c.capabilityCode,
      tower_code: towerCode,
      capability_name: c.capabilityName,
      scarcity_tier: c.scarcity,
      agent_amenability: c.agentAmenability,
      source_artifact: "hand-authored-pr1",
      source_row: "",
      source_label: `Fold of brief topic ${c.briefTopicNumber} — see manifest tower_reconciliation`,
      status: "active",
      version: 1,
    };
  });
  const capabilityRows = [...seedCapabilityRows, ...handAuthoredCapabilityRows].sort((a, b) =>
    a.capability_code.localeCompare(b.capability_code),
  );
  const capabilityCodeByTowerAndName = new Map<string, string>();
  for (const c of capabilityRows) {
    capabilityCodeByTowerAndName.set(`${c.tower_code}::${c.capability_name}`, c.capability_code);
  }
  // Also index seed capabilities by (towerName, capabilityName) for role resolution.
  const capabilityCodeBySeedKey = new Map<string, string>();
  for (const c of seedCapabilities) {
    capabilityCodeBySeedKey.set(`${c.towerName}::${c.capabilityName}`, c.capabilityCode);
  }
  for (const c of HAND_AUTHORED_CAPABILITIES) {
    capabilityCodeBySeedKey.set(`${c.towerName}::${c.capabilityName}`, c.capabilityCode);
  }

  // --- Role merge resolution: seed (tower,role,cap) -> canonical role code ---
  const mergedAwayCodes = new Set<string>();
  const roleCodeOverride = new Map<string, string>(); // mergedAwayCode -> canonicalCode
  for (const merge of ROLE_NORMALIZATION_MERGES) {
    for (const away of merge.mergedAway) {
      mergedAwayCodes.add(away.roleCode);
      roleCodeOverride.set(away.roleCode, merge.canonicalRoleCode);
    }
  }

  // --- pricing_roles.csv ---
  type RoleOut = {
    role_code: string;
    canonical_name: string;
    tower_code: string;
    capability_code: string;
    role_type: RoleType;
    allowed_level_min: string;
    allowed_level_max: string;
    internal_external_default: string;
    billable_default: string;
    source_artifact: string;
    source_row: number | "";
    source_label: string;
    status: string;
    version: number;
  };
  const survivingSeedRoles = seedRoles.filter((r) => !mergedAwayCodes.has(r.roleCode));
  const roleOutBase = new Map<string, RoleOut & { minLevel: string; maxLevel: string }>();

  for (const r of survivingSeedRoles) {
    const towerCode = towerNameToCode.get(r.towerName);
    if (!towerCode) throw new Error(`Role ${r.roleCode} references unknown tower "${r.towerName}"`);
    const capabilityCode = capabilityCodeBySeedKey.get(`${r.towerName}::${r.capabilityName}`);
    if (!capabilityCode) {
      throw new Error(
        `Role ${r.roleCode} references unknown capability "${r.capabilityName}" under tower "${r.towerName}"`,
      );
    }
    let minLevel = r.minLevel;
    let maxLevel = r.maxLevel;
    // If this role absorbed merged-away roles, expand the range to the union.
    const absorbing = ROLE_NORMALIZATION_MERGES.find((m) => m.canonicalRoleCode === r.roleCode);
    if (absorbing) {
      const mergedAwaySeedRows = seedRoles.filter((sr) =>
        absorbing.mergedAway.some((a) => a.roleCode === sr.roleCode),
      );
      for (const away of mergedAwaySeedRows) {
        if (levelRank(away.minLevel) > levelRank(minLevel)) minLevel = away.minLevel;
        if (levelRank(away.maxLevel) < levelRank(maxLevel)) maxLevel = away.maxLevel;
      }
    }
    roleOutBase.set(r.roleCode, {
      role_code: r.roleCode,
      canonical_name: r.roleName,
      tower_code: towerCode,
      capability_code: capabilityCode,
      role_type: classifyRoleType({
        towerName: r.towerName,
        roleName: r.roleName,
        capabilityName: r.capabilityName,
      }),
      allowed_level_min: minLevel,
      allowed_level_max: maxLevel,
      internal_external_default: "internal",
      billable_default: "true",
      source_artifact: "Workforce_Taxonomy_Master.xlsx:Roles",
      source_row: r.sourceRow,
      source_label: r.roleName,
      status: "active",
      version: 1,
      minLevel,
      maxLevel,
    });
  }
  const handAuthoredRoleOut = new Map<string, RoleOut & { minLevel: string; maxLevel: string }>();
  for (const r of HAND_AUTHORED_ROLES) {
    const towerCode = towerNameToCode.get(r.towerName);
    if (!towerCode) throw new Error(`Hand-authored role ${r.roleCode} references unknown tower "${r.towerName}"`);
    handAuthoredRoleOut.set(r.roleCode, {
      role_code: r.roleCode,
      canonical_name: r.roleName,
      tower_code: towerCode,
      capability_code: r.capabilityCode,
      role_type: classifyRoleType({
        towerName: r.towerName,
        roleName: r.roleName,
        capabilityName: r.capabilityCode,
      }),
      allowed_level_min: r.minLevel,
      allowed_level_max: r.maxLevel,
      internal_external_default: "internal",
      billable_default: "true",
      source_artifact: "hand-authored-pr1",
      source_row: "",
      source_label: r.roleName,
      status: "active",
      version: 1,
      minLevel: r.minLevel,
      maxLevel: r.maxLevel,
    });
  }

  // Need seed scarcity per surviving role code for rate computation below.
  const seedScarcityByRoleCode = new Map<string, string>();
  for (const r of seedRoles) {
    if (mergedAwayCodes.has(r.roleCode)) continue;
    seedScarcityByRoleCode.set(r.roleCode, r.scarcity);
  }
  // --- pricing_role_families.csv (grouping key: {tower_code, capability_code}) ---
  const allRoleOuts = [...roleOutBase.values(), ...handAuthoredRoleOut.values()];
  const familyKeySet = new Map<string, { towerCode: string; capabilityCode: string; capabilityName: string }>();
  const capabilityNameByCode = new Map(capabilityRows.map((c) => [c.capability_code, c.capability_name]));
  for (const r of allRoleOuts) {
    const key = `${r.tower_code}::${r.capability_code}`;
    if (!familyKeySet.has(key)) {
      familyKeySet.set(key, {
        towerCode: r.tower_code,
        capabilityCode: r.capability_code,
        capabilityName: capabilityNameByCode.get(r.capability_code) ?? r.capability_code,
      });
    }
  }
  const sortedFamilyKeys = Array.from(familyKeySet.values()).sort((a, b) => {
    const t = a.towerCode.localeCompare(b.towerCode);
    return t !== 0 ? t : a.capabilityCode.localeCompare(b.capabilityCode);
  });
  const roleFamilyCodeByKey = new Map<string, string>();
  const roleFamilyRows = sortedFamilyKeys.map((f, i) => {
    const code = `RF-${String(i + 1).padStart(4, "0")}`;
    roleFamilyCodeByKey.set(`${f.towerCode}::${f.capabilityCode}`, code);
    return {
      role_family_code: code,
      tower_code: f.towerCode,
      capability_code: f.capabilityCode,
      family_name: f.capabilityName,
      source_artifact: "derived: grouping key = {tower_code, capability_code}",
      status: "active",
      version: 1,
    };
  });

  const finalRoleRows = allRoleOuts
    .map((r) => {
      const familyCode = roleFamilyCodeByKey.get(`${r.tower_code}::${r.capability_code}`)!;
      const defaultRateBandCode = `${r.role_code}-${levelCode(r.minLevel)}`;
      const { minLevel: _minLevel, maxLevel: _maxLevel, ...rest } = r;
      void _minLevel;
      void _maxLevel;
      return {
        ...rest,
        role_family_code: familyCode,
        default_rate_band_code: defaultRateBandCode,
      };
    })
    .sort((a, b) => a.role_code.localeCompare(b.role_code));
  // Re-order columns to match brief §4.4 field order exactly.
  const ROLE_CSV_HEADERS = [
    "role_code",
    "canonical_name",
    "tower_code",
    "capability_code",
    "role_family_code",
    "role_type",
    "allowed_level_min",
    "allowed_level_max",
    "default_rate_band_code",
    "internal_external_default",
    "billable_default",
    "source_artifact",
    "source_row",
    "source_label",
    "status",
    "version",
  ];

  // --- pricing_role_aliases.csv ---
  interface AliasOut {
    alias_code: string;
    role_code: string;
    alias_label: string;
    alias_type: string;
    source_artifact: string;
    source_row: number | "";
    status: string;
    version: number;
  }
  const aliasRowsUnsorted: Omit<AliasOut, "alias_code">[] = [];
  for (const merge of ROLE_NORMALIZATION_MERGES) {
    for (const away of merge.mergedAway) {
      const seedRow = seedRoles.find((r) => r.roleCode === away.roleCode);
      aliasRowsUnsorted.push({
        role_code: merge.canonicalRoleCode,
        alias_label: away.name,
        alias_type: "seed_original_label",
        source_artifact: "Workforce_Taxonomy_Master.xlsx:Roles",
        source_row: seedRow?.sourceRow ?? "",
        status: "active",
        version: 1,
      });
    }
  }
  for (const a of HAND_AUTHORED_DISAMBIGUATION_ALIASES) {
    aliasRowsUnsorted.push({
      role_code: a.roleCode,
      alias_label: a.aliasLabel,
      alias_type: "disambiguation_label",
      source_artifact: "hand-authored-pr1",
      source_row: "",
      status: "active",
      version: 1,
    });
  }
  const aliasRows: AliasOut[] = aliasRowsUnsorted
    .sort((a, b) => a.role_code.localeCompare(b.role_code) || a.alias_label.localeCompare(b.alias_label))
    .map((a, i) => ({ alias_code: `ALIAS-${String(i + 1).padStart(4, "0")}`, ...a }));

  // --- pricing_rate_bands.csv ---
  interface RateBandOut {
    rate_band_code: string;
    role_code: string;
    level_code: string;
    currency: string;
    rate_basis: string;
    rate_unit: string;
    loaded_rate: string;
    scarcity_adj_rate: string;
    indicative_bill_rate: string;
    valid_from: string;
    source: string;
    confidence: string;
    approval_status: string;
    status: string;
    version: number;
  }
  const VALID_FROM = "2026-07-23";
  const APPROVAL_STATUS = "global_starter_unapproved";
  function round2(n: number): string {
    return n.toFixed(2);
  }
  const seedRoleBySeedKey = new Map<string, RoleSeed>();
  for (const r of seedRoles) {
    seedRoleBySeedKey.set(`${r.towerName}::${r.roleName}::${r.capabilityName}`, r);
  }
  const rateBandRows: RateBandOut[] = [];
  for (const rc of seedRateCard) {
    if (DROPPED_RATE_CARD_ROW_CODES.has(rc.rcCode)) continue;
    const seedRole = seedRoleBySeedKey.get(`${rc.towerName}::${rc.roleName}::${rc.capabilityName}`);
    if (!seedRole) {
      throw new Error(
        `Role Rate Card row ${rc.rcCode} references a (tower,role,capability) not found in the Roles sheet: ${rc.towerName} / ${rc.roleName} / ${rc.capabilityName}`,
      );
    }
    const canonicalRoleCode = roleCodeOverride.get(seedRole.roleCode) ?? seedRole.roleCode;
    const scarcity = seedScarcityByRoleCode.get(canonicalRoleCode);
    if (!scarcity) {
      throw new Error(`No canonical scarcity found for role ${canonicalRoleCode} (from RC row ${rc.rcCode})`);
    }
    const loaded = loadedHourly[rc.level];
    const scarcityMult = assumptions.scarcityMultipliers[scarcity];
    const marketBase = assumptions.marketBaseByLevel[rc.level].baseBillRate;
    rateBandRows.push({
      rate_band_code: `${canonicalRoleCode}-${levelCode(rc.level)}`,
      role_code: canonicalRoleCode,
      level_code: levelCode(rc.level),
      currency: "USD",
      rate_basis: "onshore_si_t1_benchmark",
      rate_unit: "hour",
      loaded_rate: round2(loaded),
      scarcity_adj_rate: round2(loaded * scarcityMult),
      indicative_bill_rate: round2(marketBase * siT1.multiplier * scarcityMult),
      valid_from: VALID_FROM,
      source: `Workforce_Taxonomy_Master.xlsx:Role Rate Card row ${rc.rcCode} (Internal Cost Model + Assumptions formula engine, recomputed — see script header)`,
      confidence: "medium",
      approval_status: APPROVAL_STATUS,
      status: "active",
      version: 1,
    });
  }
  for (const r of HAND_AUTHORED_ROLES) {
    const scarcityMult = assumptions.scarcityMultipliers[r.scarcity];
    for (const level of levelsInRange(r.minLevel, r.maxLevel)) {
      const loaded = loadedHourly[level];
      const marketBase = assumptions.marketBaseByLevel[level].baseBillRate;
      rateBandRows.push({
        rate_band_code: `${r.roleCode}-${levelCode(level)}`,
        role_code: r.roleCode,
        level_code: levelCode(level),
        currency: "USD",
        rate_basis: "onshore_si_t1_benchmark",
        rate_unit: "hour",
        loaded_rate: round2(loaded),
        scarcity_adj_rate: round2(loaded * scarcityMult),
        indicative_bill_rate: round2(marketBase * siT1.multiplier * scarcityMult),
        valid_from: VALID_FROM,
        source:
          "hand-authored-pr1: computed via the seed workbook's own Internal-Cost-Model/Assumptions rate-engine formulas, applied to a role not present in the source Role Rate Card sheet",
        confidence: "low",
        approval_status: APPROVAL_STATUS,
        status: "active",
        version: 1,
      });
    }
  }
  rateBandRows.sort((a, b) => a.rate_band_code.localeCompare(b.rate_band_code));

  // --- pricing_provider_classes.csv ---
  const providerClassRows = assumptions.providerTiers
    .map((t) => ({
      provider_class_code: t.code,
      class_name: t.code,
      archetype_label: t.archetype,
      tier_multiplier: t.multiplier,
      source_artifact: "Workforce_Taxonomy_Master.xlsx:Assumptions",
      source_row: t.sourceRow,
      status: "active",
      version: 1,
    }))
    .sort((a, b) => a.provider_class_code.localeCompare(b.provider_class_code));

  // --- pricing_delivery_locations.csv ---
  const deliveryLocationRows = geography
    .map((g) => ({
      location_code: `LOC-${slugify(g.region)}`,
      region_name: g.region,
      shore_category: g.shore.toLowerCase(),
      salary_multiplier: g.salaryMult,
      rate_multiplier: g.rateMult,
      scarcity_multiplier: g.scarcityMult,
      cost_of_living_index: g.costOfLiving,
      source_artifact: "Workforce_Taxonomy_Master.xlsx:Geography",
      source_row: g.sourceRow,
      status: "active",
      version: 1,
    }))
    .sort((a, b) => a.location_code.localeCompare(b.location_code));

  // ---------------------------------------------------------------------
  // Write CSVs
  // ---------------------------------------------------------------------
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files: Array<{ name: string; headers: string[]; rows: Record<string, unknown>[] }> = [
    {
      name: "pricing_towers.csv",
      headers: ["tower_code", "tower_name", "scope", "source_artifact", "source_row", "source_label", "status", "version"],
      rows: towerRows,
    },
    {
      name: "pricing_capabilities.csv",
      headers: [
        "capability_code",
        "tower_code",
        "capability_name",
        "scarcity_tier",
        "agent_amenability",
        "source_artifact",
        "source_row",
        "source_label",
        "status",
        "version",
      ],
      rows: capabilityRows,
    },
    {
      name: "pricing_role_families.csv",
      headers: ["role_family_code", "tower_code", "capability_code", "family_name", "source_artifact", "status", "version"],
      rows: roleFamilyRows,
    },
    { name: "pricing_roles.csv", headers: ROLE_CSV_HEADERS, rows: finalRoleRows },
    {
      name: "pricing_role_aliases.csv",
      headers: ["alias_code", "role_code", "alias_label", "alias_type", "source_artifact", "source_row", "status", "version"],
      rows: aliasRows as unknown as Record<string, unknown>[],
    },
    {
      name: "pricing_seniority_levels.csv",
      headers: ["level_code", "level_name", "rank", "years_exp", "expectation", "source_artifact", "source_row", "status", "version"],
      rows: seniorityLevelRows,
    },
    {
      name: "pricing_rate_bands.csv",
      headers: [
        "rate_band_code",
        "role_code",
        "level_code",
        "currency",
        "rate_basis",
        "rate_unit",
        "loaded_rate",
        "scarcity_adj_rate",
        "indicative_bill_rate",
        "valid_from",
        "source",
        "confidence",
        "approval_status",
        "status",
        "version",
      ],
      rows: rateBandRows as unknown as Record<string, unknown>[],
    },
    {
      name: "pricing_provider_classes.csv",
      headers: ["provider_class_code", "class_name", "archetype_label", "tier_multiplier", "source_artifact", "source_row", "status", "version"],
      rows: providerClassRows,
    },
    {
      name: "pricing_delivery_locations.csv",
      headers: [
        "location_code",
        "region_name",
        "shore_category",
        "salary_multiplier",
        "rate_multiplier",
        "scarcity_multiplier",
        "cost_of_living_index",
        "source_artifact",
        "source_row",
        "status",
        "version",
      ],
      rows: deliveryLocationRows,
    },
  ];

  const rowCounts: Record<string, number> = {};
  const fileChecksums: Record<string, string> = {};
  for (const f of files) {
    const filePath = path.join(OUT_DIR, f.name);
    writeCsv(filePath, f.headers, f.rows);
    rowCounts[f.name] = f.rows.length;
    fileChecksums[f.name] = sha256File(filePath);
  }

  // ---------------------------------------------------------------------
  // manifest.json
  // ---------------------------------------------------------------------
  const manifest = {
    dataset_id: DATASET_ID,
    version: PACK_VERSION,
    generated_at: new Date().toISOString(),
    generated_from: {
      source_file_name: path.basename(sourcePath),
      source_sha256: sourceSha256,
      note:
        "Source workbook is NOT part of this repository (machine-specific path). Re-running this conversion requires the source file to be present again, supplied via CLI arg or the PRICING_TAXONOMY_SOURCE_XLSX env var — the checked-in CSVs under this directory are the durable artifact; the script's job is reproducibility of provenance, not guaranteed re-runnability without the source file present.",
    },
    generation_script: "scripts/pricing/convert-workbook-to-reference-pack.ts",
    row_counts: rowCounts,
    file_checksums_sha256: fileChecksums,
    role_family_grouping_rule:
      "role_family_code groups roles by the deterministic key {tower_code, capability_code} — the set of canonical roles sharing a tower+capability forms one family (e.g. all roles under Strategy & Transformation / Transformation Strategy). This is a PR1 authoring decision (the seed workbook has no explicit family column), documented per the PR1 execution prompt.",
    role_type_classification:
      "role_type is NOT source data — it is derived by a documented, reviewable heuristic rule table (ROLE_TYPE_RULES constant in scripts/pricing/convert-workbook-to-reference-pack.ts), evaluated in order, first match wins, default 'delivery'. Reviewers should inspect and challenge that table directly rather than trust role_type as ground truth.",
    role_normalization_merges: ROLE_NORMALIZATION_MERGES.map((m) => ({
      canonical_role_code: m.canonicalRoleCode,
      canonical_name: m.canonicalName,
      merged_away: m.mergedAway,
      rationale: m.rationale,
    })),
    disambiguation_aliases_added: HAND_AUTHORED_DISAMBIGUATION_ALIASES,
    tower_reconciliation: TOWER_RECONCILIATION,
    hand_authored_additions: {
      towers_added: 0,
      capabilities_added: HAND_AUTHORED_CAPABILITIES.map((c) => c.capabilityCode),
      roles_added: HAND_AUTHORED_ROLES.map((r) => r.roleCode),
      note:
        "All hand-authored rows are tagged source_artifact = \"hand-authored-pr1\" in the CSVs themselves (never attributed to the seed workbook). Rate bands for hand-authored roles are computed using the same disclosed Internal-Cost-Model/Assumptions formula engine the seed workbook itself uses (see generation script header), not fabricated numbers.",
    },
    provider_classes_and_delivery_locations_source:
      "Contrary to the PR1 execution prompt's expectation that these might need a hand-authored starter set, the seed workbook's own Assumptions sheet (provider-tier multipliers: CONS-T1, SI-T1, SI-T2, ENG-B, AI-B) and Geography sheet (17 onshore/nearshore/offshore regions with salary/rate/scarcity multipliers and cost-of-living index) provide real, workbook-sourced data for pricing_provider_classes.csv and pricing_delivery_locations.csv — both are sourced from the workbook, not hand-authored.",
    deferred_reference_objects: {
      objects: ["pricing_taxonomy_versions", "pricing_provider_level_aliases", "pricing_providers"],
      reason:
        "The brief §4.4 lists these as required reference objects, but they are out of the explicit PR1 build scope given in this build's authorizing prompt (which enumerates exactly 9 CSVs for PR1). pricing_taxonomy_versions is superseded for now by this manifest's own version/checksum fields; pricing_provider_level_aliases and pricing_providers require real onboarded providers/tenant rate cards, which arrive with PR2's persistence layer.",
    },
    deferred_pr4_objects: {
      objects: [
        "pricing_effort_drivers",
        "pricing_effort_rules",
        "pricing_activity_packs",
        "pricing_archetypes",
        "pricing_agent_costs",
      ],
      reason:
        "Explicitly PR4 scope per the brief's PR execution sequence, not PR1. Not stubbed, not created, per the PR1 execution prompt's explicit instruction.",
    },
    known_gaps: [
      "No Postgres persistence yet — this is a reference-pack (CSV) only; PR2 builds the pricing_rate_cards / pricing_rate_card_lines persistence layer.",
      "Not yet wired into the context/corpus governance pipeline (docs/governance/dataset-manifests/) — this reference pack is not consumed by any agent yet (no UI/API wiring until PR3+), so a governance dataset manifest was not created in PR1. PR3 must add one before any agent-facing wiring.",
      "The role-coverage validator's 'active roles have a rate' check only verifies a pricing_rate_bands.csv row exists (or an explicit no_default_rate status) — the full 6-tier fallback resolver (tenant -> provider -> global, etc.) is PR2/PR5 scope and is not implemented here.",
      "Ambiguous-alias validation is global-scope only for PR1 (no tenant/provider-scoped rate cards exist yet to make the ambiguity tenant-relative).",
      "Topics 10, 11, 18 in the tower reconciliation are accepted as 'partial/adequate' coverage without hand-authored additions, per the PR1 execution prompt's explicit fix-list (only topics 15, 16, 20 were called out) — a future PR could add a dedicated Backup & DR capability, a DBA/database-operations capability, and Finance/Commercial/Sourcing/Vendor-Management capabilities under Program Management if the effort model needs that granularity.",
    ],
  };
  fs.writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  // ---------------------------------------------------------------------
  // Console summary
  // ---------------------------------------------------------------------
  console.log("Nexus Pricing Engine — PR1 reference pack generated.");
  console.log(`  Source: ${sourcePath}`);
  console.log(`  Source SHA-256: ${sourceSha256}`);
  console.log(`  Output dir: ${OUT_DIR}`);
  for (const [name, count] of Object.entries(rowCounts)) {
    console.log(`  ${name}: ${count} rows`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
