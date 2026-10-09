#!/usr/bin/env tsx
/**
 * Nexus Pricing Engine — ROM increment 2a: delivery pod library and agent
 * economics import.
 *
 * A sibling of `convert-workbook-to-reference-pack.ts`. That converter
 * rewrites the PR1 taxonomy CSVs and `manifest.json` from scratch (and would
 * drop the PR4 manifest section), so this script reads only the two sheets
 * it was never taught — "Delivery Pods" and "Agent Economics" — and emits
 * three new CSVs beside the existing pack:
 *
 *   pricing_pod_templates.csv       one row per pod
 *   pricing_pod_template_roles.csv  one row per role entry in a pod's role mix
 *   pricing_agent_profiles.csv      one row per agent type
 *
 * then records their row counts, checksums and role-match coverage under
 * `manifest.json#rom_pod_library`. Every other manifest field is preserved.
 *
 * ## Role mapping: confirmed, proposed by an explicit rule, or unmatched
 *
 * A pod's role mix is free text ("Data Product Mgr, Data Architect, 3x Data
 * Engineer"). Each entry is parsed deterministically (`3x Role` and
 * `Role x3` mean fte 3, otherwise fte 1) and its label is looked up, by exact
 * string equality only, against `pricing_roles.csv#canonical_name` and
 * `pricing_role_aliases.csv#alias_label`. One distinct role = `exact` or
 * `alias`, `mapping_status = confirmed`.
 *
 * A label that matches nothing may then be PROPOSED a role by one row of
 * `GENERIC_ROLE_RULES` below — an explicit, reviewable table keyed by the
 * pod's tower and the exact label (product-owner decision, 2026-10-10:
 * "proposed mapping by tower, never silent"). A proposal is
 * `match_method = proposed_by_tower`, `mapping_status = proposed_unapproved`
 * and names its rule in `mapping_rule_id`; the pricer prints "proposed role
 * mapping, unapproved" on every term it touches. A label naming two roles
 * (ambiguous) is resolved by a rule ONLY when that rule says
 * `resolvesAmbiguity: true` and names one of the candidates. There is no
 * fuzzy, case-folded or similarity matching: a label no rule names stays
 * `unmatched` with an empty role_code, and the script prints a coverage
 * report.
 *
 * ## Level: the pod's blended level, clamped into the role's range
 *
 * Each pod carries ONE blended level and the workbook has no per-role level.
 * A matched role row takes the pod's level clamped into the role's
 * `allowed_level_min..allowed_level_max` (product-owner decision,
 * 2026-10-10): `level_code` is the priced level, `original_level_code` the
 * pod's level and `level_adjustment` says `none`, `clamped_up` or
 * `clamped_down`. The pricer prints "level clamped from X to Y".
 *
 * ## The agent profiles are planning assumptions
 *
 * "Agent Economics" is a product-owner planning table ("provider-neutral",
 * "1.00 = no gain") with no external source. Every profile row is emitted
 * with `confidence = low`, `approval_status = global_starter_unapproved`
 * and `assumption_basis = product_owner_planning_assumption_no_external_source`.
 * Nothing here presents it as researched.
 *
 * ## Not imported
 *
 * - The pods' "Use Cases / Est. Monthly $" column and Agent Economics'
 *   "Annual $" column are formulas with no cached result (the workbook was
 *   never recalculated). Pod cost comes from the pod pricer instead.
 *
 * ## Usage
 *
 *   npx tsx scripts/pricing/convert-pod-library.ts <path-to-xlsx>
 *   PRICING_TAXONOMY_SOURCE_XLSX=/path/to.xlsx npx tsx scripts/pricing/convert-pod-library.ts
 *
 * The workbook's sha256 must equal `manifest.json#generated_from.source_sha256`
 * (the file the rest of the pack was generated from); a different file is
 * refused. The workbook is never copied into the repository.
 *
 * Deterministic: no timestamps are written, so re-running against the same
 * workbook reproduces byte-identical CSVs and manifest.
 */
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { readCsv, sha256File, sha256Hex, toCsv } from "./csv-utils";
import {
  AGENT_APPROVAL_STATUS,
  AGENT_ASSUMPTION_BASIS,
  AGENT_CONFIDENCE,
  AGENT_MIX_SEPARATOR,
  MAPPING_STATUS_BY_MATCH_METHOD,
  clampLevelToRoleRange,
  type PodLevelAdjustmentValue,
  type PodRoleMatchMethodValue,
} from "./validate-pricing-role-coverage";

const SOURCE_FILE_NAME = "Workforce_Taxonomy_Master.xlsx";
export const POD_SHEET = "Delivery Pods";
export const AGENT_SHEET = "Agent Economics";
export const POD_LIBRARY_PACK_VERSION = "1.3.0";

export const POD_TEMPLATE_HEADERS = [
  "pod_code",
  "name",
  "tower_code",
  "headcount",
  "blended_level_code",
  "agent_mix_codes",
  "source_artifact",
  "source_row",
  "status",
  "version",
] as const;

export const POD_TEMPLATE_ROLE_HEADERS = [
  "pod_code",
  "role_code",
  "level_code",
  "original_level_code",
  "level_adjustment",
  "fte",
  "raw_role_text",
  "match_method",
  "mapping_status",
  "mapping_rule_id",
  "source_row",
] as const;

export const AGENT_PROFILE_HEADERS = [
  "agent_code",
  "name",
  "agent_type",
  "monthly_cost_usd",
  "equiv_eng_fte",
  "utilization",
  "productivity",
  "documentation",
  "testing",
  "architecture",
  "assumption_basis",
  "source_artifact",
  "source_row",
  "confidence",
  "approval_status",
] as const;

/**
 * The agent types the workbook names, and their codes. An explicit,
 * reviewable table rather than a derived slug: a new or renamed agent type in
 * the workbook fails the conversion instead of minting a code silently.
 */
export const AGENT_CODE_BY_NAME: Readonly<Record<string, string>> = {
  "Agent Platform A": "AGENT-A",
  "Agent Platform B": "AGENT-B",
  "Agent Platform C": "AGENT-C",
  "Agent Platform D": "AGENT-D",
  "AbarVa Agents": "AGENT-ABARVA",
};

// The column labels each sheet must carry (column B onward), asserted so a
// re-laid-out workbook fails loudly instead of being read off by one column.
const POD_HEADER_LABELS = [
  "ID",
  "Pod",
  "Tower",
  "Role Mix",
  "Headcount",
  "Blended Level",
  "Agent Mix",
] as const;
const AGENT_HEADER_LABELS = [
  "Platform",
  "Type",
  "Monthly $",
  "Annual $",
  "Equiv Eng FTE",
  "Util %",
  "Productivity",
  "Documentation",
  "Testing",
  "Architecture",
] as const;

// ---------------------------------------------------------------------------
// Sheet reading
// ---------------------------------------------------------------------------

