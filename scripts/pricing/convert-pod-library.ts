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
 * ## Role mapping is never guessed
 *
 * A pod's role mix is free text ("Data Product Mgr, Data Architect, 3x Data
 * Engineer"). Each entry is parsed deterministically (`3x Role` and
 * `Role x3` mean fte 3, otherwise fte 1) and its label is looked up, by exact
 * string equality only, against `pricing_roles.csv#canonical_name` and
 * `pricing_role_aliases.csv#alias_label`. One distinct role = `exact` or
 * `alias`. Zero roles, or more than one (an ambiguous label), = `unmatched`
 * with an empty role_code. There is no fuzzy, case-folded, abbreviation or
 * tower-based inference — an unmatched label stays unmatched until someone
 * authors an alias for it, and the script prints a coverage report.
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
 * - Each pod carries ONE blended level; the workbook has no per-role level.
 *   Every role row inherits the pod's blended level code.
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
} from "./validate-pricing-role-coverage";

const SOURCE_FILE_NAME = "Workforce_Taxonomy_Master.xlsx";
export const POD_SHEET = "Delivery Pods";
export const AGENT_SHEET = "Agent Economics";
export const POD_LIBRARY_PACK_VERSION = "1.2.0";

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
  "fte",
  "raw_role_text",
  "match_method",
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
// Conversion (pure)
// ---------------------------------------------------------------------------

export interface PodLibraryReference {
  towers: ReadonlyArray<{ tower_code: string; tower_name: string }>;
  levels: ReadonlyArray<{ level_code: string; level_name: string }>;
  roles: readonly RoleReferenceRow[];
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

export interface PodLibraryCoverage {
  podsTotal: number;
  podsFullyMatched: number;
  /** Fully matched AND every member has a rate band at the pod's blended level. */
  podsFullyMatchedWithBands: number;
  roleRowsTotal: number;
  roleRowsExact: number;
  roleRowsAlias: number;
  roleRowsUnmatched: number;
  /** Matched role rows whose role has no rate band at the pod's blended level (the pricer refuses them as `no_rate_band`). */
  matchedRowsWithoutBand: number;
  unmatchedLabels: UnmatchedLabelReport[];
}

export interface PodLibraryConversion {
  podTemplates: CsvRow[];
  podTemplateRoles: CsvRow[];
  agentProfiles: CsvRow[];
  coverage: PodLibraryCoverage;
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

/**
 * Convert the two sheets' rows into the three CSV row sets plus a coverage
 * report. Pure and deterministic: output order is pod order (pod_code) and,
 * within a pod, role-mix order. Throws on any structural defect (unknown
 * tower, level or agent type, duplicate pod code, a role mix whose FTE does
 * not sum to the pod's headcount) — but an unmatched ROLE is data, reported,
 * never an error and never guessed.
 */
export function convertPodLibrary(input: {
  podRows: readonly SheetRow[];
  agentRows: readonly SheetRow[];
  reference: PodLibraryReference;
}): PodLibraryConversion {
  const { reference } = input;
  const towerCodeByName = new Map(reference.towers.map((t) => [t.tower_name, t.tower_code]));
  const levelCodeByName = new Map(reference.levels.map((l) => [l.level_name, l.level_code]));
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
  let podsFullyMatched = 0;
  let podsFullyMatchedWithBands = 0;
  let exact = 0;
  let alias = 0;
  let unmatchedRows = 0;
  let matchedRowsWithoutBand = 0;

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
    let allBanded = true;
    for (const entry of p.entries) {
      const match = matchRoleLabel(entry.roleLabel, reference.roles, reference.aliases);
      if (match.method === "unmatched") {
        allMatched = false;
        unmatchedRows += 1;
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
      } else {
        if (match.method === "exact") exact += 1;
        else alias += 1;
        if (!bandKeys.has(`${match.roleCode}::${p.levelCode}`)) {
          matchedRowsWithoutBand += 1;
          allBanded = false;
        }
      }
      podTemplateRoles.push({
        pod_code: p.podCode,
        role_code: match.roleCode ?? "",
        level_code: p.levelCode,
        fte: entry.fte,
        raw_role_text: entry.rawRoleText,
        match_method: match.method,
        source_row: p.row.rowNumber,
      });
    }
    if (allMatched) {
      podsFullyMatched += 1;
      if (allBanded) podsFullyMatchedWithBands += 1;
    }
  }

  const unmatchedLabels = Array.from(unmatched.values()).sort(
    (a, b) => b.occurrences - a.occurrences || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0),
  );

  return {
    podTemplates,
    podTemplateRoles,
    agentProfiles,
    coverage: {
      podsTotal: podTemplates.length,
      podsFullyMatched,
      podsFullyMatchedWithBands,
      roleRowsTotal: podTemplateRoles.length,
      roleRowsExact: exact,
      roleRowsAlias: alias,
      roleRowsUnmatched: unmatchedRows,
      matchedRowsWithoutBand,
      unmatchedLabels,
    },
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
  const lines = [
    `Pods: ${coverage.podsTotal}; fully role-matched: ${coverage.podsFullyMatched}; fully matched with a rate band for every member at the pod level: ${coverage.podsFullyMatchedWithBands}`,
    `Role rows: ${coverage.roleRowsTotal} (exact ${coverage.roleRowsExact}, alias ${coverage.roleRowsAlias}, unmatched ${coverage.roleRowsUnmatched})`,
    `Matched role rows with no rate band at the pod's blended level: ${coverage.matchedRowsWithoutBand}`,
    `Unmatched labels (${coverage.unmatchedLabels.length} distinct) — left unmatched, never guessed:`,
    ...coverage.unmatchedLabels.map(
      (u) =>
        `  - "${u.label}" ×${u.occurrences} [${u.reason}${u.candidates.length > 0 ? `: ${u.candidates.join(", ")}` : ""}] in ${u.podCodes.join(", ")}`,
    ),
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
      "ROM increment 2a adds 3 files imported from two workbook sheets the PR1 converter never read: pricing_pod_templates.csv and pricing_pod_template_roles.csv (\"Delivery Pods\") and pricing_agent_profiles.csv (\"Agent Economics\"). See `rom_pod_library`. The 17 earlier CSVs are unchanged.",
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
        "Each role-mix entry ('3x Role' / 'Role x3' = fte 3, else fte 1) is matched by exact string equality against pricing_roles.csv canonical_name and pricing_role_aliases.csv alias_label. Exactly one distinct role = exact/alias; zero or several = unmatched with an empty role_code. No fuzzy, case-folded, abbreviation or tower-based matching.",
      level_rule:
        "The workbook carries one blended level per pod and no per-role level, so every role row's level_code is the pod's blended level.",
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
        pods_fully_matched_with_rate_bands_at_blended_level: c.podsFullyMatchedWithBands,
        role_rows_total: c.roleRowsTotal,
        role_rows_exact: c.roleRowsExact,
        role_rows_alias: c.roleRowsAlias,
        role_rows_unmatched: c.roleRowsUnmatched,
        matched_role_rows_without_rate_band_at_blended_level: c.matchedRowsWithoutBand,
        distinct_unmatched_labels: c.unmatchedLabels.length,
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
    levels: read("pricing_seniority_levels.csv").map((r) => ({ level_code: r.level_code, level_name: r.level_name })),
    roles: read("pricing_roles.csv").map((r) => ({
      role_code: r.role_code,
      canonical_name: r.canonical_name,
      status: r.status,
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