export interface SheetRow {
  rowNumber: number;
  /** Column B onward, 0-indexed (cells[0] === column B). Formula cells read as "". */
  cells: string[];
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && !(value instanceof Date)) {
    const record = value as unknown as Record<string, unknown>;
    if ("richText" in record) {
      return (record.richText as Array<{ text: string }>)
        .map((r) => r.text)
        .join("")
        .trim();
    }
    // A formula cell with no cached result. Neither sheet's imported
    // columns is a formula; the formula columns are not read.
    return "";
  }
  return String(value).trim();
}

/** Read columns B..K of every non-empty row of a worksheet. */
export function readSheetRows(worksheet: ExcelJS.Worksheet): SheetRow[] {
  const rows: SheetRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    const cells: string[] = [];
    for (let col = 2; col <= 11; col++) cells.push(cellText(row.getCell(col).value));
    rows.push({ rowNumber, cells });
  });
  return rows;
}

/** The data rows below the header row whose leading cells equal `labels`, up to the first row with a blank first cell. */
function dataRowsBelowHeader(
  rows: readonly SheetRow[],
  labels: readonly string[],
  sheetName: string,
): SheetRow[] {
  const headerIndex = rows.findIndex((r) => r.cells[0] === labels[0]);
  if (headerIndex < 0) {
    throw new Error(`${sheetName}: no header row starting with "${labels[0]}"`);
  }
  const header = rows[headerIndex];
  labels.forEach((label, i) => {
    if (header.cells[i] !== label) {
      throw new Error(
        `${sheetName} row ${header.rowNumber}: expected column ${i + 2} header "${label}", found "${header.cells[i]}"`,
      );
    }
  });
  const out: SheetRow[] = [];
  for (let i = headerIndex + 1; i < rows.length; i++) {
    if (rows[i].cells[0] === "") break;
    out.push(rows[i]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Text parsing
// ---------------------------------------------------------------------------

const XML_ENTITIES: Readonly<Record<string, string>> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

/** Decode the five XML entities (a raw inline-string read can carry `&amp;`). Single pass, so `&amp;lt;` decodes to `&lt;`, not `<`. */
export function decodeXmlEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|apos);/g, (m) => XML_ENTITIES[m]);
}

function normalizeSpace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export interface RoleMixEntry {
  /** The entry as written, entity-decoded and whitespace-normalized (e.g. "3x Data Engineer"). */
  rawRoleText: string;
  /** The role label with any multiplier removed (e.g. "Data Engineer"). */
  roleLabel: string;
  fte: number;
}

const LEADING_MULTIPLIER = /^(\d+(?:\.\d+)?)\s*[x×]\s+(.+)$/i;
const TRAILING_MULTIPLIER = /^(.+?)\s+[x×]\s*(\d+(?:\.\d+)?)$/i;

/**
 * Parse a role-mix cell. Entries are comma-separated; `3x Role` / `3 x Role`
 * and `Role x3` / `Role x 3` mean fte 3; anything else is fte 1. Throws on an
 * empty entry, a zero multiplier, or an entry carrying both forms — a
 * malformed mix is refused, never read approximately.
 */
export function parseRoleMix(text: string): RoleMixEntry[] {
  const decoded = decodeXmlEntities(text);
  if (normalizeSpace(decoded) === "") throw new Error("role mix is empty");
  return decoded.split(",").map((piece) => {
    const raw = normalizeSpace(piece);
    if (raw === "") throw new Error(`role mix "${text}" has an empty entry`);
    const leading = LEADING_MULTIPLIER.exec(raw);
    const trailing = TRAILING_MULTIPLIER.exec(raw);
    if (leading && trailing) {
      throw new Error(`role mix entry "${raw}" carries a multiplier on both sides`);
    }
    let roleLabel = raw;
    let fte = 1;
    if (leading) {
      fte = Number(leading[1]);
      roleLabel = leading[2].trim();
    } else if (trailing) {
      fte = Number(trailing[2]);
      roleLabel = trailing[1].trim();
    }
    if (!(fte > 0)) throw new Error(`role mix entry "${raw}" has a non-positive multiplier`);
    return { rawRoleText: raw, roleLabel, fte };
  });
}

/** Parse an agent-mix cell ("Agent Platform B + AbarVa Agents") into agent names, in source order. Empty cell = no agents. */
export function parseAgentMix(text: string): string[] {
  const decoded = normalizeSpace(decodeXmlEntities(text));
  if (decoded === "") return [];
  return decoded.split("+").map((part) => {
    const name = normalizeSpace(part);
    if (name === "") throw new Error(`agent mix "${text}" has an empty entry`);
    return name;
  });
}

// ---------------------------------------------------------------------------
// Role matching
// ---------------------------------------------------------------------------

export interface RoleReferenceRow {
  role_code: string;
  canonical_name: string;
  status: string;
}
export interface RoleAliasReferenceRow {
  role_code: string;
  alias_label: string;
  status: string;
}

export type RoleMatch =
  | { method: "exact" | "alias"; roleCode: string }
  | { method: "unmatched"; roleCode: null; reason: "no_match" | "ambiguous"; candidates: string[] };

const INACTIVE_STATUSES = new Set(["retired", "superseded", "deprecated"]);

/**
 * Match a role label against canonical names and aliases by exact string
 * equality. The candidate set is the union of both lookups: exactly one
 * distinct role code matches; zero or several do not.
 */
export function matchRoleLabel(
  label: string,
  roles: readonly RoleReferenceRow[],
  aliases: readonly RoleAliasReferenceRow[],
): RoleMatch {
  const activeRoles = roles.filter((r) => !INACTIVE_STATUSES.has(r.status));
  const activeCodes = new Set(activeRoles.map((r) => r.role_code));
  const canonical = new Set(
    activeRoles.filter((r) => r.canonical_name === label).map((r) => r.role_code),
  );
  const viaAlias = new Set(
    aliases
      .filter(
        (a) =>
          !INACTIVE_STATUSES.has(a.status) &&
          activeCodes.has(a.role_code) &&
          a.alias_label === label,
      )
      .map((a) => a.role_code),
  );
  const candidates = Array.from(new Set([...canonical, ...viaAlias])).sort();
  if (candidates.length === 1) {
    return { method: canonical.size === 1 ? "exact" : "alias", roleCode: candidates[0] };
  }
  return {
    method: "unmatched",
    roleCode: null,
    reason: candidates.length === 0 ? "no_match" : "ambiguous",
    candidates,
  };
}

// ---------------------------------------------------------------------------
// Generic-role rules — proposed mapping by tower (never silent)
// ---------------------------------------------------------------------------

/**
 * One reviewable proposal: in a pod of tower `towerCode`, a role-mix label
 * EXACTLY equal to one of `labels` is proposed `roleCode`. A rule fires only
 * for a label the reference match left unmatched, and its rows are emitted
 * `proposed_by_tower` / `proposed_unapproved` with `mapping_rule_id = id` —
 * never as a confirmed mapping.
 *
 * - `generic_family`: a bare family word ("Developer", "Engineer") maps to the
 *   tower's ONE generic role of that family — the one with no platform or
 *   specialism in its name. A tower with no such role, or several, has no
 *   rule for the word.
 * - `abbreviation`: a shortened label maps to the one role in the tower whose
 *   name it shortens ("SF Architect" → Salesforce Architect).
 * - `support_tier`: Managed Services' L1/L2/L3 map to the matching support-tier role.
 * - `ambiguity_resolution`: the label names two roles exactly; the rule names
 *   the one in the pod's tower. Requires `resolvesAmbiguity: true`.
 *
 * Labels deliberately WITHOUT a rule (they stay unmatched): "Engineer" in
 * towers with no single generic engineer role (Industry SMEs, Digital
 * Experience, Product Management, ERP, Cybersecurity, Quality Engineering),
 * "Consultant" in ERP (SAP, Oracle and Workday consultants are all
 * platform-specific), "Analyst" in Cybersecurity (SOC, threat or GRC), "PM"
 * (project or program manager), "Delivery Mgr" (AMS or service delivery
 * manager), "AMS Lead" and "Integration" (no role names them).
 */
export interface GenericRoleRule {
  id: string;
  towerCode: string;
  labels: readonly string[];
  roleCode: string;
  kind: "generic_family" | "abbreviation" | "support_tier" | "ambiguity_resolution";
  /** Must be true for the rule to resolve a label that names two roles exactly. */
  resolvesAmbiguity?: boolean;
  rationale: string;
}

export const GENERIC_ROLE_RULES: readonly GenericRoleRule[] = [
  // TWR-02 Industry SMEs
  { id: "GR-01", towerCode: "TWR-02", labels: ["AI Architect"], roleCode: "ROL-204", kind: "abbreviation", rationale: "Industry SMEs has no AI role; the AI & GenAI tower's AI Solution Architect is the one architect the label names" },
  { id: "GR-02", towerCode: "TWR-02", labels: ["Banking SME"], roleCode: "ROL-152", kind: "abbreviation", rationale: "the tower's one Banking SME role (Banking Principal SME)" },
  { id: "GR-03", towerCode: "TWR-02", labels: ["Insurance SME"], roleCode: "ROL-156", kind: "abbreviation", rationale: "the tower's one Insurance SME role (Insurance Principal SME)" },
  { id: "GR-04", towerCode: "TWR-02", labels: ["Payments SME"], roleCode: "ROL-158", kind: "abbreviation", rationale: "the tower's one Payments SME role (Payments Principal SME)" },
  { id: "GR-05", towerCode: "TWR-02", labels: ["Provider SME"], roleCode: "ROL-162", kind: "abbreviation", rationale: "the tower's one Provider SME role (Provider Principal SME)" },
  // TWR-03 Business Process
  { id: "GR-06", towerCode: "TWR-03", labels: ["Process Lead"], roleCode: "ROL-017", kind: "abbreviation", rationale: "Process Design Lead, the tower's one process lead" },
  { id: "GR-07", towerCode: "TWR-03", labels: ["Mining Consultant"], roleCode: "ROL-018", kind: "abbreviation", rationale: "Process Mining Consultant" },
  // TWR-04 Data & Analytics
  { id: "GR-08", towerCode: "TWR-04", labels: ["Data Product Mgr"], roleCode: "ROL-024", kind: "abbreviation", rationale: "Data Product Manager" },
  { id: "GR-09", towerCode: "TWR-04", labels: ["BI Dev"], roleCode: "ROL-041", kind: "abbreviation", rationale: "BI Developer" },
  { id: "GR-10", towerCode: "TWR-04", labels: ["Governance Lead"], roleCode: "ROL-026", kind: "abbreviation", rationale: "Data Governance Lead, the tower's one governance lead" },
  { id: "GR-11", towerCode: "TWR-04", labels: ["Steward"], roleCode: "ROL-027", kind: "abbreviation", rationale: "Data Steward" },
  { id: "GR-12", towerCode: "TWR-04", labels: ["Streaming Engineer"], roleCode: "ROL-177", kind: "abbreviation", rationale: "Streaming Data Engineer" },
  { id: "GR-13", towerCode: "TWR-04", labels: ["Analytics Engineer"], roleCode: "ROL-176", kind: "abbreviation", rationale: "Analytics Engineer (dbt), the tower's one analytics engineer" },
  // TWR-05 AI & GenAI
  { id: "GR-14", towerCode: "TWR-05", labels: ["AI Architect"], roleCode: "ROL-204", kind: "abbreviation", rationale: "AI Solution Architect, the tower's delivery-level AI architect (Chief AI Architect is the director-level role)" },
  { id: "GR-15", towerCode: "TWR-05", labels: ["FDE"], roleCode: "ROL-050", kind: "abbreviation", rationale: "Forward Deployed Engineer" },
  { id: "GR-16", towerCode: "TWR-05", labels: ["LLMOps"], roleCode: "ROL-056", kind: "abbreviation", rationale: "LLMOps Engineer" },
  { id: "GR-17", towerCode: "TWR-05", labels: ["CV Engineer"], roleCode: "ROL-196", kind: "abbreviation", rationale: "Computer Vision Engineer" },
  // TWR-07 Marketing Technology
  { id: "GR-18", towerCode: "TWR-07", labels: ["Engineer"], roleCode: "ROL-211", kind: "generic_family", rationale: "MarTech Engineer, the tower's generic engineer (CDP Engineer is platform-specific)" },
  { id: "GR-19", towerCode: "TWR-07", labels: ["Target Specialist"], roleCode: "ROL-210", kind: "abbreviation", rationale: "Adobe Target Specialist" },
  // TWR-08 Product Management
  { id: "GR-20", towerCode: "TWR-08", labels: ["Eng Lead"], roleCode: "ROL-078", kind: "abbreviation", rationale: "Product Management has no engineering role; Engineering Lead is the one role the label names" },
  { id: "GR-21", towerCode: "TWR-08", labels: ["Designer"], roleCode: "ROL-217", kind: "generic_family", rationale: "Product Designer, the tower's one designer" },
  // TWR-09 Application Engineering
  { id: "GR-22", towerCode: "TWR-09", labels: ["Developer", "Engineer"], roleCode: "ROL-080", kind: "generic_family", rationale: "Software Engineer, the tower's generic developer/engineer (the others name a stack or platform)" },
  { id: "GR-23", towerCode: "TWR-09", labels: ["Eng Lead"], roleCode: "ROL-078", kind: "abbreviation", rationale: "Engineering Lead" },
  { id: "GR-24", towerCode: "TWR-09", labels: ["SF Architect"], roleCode: "ROL-232", kind: "abbreviation", rationale: "Salesforce Architect" },
  { id: "GR-25", towerCode: "TWR-09", labels: ["SN Architect"], roleCode: "ROL-227", kind: "abbreviation", rationale: "ServiceNow Architect" },
  { id: "GR-26", towerCode: "TWR-09", labels: ["ITOM Consultant"], roleCode: "ROL-230", kind: "abbreviation", rationale: "ServiceNow ITOM Consultant, the tower's one ITOM role" },
  { id: "GR-27", towerCode: "TWR-09", labels: ["SecOps Consultant"], roleCode: "ROL-231", kind: "abbreviation", rationale: "ServiceNow SecOps Consultant, the tower's one SecOps role" },
  { id: "GR-28", towerCode: "TWR-09", labels: ["Sales Cloud Consultant"], roleCode: "ROL-233", kind: "abbreviation", rationale: "Salesforce Sales Cloud Consultant" },
  { id: "GR-29", towerCode: "TWR-09", labels: ["Service Cloud Consultant"], roleCode: "ROL-234", kind: "abbreviation", rationale: "Salesforce Service Cloud Consultant" },
  // TWR-10 Integration
  { id: "GR-30", towerCode: "TWR-10", labels: ["Developer"], roleCode: "ROL-086", kind: "generic_family", rationale: "iPaaS Developer, the tower's generic developer (MuleSoft Developer is platform-specific)" },
  { id: "GR-31", towerCode: "TWR-10", labels: ["iPaaS Dev"], roleCode: "ROL-086", kind: "abbreviation", rationale: "iPaaS Developer" },
  { id: "GR-32", towerCode: "TWR-10", labels: ["Event Engineer"], roleCode: "ROL-087", kind: "abbreviation", rationale: "Event Streaming Engineer" },
  // TWR-11 ERP
  { id: "GR-33", towerCode: "TWR-11", labels: ["Functional Lead"], roleCode: "ROL-097", kind: "abbreviation", rationale: "Workday Functional Lead, the tower's one functional lead" },
  { id: "GR-34", towerCode: "TWR-11", labels: ["Basis"], roleCode: "ROL-093", kind: "abbreviation", rationale: "SAP Basis Consultant, the tower's one Basis role" },
  { id: "GR-35", towerCode: "TWR-11", labels: ["SAP SCM Architect"], roleCode: "ROL-091", kind: "abbreviation", rationale: "SAP Supply Chain Architect" },
  { id: "GR-36", towerCode: "TWR-11", labels: ["MM Consultant"], roleCode: "ROL-244", kind: "abbreviation", rationale: "SAP MM Consultant" },
  { id: "GR-37", towerCode: "TWR-11", labels: ["SD Consultant"], roleCode: "ROL-245", kind: "abbreviation", rationale: "SAP SD Consultant" },
  { id: "GR-38", towerCode: "TWR-11", labels: ["BTP Architect"], roleCode: "ROL-250", kind: "abbreviation", rationale: "SAP BTP Architect" },
  { id: "GR-39", towerCode: "TWR-11", labels: ["CPI Consultant"], roleCode: "ROL-251", kind: "abbreviation", rationale: "SAP CPI Consultant" },
  { id: "GR-40", towerCode: "TWR-11", labels: ["ABAP Developer"], roleCode: "ROL-248", kind: "abbreviation", rationale: "SAP ABAP Developer" },
  { id: "GR-41", towerCode: "TWR-11", labels: ["Fiori Developer"], roleCode: "ROL-249", kind: "abbreviation", rationale: "SAP Fiori Developer" },
  { id: "GR-42", towerCode: "TWR-11", labels: ["SuccessFactors Consultant"], roleCode: "ROL-254", kind: "abbreviation", rationale: "SAP SuccessFactors Consultant" },
  // TWR-12 Cloud
  { id: "GR-43", towerCode: "TWR-12", labels: ["SRE"], roleCode: "ROL-274", kind: "abbreviation", rationale: "SRE Engineer (SRE Architect is the architect role)" },
  { id: "GR-44", towerCode: "TWR-12", labels: ["IaC Engineer"], roleCode: "ROL-271", kind: "abbreviation", rationale: "IaC / Terraform Engineer" },
  // TWR-13 Infrastructure
  { id: "GR-45", towerCode: "TWR-13", labels: ["AD Engineer"], roleCode: "ROL-278", kind: "abbreviation", rationale: "Active Directory Engineer" },
  { id: "GR-46", towerCode: "TWR-13", labels: ["Backup/DR Engineer"], roleCode: "ROL-277", kind: "abbreviation", rationale: "Backup & DR Engineer" },
  { id: "GR-47", towerCode: "TWR-13", labels: ["Infra Architect"], roleCode: "ROL-108", kind: "abbreviation", rationale: "Infrastructure Architect" },
  // TWR-14 Cybersecurity
  { id: "GR-48", towerCode: "TWR-14", labels: ["AppSec Engineer"], roleCode: "ROL-116", kind: "abbreviation", rationale: "Application Security Engineer" },
  // TWR-15 Quality Engineering
  { id: "GR-49", towerCode: "TWR-15", labels: ["Automation Engineer"], roleCode: "ROL-120", kind: "ambiguity_resolution", resolvesAmbiguity: true, rationale: "two roles are named Automation Engineer (Business Process and Quality Engineering); in a Quality Engineering pod it is the Quality Engineering one" },
  // TWR-16 Operations
  { id: "GR-50", towerCode: "TWR-16", labels: ["SRE"], roleCode: "ROL-125", kind: "abbreviation", rationale: "Site Reliability Engineer" },
  // TWR-17 Managed Services
  { id: "GR-51", towerCode: "TWR-17", labels: ["L1"], roleCode: "ROL-129", kind: "support_tier", rationale: "L1 Support Analyst" },
  { id: "GR-52", towerCode: "TWR-17", labels: ["L2"], roleCode: "ROL-128", kind: "support_tier", rationale: "L2 Support Engineer" },
  { id: "GR-53", towerCode: "TWR-17", labels: ["L3", "L3 (Cloud)", "L3 (ERP)"], roleCode: "ROL-127", kind: "support_tier", rationale: "L3 Support Engineer (the parenthetical names the supported platform, not a different tier)" },
  // TWR-19 Change Management
  { id: "GR-54", towerCode: "TWR-19", labels: ["Comms Lead"], roleCode: "ROL-136", kind: "abbreviation", rationale: "Communications Lead" },
];

/**
 * Refuse a defective rule table: a blank or duplicate id, an unknown tower,
 * an unknown or inactive role, an empty label list, or two rules claiming the
 * same tower + label (which would make the proposal depend on table order).
 */
export function validateGenericRoleRules(
  rules: readonly GenericRoleRule[],
  reference: Pick<PodLibraryReference, "towers" | "roles">,
): void {
  const towerCodes = new Set(reference.towers.map((t) => t.tower_code));
  const activeRoleCodes = new Set(
    reference.roles.filter((r) => !INACTIVE_STATUSES.has(r.status)).map((r) => r.role_code),
  );
  const ids = new Set<string>();
  const keys = new Map<string, string>();
  for (const rule of rules) {
    if (rule.id.trim() === "") throw new Error("GENERIC_ROLE_RULES: a rule has a blank id");
    if (ids.has(rule.id)) throw new Error(`GENERIC_ROLE_RULES: duplicate rule id "${rule.id}"`);
    ids.add(rule.id);
    if (!towerCodes.has(rule.towerCode)) {
      throw new Error(`GENERIC_ROLE_RULES ${rule.id}: unknown tower_code "${rule.towerCode}"`);
    }
    if (!activeRoleCodes.has(rule.roleCode)) {
      throw new Error(`GENERIC_ROLE_RULES ${rule.id}: role_code "${rule.roleCode}" is not an active role`);
    }
    if (rule.labels.length === 0) throw new Error(`GENERIC_ROLE_RULES ${rule.id}: no labels`);
    for (const label of rule.labels) {
      const key = `${rule.towerCode}::${label}`;
      const prior = keys.get(key);
      if (prior !== undefined) {
        throw new Error(`GENERIC_ROLE_RULES ${rule.id}: tower ${rule.towerCode} label "${label}" is already claimed by ${prior}`);
      }
      keys.set(key, rule.id);
    }
  }
}

/**
 * The rule proposing a role for an unmatched label in a pod of `towerCode`,
 * or null. An ambiguous label is resolved only by a rule with
 * `resolvesAmbiguity: true`, and that rule must name one of the candidates.
 */
export function proposeRoleByTower(
  label: string,
  towerCode: string,
  match: Extract<RoleMatch, { method: "unmatched" }>,
  rules: readonly GenericRoleRule[],
): GenericRoleRule | null {
  const rule = rules.find((r) => r.towerCode === towerCode && r.labels.includes(label));
  if (!rule) return null;
  if (match.reason === "ambiguous") {
    if (rule.resolvesAmbiguity !== true) return null;
    if (!match.candidates.includes(rule.roleCode)) {
      throw new Error(
        `GENERIC_ROLE_RULES ${rule.id}: resolves ambiguous label "${label}" to ${rule.roleCode}, which is not one of its candidates (${match.candidates.join(", ")})`,
      );
    }
  }
  return rule;
}

// ---------------------------------------------------------------------------
// Conversion (pure)
// ---------------------------------------------------------------------------

export interface PodLibraryReference {
  towers: ReadonlyArray<{ tower_code: string; tower_name: string }>;
  /** `rank` 1 is the most senior level. */
  levels: ReadonlyArray<{ level_code: string; level_name: string; rank: string }>;
  roles: ReadonlyArray<RoleReferenceRow & { allowed_level_min: string; allowed_level_max: string }>;
  aliases: readonly RoleAliasReferenceRow[];
  rateBands: ReadonlyArray<{ role_code: string; level_code: string }>;
}

export type CsvRow = Record<string, string | number>;

export interface UnmatchedLabelReport {
  label: string;
  reason: "no_match" | "ambiguous";
  candidates: string[];
  occurrences: number;
  podCodes: string[];
}

export interface ProposedMappingReport {
  label: string;
  towerCode: string;
  roleCode: string;
  ruleId: string;
  occurrences: number;
  podCodes: string[];
}

export interface PodLibraryCoverage {
  podsTotal: number;
  /** Pods with no unmatched role (confirmed and proposed mappings both count). */
  podsFullyMatched: number;
  /** Pods whose every role is a confirmed (exact/alias) mapping. */
  podsFullyConfirmed: number;
  /** Fully matched pods with at least one proposed mapping. */
  podsWithProposedMappings: number;
  /** Fully matched AND every member has a rate band at its (clamped) level — what `podMembersFromTemplate` + the pod pricer can price. */
  podsPriceable: number;
  /** Priceable with `requireConfirmedMappings: true`: fully confirmed and banded. */
  podsPriceableConfirmedOnly: number;
  roleRowsTotal: number;
  roleRowsExact: number;
  roleRowsAlias: number;
  roleRowsProposed: number;
  roleRowsUnmatched: number;
  roleRowsClampedUp: number;
  roleRowsClampedDown: number;
  /** Matched role rows whose role has no rate band at the row's (clamped) level (the pricer refuses them as `no_rate_band`). */
  matchedRowsWithoutBand: number;
  unmatchedLabels: UnmatchedLabelReport[];
  proposedMappings: ProposedMappingReport[];
  /** Rule ids that proposed nothing in this conversion (a rule for a label the workbook no longer uses). */
  unusedRuleIds: string[];
}

export interface PodLibraryConversion {
  podTemplates: CsvRow[];
  podTemplateRoles: CsvRow[];
  agentProfiles: CsvRow[];
  coverage: PodLibraryCoverage;
  /** The generic-role rule table this conversion applied (recorded in the manifest). */
  rules: readonly GenericRoleRule[];
}

function finiteNumber(text: string, where: string): number {
  const n = Number(text);
  if (text === "" || !Number.isFinite(n)) throw new Error(`${where}: expected a number, got "${text}"`);
  return n;
}

function convertAgentRows(agentRows: readonly SheetRow[]): CsvRow[] {
  const seen = new Set<string>();
  return dataRowsBelowHeader(agentRows, AGENT_HEADER_LABELS, AGENT_SHEET).map((row) => {
    const where = `${AGENT_SHEET} row ${row.rowNumber}`;
    const name = normalizeSpace(decodeXmlEntities(row.cells[0]));
    const code = AGENT_CODE_BY_NAME[name];
    if (!code) throw new Error(`${where}: agent type "${name}" has no code in AGENT_CODE_BY_NAME`);
    if (seen.has(code)) throw new Error(`${where}: agent type "${name}" appears twice`);
    seen.add(code);
    const utilization = finiteNumber(row.cells[5], `${where} Util %`);
    if (!(utilization > 0 && utilization <= 1)) {
      throw new Error(`${where}: Util % must be a fraction in (0, 1], got ${utilization}`);
    }
    return {
      agent_code: code,
      name,
      agent_type: normalizeSpace(decodeXmlEntities(row.cells[1])),
      monthly_cost_usd: finiteNumber(row.cells[2], `${where} Monthly $`),
      // cells[3] is "Annual $" (= Monthly × 12, a formula) — not imported.
      equiv_eng_fte: finiteNumber(row.cells[4], `${where} Equiv Eng FTE`),
      utilization,
      productivity: finiteNumber(row.cells[6], `${where} Productivity`),
      documentation: finiteNumber(row.cells[7], `${where} Documentation`),
      testing: finiteNumber(row.cells[8], `${where} Testing`),
      architecture: finiteNumber(row.cells[9], `${where} Architecture`),
      assumption_basis: AGENT_ASSUMPTION_BASIS,
      source_artifact: `${SOURCE_FILE_NAME}:${AGENT_SHEET}`,
      source_row: row.rowNumber,
      confidence: AGENT_CONFIDENCE,
      approval_status: AGENT_APPROVAL_STATUS,
    };
  });
}

function byLabel(a: { label: string }, b: { label: string }): number {
  return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
}

/**
 * Convert the two sheets' rows into the three CSV row sets plus a coverage
 * report. Pure and deterministic: output order is pod order (pod_code) and,
 * within a pod, role-mix order. Throws on any structural defect (unknown
 * tower, level or agent type, duplicate pod code, a role mix whose FTE does
 * not sum to the pod's headcount, a defective rule table, a role whose
 * allowed level range cannot be read) — but an unmatched ROLE is data,
 * reported, never an error and never guessed. `rules` defaults to
 * `GENERIC_ROLE_RULES`.
 */
export function convertPodLibrary(input: {
  podRows: readonly SheetRow[];
  agentRows: readonly SheetRow[];
  reference: PodLibraryReference;
  rules?: readonly GenericRoleRule[];
}): PodLibraryConversion {
  const { reference } = input;
  const rules = input.rules ?? GENERIC_ROLE_RULES;
  validateGenericRoleRules(rules, reference);
  const towerCodeByName = new Map(reference.towers.map((t) => [t.tower_name, t.tower_code]));
  const levelCodeByName = new Map(reference.levels.map((l) => [l.level_name, l.level_code]));
  const rolesByCode = new Map(reference.roles.map((r) => [r.role_code, r]));
  const bandKeys = new Set(reference.rateBands.map((b) => `${b.role_code}::${b.level_code}`));

  const agentProfiles = convertAgentRows(input.agentRows);
  const agentCodes = new Set(agentProfiles.map((a) => String(a.agent_code)));

  const podRows = dataRowsBelowHeader(input.podRows, POD_HEADER_LABELS, POD_SHEET);
  const parsedPods = podRows.map((row) => {
    const where = `${POD_SHEET} row ${row.rowNumber}`;
    const [podCode, name, towerName, roleMix, headcountText, levelName, agentMix] = row.cells.map(
      (c) => normalizeSpace(decodeXmlEntities(c)),
    );
    const towerCode = towerCodeByName.get(towerName);
    if (!towerCode) throw new Error(`${where}: tower "${towerName}" is not in pricing_towers.csv`);
    const levelCode = levelCodeByName.get(levelName);
    if (!levelCode) throw new Error(`${where}: blended level "${levelName}" is not in pricing_seniority_levels.csv`);
    const headcount = finiteNumber(headcountText, `${where} Headcount`);
    const agentNames = parseAgentMix(agentMix);
    const agentMixCodes = agentNames.map((n) => {
      const code = AGENT_CODE_BY_NAME[n];
      if (!code || !agentCodes.has(code)) {
        throw new Error(`${where}: agent mix names "${n}", which is not an ${AGENT_SHEET} row`);
      }
      return code;
    });
    let entries: RoleMixEntry[];
    try {
      entries = parseRoleMix(roleMix);
    } catch (e) {
      throw new Error(`${where}: ${(e as Error).message}`);
    }
    const fteSum = entries.reduce((acc, e) => acc + e.fte, 0);
    if (Math.abs(fteSum - headcount) > 1e-9) {
      throw new Error(`${where}: role mix "${roleMix}" sums to ${fteSum} FTE but Headcount is ${headcount}`);
    }
    return { row, podCode, name, towerCode, levelCode, headcount, agentMixCodes, entries };
  });

  const podCodes = new Set<string>();
  for (const p of parsedPods) {
    if (podCodes.has(p.podCode)) throw new Error(`${POD_SHEET}: duplicate pod code "${p.podCode}"`);
    podCodes.add(p.podCode);
  }
  parsedPods.sort((a, b) => (a.podCode < b.podCode ? -1 : a.podCode > b.podCode ? 1 : 0));

  const podTemplates: CsvRow[] = [];
  const podTemplateRoles: CsvRow[] = [];
  const unmatched = new Map<string, UnmatchedLabelReport>();
  const proposed = new Map<string, ProposedMappingReport>();
  const usedRuleIds = new Set<string>();
  const counts = {
    podsFullyMatched: 0,
    podsFullyConfirmed: 0,
    podsWithProposedMappings: 0,
    podsPriceable: 0,
    podsPriceableConfirmedOnly: 0,
    exact: 0,
    alias: 0,
    proposed: 0,
    unmatched: 0,
    clampedUp: 0,
    clampedDown: 0,
    matchedRowsWithoutBand: 0,
  };

  for (const p of parsedPods) {
    podTemplates.push({
      pod_code: p.podCode,
      name: p.name,
      tower_code: p.towerCode,
      headcount: p.headcount,
      blended_level_code: p.levelCode,
      agent_mix_codes: p.agentMixCodes.join(AGENT_MIX_SEPARATOR),
      source_artifact: `${SOURCE_FILE_NAME}:${POD_SHEET}`,
      source_row: p.row.rowNumber,
      status: "active",
      version: 1,
    });
    let allMatched = true;
    let allConfirmed = true;
    let allBanded = true;
    for (const entry of p.entries) {
      const match = matchRoleLabel(entry.roleLabel, reference.roles, reference.aliases);
      let method: PodRoleMatchMethodValue;
      let roleCode: string | null;
      let ruleId = "";
      if (match.method !== "unmatched") {
        method = match.method;
        roleCode = match.roleCode;
      } else {
        const rule = proposeRoleByTower(entry.roleLabel, p.towerCode, match, rules);
        if (rule) {
          method = "proposed_by_tower";
          roleCode = rule.roleCode;
          ruleId = rule.id;
          usedRuleIds.add(rule.id);
          const key = `${p.towerCode}::${entry.roleLabel}`;
          const report = proposed.get(key) ?? {
            label: entry.roleLabel,
            towerCode: p.towerCode,
            roleCode: rule.roleCode,
            ruleId: rule.id,
            occurrences: 0,
            podCodes: [],
          };
          report.occurrences += 1;
          if (!report.podCodes.includes(p.podCode)) report.podCodes.push(p.podCode);
          proposed.set(key, report);
        } else {
          method = "unmatched";
          roleCode = null;
          const report = unmatched.get(entry.roleLabel) ?? {
            label: entry.roleLabel,
            reason: match.reason,
            candidates: match.candidates,
            occurrences: 0,
            podCodes: [],
          };
          report.occurrences += 1;
          if (!report.podCodes.includes(p.podCode)) report.podCodes.push(p.podCode);
          unmatched.set(entry.roleLabel, report);
        }
      }

      let levelCode = p.levelCode;
      let adjustment: PodLevelAdjustmentValue = "none";
      if (roleCode === null) {
        allMatched = false;
        allConfirmed = false;
        counts.unmatched += 1;
      } else {
        if (method === "exact") counts.exact += 1;
        else if (method === "alias") counts.alias += 1;
        else {
          counts.proposed += 1;
          allConfirmed = false;
        }
        const role = rolesByCode.get(roleCode) as PodLibraryReference["roles"][number];
        const clamp = clampLevelToRoleRange(p.levelCode, role, reference.levels);
        if (!clamp.ok) throw new Error(`${POD_SHEET} row ${p.row.rowNumber}: role ${roleCode}: ${clamp.error}`);
        levelCode = clamp.levelCode;
        adjustment = clamp.adjustment;
        if (adjustment === "clamped_up") counts.clampedUp += 1;
        if (adjustment === "clamped_down") counts.clampedDown += 1;
        if (!bandKeys.has(`${roleCode}::${levelCode}`)) {
          counts.matchedRowsWithoutBand += 1;
          allBanded = false;
        }
      }
      podTemplateRoles.push({
        pod_code: p.podCode,
        role_code: roleCode ?? "",
        level_code: levelCode,
        original_level_code: p.levelCode,
        level_adjustment: adjustment,
        fte: entry.fte,
        raw_role_text: entry.rawRoleText,
        match_method: method,
        mapping_status: MAPPING_STATUS_BY_MATCH_METHOD[method],
        mapping_rule_id: ruleId,
        source_row: p.row.rowNumber,
      });
    }
    if (allMatched) {
      counts.podsFullyMatched += 1;
      if (!allConfirmed) counts.podsWithProposedMappings += 1;
      if (allBanded) counts.podsPriceable += 1;
      if (allConfirmed) {
        counts.podsFullyConfirmed += 1;
        if (allBanded) counts.podsPriceableConfirmedOnly += 1;
      }
    }
  }

  const unmatchedLabels = Array.from(unmatched.values()).sort(
    (a, b) => b.occurrences - a.occurrences || byLabel(a, b),
  );
  const proposedMappings = Array.from(proposed.values()).sort(
    (a, b) =>
      b.occurrences - a.occurrences ||
      byLabel(a, b) ||
      (a.towerCode < b.towerCode ? -1 : a.towerCode > b.towerCode ? 1 : 0),
  );

  return {
    podTemplates,
    podTemplateRoles,
    agentProfiles,
    coverage: {
      podsTotal: podTemplates.length,
      podsFullyMatched: counts.podsFullyMatched,
      podsFullyConfirmed: counts.podsFullyConfirmed,
      podsWithProposedMappings: counts.podsWithProposedMappings,
      podsPriceable: counts.podsPriceable,
      podsPriceableConfirmedOnly: counts.podsPriceableConfirmedOnly,
      roleRowsTotal: podTemplateRoles.length,
      roleRowsExact: counts.exact,
      roleRowsAlias: counts.alias,
      roleRowsProposed: counts.proposed,
      roleRowsUnmatched: counts.unmatched,
      roleRowsClampedUp: counts.clampedUp,
      roleRowsClampedDown: counts.clampedDown,
      matchedRowsWithoutBand: counts.matchedRowsWithoutBand,
      unmatchedLabels,
      proposedMappings,
      unusedRuleIds: rules.map((r) => r.id).filter((id) => !usedRuleIds.has(id)),
    },
    rules,
  };
}

/** The three CSV files' exact bytes. */
export function renderPodLibraryCsvs(conversion: PodLibraryConversion): Record<string, string> {
  return {
    "pricing_pod_templates.csv": toCsv(POD_TEMPLATE_HEADERS, conversion.podTemplates),
    "pricing_pod_template_roles.csv": toCsv(POD_TEMPLATE_ROLE_HEADERS, conversion.podTemplateRoles),
    "pricing_agent_profiles.csv": toCsv(AGENT_PROFILE_HEADERS, conversion.agentProfiles),
  };
}

/** Human-readable coverage report (printed by the CLI). */
export function formatCoverageReport(coverage: PodLibraryCoverage): string {
  const c = coverage;
  const lines = [
    `Pods: ${c.podsTotal}; fully mapped: ${c.podsFullyMatched} (confirmed only: ${c.podsFullyConfirmed}; with proposed mappings: ${c.podsWithProposedMappings}); priceable: ${c.podsPriceable} (confirmed only: ${c.podsPriceableConfirmedOnly})`,
    `Role rows: ${c.roleRowsTotal} (exact ${c.roleRowsExact}, alias ${c.roleRowsAlias}, proposed ${c.roleRowsProposed}, unmatched ${c.roleRowsUnmatched})`,
    `Levels clamped into the role's allowed range: ${c.roleRowsClampedUp} up, ${c.roleRowsClampedDown} down`,
    `Matched role rows with no rate band at their level: ${c.matchedRowsWithoutBand}`,
    `Proposed mappings (${c.proposedMappings.length} tower + label pairs) — proposed_unapproved, never confirmed:`,
    ...c.proposedMappings.map(
      (m) => `  - "${m.label}" in ${m.towerCode} → ${m.roleCode} by ${m.ruleId} ×${m.occurrences} in ${m.podCodes.join(", ")}`,
    ),
    `Unmatched labels (${c.unmatchedLabels.length} distinct) — no rule names them, left unmatched:`,
    ...c.unmatchedLabels.map(
      (u) =>
        `  - "${u.label}" ×${u.occurrences} [${u.reason}${u.candidates.length > 0 ? `: ${u.candidates.join(", ")}` : ""}] in ${u.podCodes.join(", ")}`,
    ),
    `Rules that proposed nothing: ${c.unusedRuleIds.length > 0 ? c.unusedRuleIds.join(", ") : "none"}`,
  ];
  return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

/** Return a new manifest object with the pod-library section and version set; every other field is kept in place. */
export function withPodLibraryManifestSection(
  manifest: Record<string, unknown>,
  csvs: Record<string, string>,
  conversion: PodLibraryConversion,
): Record<string, unknown> {
  const rowCounts: Record<string, number> = {
    "pricing_pod_templates.csv": conversion.podTemplates.length,
    "pricing_pod_template_roles.csv": conversion.podTemplateRoles.length,
    "pricing_agent_profiles.csv": conversion.agentProfiles.length,
  };
  const checksums: Record<string, string> = {};
  for (const file of Object.keys(rowCounts)) checksums[file] = sha256Hex(csvs[file]);
  const c = conversion.coverage;
  const priorReason = manifest.version_bump_reason;
  const priorHistory = Array.isArray(manifest.previous_version_bump_reasons)
    ? (manifest.previous_version_bump_reasons as unknown[])
    : [];
  const alreadyRecorded = manifest.version === POD_LIBRARY_PACK_VERSION;
  return {
    ...manifest,
    version: POD_LIBRARY_PACK_VERSION,
    version_bump_reason:
      "ROM increment 2b (product-owner decisions 2026-10-10): pricing_pod_template_roles.csv gains original_level_code, level_adjustment, mapping_status and mapping_rule_id. Unmatched labels may be proposed a role by an explicit tower + label rule (match_method proposed_by_tower, mapping_status proposed_unapproved), and a role's level is the pod's blended level clamped into the role's allowed range. See `rom_pod_library`. The 17 taxonomy CSVs, pricing_pod_templates.csv and pricing_agent_profiles.csv are unchanged.",
    previous_version_bump_reasons: alreadyRecorded
      ? priorHistory
      : [...priorHistory, { version: manifest.version, version_bump_reason: priorReason }],
    rom_pod_library: {
      generation_script: "scripts/pricing/convert-pod-library.ts",
      source_sheets: {
        [POD_SHEET]: "header row 'ID | Pod | Tower | Role Mix | Headcount | Blended Level | Agent Mix' (B5), data rows below it",
        [AGENT_SHEET]: "header row 'Platform | Type | Monthly $ | Annual $ | Equiv Eng FTE | Util % | Productivity | Documentation | Testing | Architecture' (B5), data rows below it",
      },
      honesty_disclosure:
        "pricing_agent_profiles.csv holds product-owner planning assumptions with no external source (the sheet is labelled provider-neutral, '1.00 = no gain'). Every row is confidence=low, approval_status=global_starter_unapproved, assumption_basis=product_owner_planning_assumption_no_external_source. They are not researched benchmarks. The productivity/documentation/testing/architecture multipliers are carried for reference and applied nowhere by default; the capacity scenario (effort-engine/pod-templates.ts#agentCapacityScenario) runs only when explicitly requested and labels its output an unconfirmed planning assumption.",
      role_matching_rule:
        "Each role-mix entry ('3x Role' / 'Role x3' = fte 3, else fte 1) is matched by exact string equality against pricing_roles.csv canonical_name and pricing_role_aliases.csv alias_label. Exactly one distinct role = exact/alias, mapping_status confirmed. Otherwise, if a generic_role_rules row names the pod's tower and the exact label, the row is proposed_by_tower with that rule's role, mapping_status proposed_unapproved and mapping_rule_id set (product-owner decision 2026-10-10: proposed mapping by tower, never silent). A label naming several roles is resolved only by a rule marked resolves_ambiguity that names one of them. Anything else is unmatched with an empty role_code. No fuzzy, case-folded or similarity matching.",
      level_rule:
        "The workbook carries one blended level per pod and no per-role level. original_level_code is the pod's blended level; level_code is that level clamped into the role's allowed_level_min..allowed_level_max (product-owner decision 2026-10-10), and level_adjustment records none, clamped_up (raised to the junior bound) or clamped_down (lowered to the senior bound). An unmatched row keeps the pod's level.",
      generic_role_rules: conversion.rules.map((r) => ({
        id: r.id,
        tower_code: r.towerCode,
        labels: [...r.labels],
        role_code: r.roleCode,
        kind: r.kind,
        resolves_ambiguity: r.resolvesAmbiguity === true,
        rationale: r.rationale,
      })),
      not_imported: [
        "Delivery Pods 'Use Cases / Est. Monthly $' — a formula (headcount × Internal Cost Model) with no cached value; pod cost comes from the pod pricer.",
        "Agent Economics 'Annual $' — a formula (Monthly $ × 12) with no cached value.",
      ],
      persistence:
        "Reference pack only. No Postgres table or migration exists for these files yet; reference-pack-loader.ts reads and validates them (readPodLibraryDir / validatePodLibraryAgainstPack) but loadReferencePack does not insert them.",
      row_counts: rowCounts,
      file_checksums_sha256: checksums,
      role_match_coverage: {
        pods_total: c.podsTotal,
        pods_fully_matched: c.podsFullyMatched,
        pods_fully_confirmed: c.podsFullyConfirmed,
        pods_with_proposed_mappings: c.podsWithProposedMappings,
        pods_priceable: c.podsPriceable,
        pods_priceable_confirmed_only: c.podsPriceableConfirmedOnly,
        role_rows_total: c.roleRowsTotal,
        role_rows_exact: c.roleRowsExact,
        role_rows_alias: c.roleRowsAlias,
        role_rows_proposed: c.roleRowsProposed,
        role_rows_unmatched: c.roleRowsUnmatched,
        role_rows_clamped_up: c.roleRowsClampedUp,
        role_rows_clamped_down: c.roleRowsClampedDown,
        matched_role_rows_without_rate_band: c.matchedRowsWithoutBand,
        distinct_unmatched_labels: c.unmatchedLabels.length,
        unmatched_labels: c.unmatchedLabels.map((u) => ({ label: u.label, reason: u.reason, occurrences: u.occurrences })),
        unused_rule_ids: c.unusedRuleIds,
        ambiguous_labels: c.unmatchedLabels
          .filter((u) => u.reason === "ambiguous")
          .map((u) => ({ label: u.label, candidates: u.candidates })),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function defaultDir(): string {
  return path.resolve(__dirname, "..", "..", "datasets", "reference", "pricing-engine-v1");
}

export function loadPodLibraryReference(dir: string): PodLibraryReference {
  const read = (file: string) => readCsv(path.join(dir, file));
  return {
    towers: read("pricing_towers.csv").map((r) => ({ tower_code: r.tower_code, tower_name: r.tower_name })),
    levels: read("pricing_seniority_levels.csv").map((r) => ({
      level_code: r.level_code,
      level_name: r.level_name,
      rank: r.rank,
    })),
    roles: read("pricing_roles.csv").map((r) => ({
      role_code: r.role_code,
      canonical_name: r.canonical_name,
      status: r.status,
      allowed_level_min: r.allowed_level_min,
      allowed_level_max: r.allowed_level_max,
    })),
    aliases: read("pricing_role_aliases.csv").map((r) => ({
      role_code: r.role_code,
      alias_label: r.alias_label,
      status: r.status,
    })),
    rateBands: read("pricing_rate_bands.csv").map((r) => ({ role_code: r.role_code, level_code: r.level_code })),
  };
}

async function main() {
  const sourcePath = process.argv[2] ?? process.env.PRICING_TAXONOMY_SOURCE_XLSX;
  if (!sourcePath) {
    console.error("Usage: npx tsx scripts/pricing/convert-pod-library.ts <path-to-xlsx>");
    process.exit(1);
  }
  const dir = defaultDir();
  const manifestPath = path.join(dir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
  const expectedSha = (manifest.generated_from as { source_sha256?: string } | undefined)?.source_sha256;
  const actualSha = sha256File(sourcePath);
  if (actualSha !== expectedSha) {
    console.error(
      `Refusing: ${sourcePath} has sha256 ${actualSha}, but the pack was generated from ${expectedSha}. Import pods only from the same workbook as the rest of the pack.`,
    );
    process.exit(1);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(sourcePath);
  const sheetRows = (name: string) => {
    const ws = wb.getWorksheet(name);
    if (!ws) throw new Error(`Source workbook is missing sheet "${name}"`);
    return readSheetRows(ws);
  };

  const conversion = convertPodLibrary({
    podRows: sheetRows(POD_SHEET),
    agentRows: sheetRows(AGENT_SHEET),
    reference: loadPodLibraryReference(dir),
  });
  const csvs = renderPodLibraryCsvs(conversion);
  for (const [file, content] of Object.entries(csvs)) {
    fs.writeFileSync(path.join(dir, file), content, "utf8");
  }
  const next = withPodLibraryManifestSection(manifest, csvs, conversion);
  fs.writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");

  console.log(`Wrote ${Object.keys(csvs).join(", ")} and updated manifest.json (${dir})`);
  console.log(formatCoverageReport(conversion.coverage));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
