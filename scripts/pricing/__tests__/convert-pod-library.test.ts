/**
 * ROM increment 2a — the pod-library converter, on a tiny in-memory workbook.
 *
 * No test here reads the source workbook (it lives outside the repository);
 * the fixture below is built with ExcelJS in memory, laid out like the real
 * "Delivery Pods" and "Agent Economics" sheets (header at B5, a formula
 * column the converter must not read), and run through the same
 * `readSheetRows` the CLI uses.
 */
import path from "node:path";
import { describe, expect, it } from "@jest/globals";
import ExcelJS from "exceljs";
import fs from "node:fs";
import { readCsv, sha256Hex } from "../csv-utils";
import {
  AGENT_SHEET,
  POD_LIBRARY_PACK_VERSION,
  POD_SHEET,
  GENERIC_ROLE_RULES,
  convertPodLibrary,
  decodeXmlEntities,
  formatCoverageReport,
  loadPodLibraryReference,
  matchRoleLabel,
  parseAgentMix,
  parseRoleMix,
  readSheetRows,
  renderPodLibraryCsvs,
  validateGenericRoleRules,
  withPodLibraryManifestSection,
  type GenericRoleRule,
  type PodLibraryReference,
  type SheetRow,
} from "../convert-pod-library";

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const REFERENCE: PodLibraryReference = {
  towers: [
    { tower_code: "TWR-04", tower_name: "Data & Analytics" },
    { tower_code: "TWR-09", tower_name: "Cloud" },
  ],
  levels: [
    { level_code: "LVL-06", level_name: "Manager", rank: "6" },
    { level_code: "LVL-07", level_name: "Lead", rank: "7" },
    { level_code: "LVL-08", level_name: "Senior", rank: "8" },
    { level_code: "LVL-09", level_name: "Intermediate", rank: "9" },
  ],
  roles: [
    { role_code: "ROL-023", canonical_name: "Data Architect", status: "active", allowed_level_min: "Senior", allowed_level_max: "Lead" },
    { role_code: "ROL-037", canonical_name: "Data Engineer", status: "active", allowed_level_min: "Intermediate", allowed_level_max: "Manager" },
    { role_code: "ROL-041", canonical_name: "BI Developer", status: "active", allowed_level_min: "Intermediate", allowed_level_max: "Senior" },
    { role_code: "ROL-101", canonical_name: "Platform Engineer", status: "active", allowed_level_min: "Intermediate", allowed_level_max: "Lead" },
    { role_code: "ROL-120", canonical_name: "Automation Engineer", status: "active", allowed_level_min: "Intermediate", allowed_level_max: "Senior" },
    { role_code: "ROL-020", canonical_name: "Automation Engineer", status: "active", allowed_level_min: "Intermediate", allowed_level_max: "Senior" },
    { role_code: "ROL-500", canonical_name: "R&D Analyst", status: "active", allowed_level_min: "Intermediate", allowed_level_max: "Senior" },
    { role_code: "ROL-900", canonical_name: "Retired Role", status: "retired", allowed_level_min: "Intermediate", allowed_level_max: "Senior" },
  ],
  aliases: [{ role_code: "ROL-037", alias_label: "Senior Data Engineer", status: "active" }],
  rateBands: [
    { role_code: "ROL-023", level_code: "LVL-08" },
    { role_code: "ROL-037", level_code: "LVL-08" },
    { role_code: "ROL-101", level_code: "LVL-07" },
  ],
};

type PodLine = [string, string, string, string, number, string, string];

const POD_HEADER = ["ID", "Pod", "Tower", "Role Mix", "Headcount", "Blended Level", "Agent Mix", "Use Cases / Est. Monthly $"];
const AGENT_HEADER = [
  "Platform", "Type", "Monthly $", "Annual $", "Equiv Eng FTE", "Util %",
  "Productivity", "Documentation", "Testing", "Architecture",
];

/** Pods deliberately out of code order, to prove the output is sorted. */
const DEFAULT_PODS: PodLine[] = [
  ["POD-003", "Platform Pod", "Cloud", "Platform Engineer x2", 2, "Lead", ""],
  ["POD-001", "Data Pod", "Data & Analytics", "Data Architect, 3x Senior Data Engineer, BI Dev", 5, "Senior", "Agent Platform B + AbarVa Agents"],
  ["POD-002", "Quality Pod", "Data & Analytics", "2x Automation Engineer, R&amp;D Analyst", 3, "Senior", "Agent Platform B"],
];

const DEFAULT_AGENTS: Array<[string, string, number, number, number, number, number, number, number]> = [
  ["Agent Platform B", "Coding agent", 4000, 1.2, 0.75, 1.8, 1.5, 1.9, 1.25],
  ["AbarVa Agents", "AbarVa-native delivery agents", 3500, 1.3, 0.72, 1.85, 1.65, 1.8, 1.4],
];

function buildSheets(pods: PodLine[] = DEFAULT_PODS, agents = DEFAULT_AGENTS): {
  podRows: SheetRow[];
  agentRows: SheetRow[];
} {
  const wb = new ExcelJS.Workbook();
  const podWs = wb.addWorksheet(POD_SHEET);
  podWs.getCell("B2").value = "DELIVERY POD LIBRARY";
  POD_HEADER.forEach((label, i) => (podWs.getRow(5).getCell(i + 2).value = label));
  pods.forEach((pod, n) => {
    const row = podWs.getRow(6 + n);
    pod.forEach((value, i) => (row.getCell(i + 2).value = value === "" ? null : value));
    row.getCell(9).value = { formula: `F${6 + n}*1000/12` } as ExcelJS.CellFormulaValue;
  });
  const agentWs = wb.addWorksheet(AGENT_SHEET);
  agentWs.getCell("B2").value = "AI AGENT ECONOMICS (provider-neutral)";
  AGENT_HEADER.forEach((label, i) => (agentWs.getRow(5).getCell(i + 2).value = label));
  agents.forEach((a, n) => {
    const row = agentWs.getRow(6 + n);
    const [name, type, monthly, equiv, util, prod, doc, test, arch] = a;
    [name, type, monthly].forEach((v, i) => (row.getCell(i + 2).value = v));
    row.getCell(5).value = { formula: `D${6 + n}*12` } as ExcelJS.CellFormulaValue;
    [equiv, util, prod, doc, test, arch].forEach((v, i) => (row.getCell(i + 6).value = v));
  });
  return { podRows: readSheetRows(podWs), agentRows: readSheetRows(agentWs) };
}

/** No generic-role rules unless a test passes some: GENERIC_ROLE_RULES names towers and roles this fixture does not have. */
function convert(pods?: PodLine[], agents?: typeof DEFAULT_AGENTS, rules: readonly GenericRoleRule[] = []) {
  return convertPodLibrary({ ...buildSheets(pods, agents), reference: REFERENCE, rules });
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

describe("parseRoleMix", () => {
  it("reads '3x Role', 'Role x2', spaced forms and bare entries, split on commas", () => {
    expect(parseRoleMix("Data Product Mgr, Data Architect, 3x Data Engineer,BI Dev")).toEqual([
      { rawRoleText: "Data Product Mgr", roleLabel: "Data Product Mgr", fte: 1 },
      { rawRoleText: "Data Architect", roleLabel: "Data Architect", fte: 1 },
      { rawRoleText: "3x Data Engineer", roleLabel: "Data Engineer", fte: 3 },
      { rawRoleText: "BI Dev", roleLabel: "BI Dev", fte: 1 },
    ]);
    expect(parseRoleMix("Streaming Engineer x2, Kafka Engineer x 3, 4 x SDET")).toEqual([
      { rawRoleText: "Streaming Engineer x2", roleLabel: "Streaming Engineer", fte: 2 },
      { rawRoleText: "Kafka Engineer x 3", roleLabel: "Kafka Engineer", fte: 3 },
      { rawRoleText: "4 x SDET", roleLabel: "SDET", fte: 4 },
    ]);
  });

  it("keeps a parenthetical with its role and normalizes whitespace", () => {
    expect(parseRoleMix("  AMS Architect ,  2x   L3 (Cloud), 3x L2")).toEqual([
      { rawRoleText: "AMS Architect", roleLabel: "AMS Architect", fte: 1 },
      { rawRoleText: "2x L3 (Cloud)", roleLabel: "L3 (Cloud)", fte: 2 },
      { rawRoleText: "3x L2", roleLabel: "L2", fte: 3 },
    ]);
  });

  it("decodes &amp; and does not split on it", () => {
    expect(parseRoleMix("R&amp;D Analyst, 2x Backup &amp; DR Engineer")).toEqual([
      { rawRoleText: "R&D Analyst", roleLabel: "R&D Analyst", fte: 1 },
      { rawRoleText: "2x Backup & DR Engineer", roleLabel: "Backup & DR Engineer", fte: 2 },
    ]);
  });

  it("does not read a multiplier out of a role name that merely contains an x", () => {
    expect(parseRoleMix("Experience Lead, UX Designer")).toEqual([
      { rawRoleText: "Experience Lead", roleLabel: "Experience Lead", fte: 1 },
      { rawRoleText: "UX Designer", roleLabel: "UX Designer", fte: 1 },
    ]);
  });

  it("refuses an empty entry, a two-sided multiplier, a zero multiplier and an empty mix", () => {
    expect(() => parseRoleMix("Data Architect, , BI Dev")).toThrow(/empty entry/);
    expect(() => parseRoleMix("Data Architect,")).toThrow(/empty entry/);
    expect(() => parseRoleMix("2x Data Engineer x3")).toThrow(/both sides/);
    expect(() => parseRoleMix("0x Data Engineer")).toThrow(/non-positive/);
    expect(() => parseRoleMix("   ")).toThrow(/empty/);
  });
});

describe("decodeXmlEntities", () => {
  it("decodes the five entities in a single pass", () => {
    expect(decodeXmlEntities("A &amp; B &lt;C&gt; &quot;D&quot; &apos;E&apos;")).toBe(`A & B <C> "D" 'E'`);
    expect(decodeXmlEntities("&amp;lt;")).toBe("&lt;");
  });
});

describe("parseAgentMix", () => {
  it("splits on '+' in source order; an empty cell is no agents", () => {
    expect(parseAgentMix("Agent Platform B + AbarVa Agents")).toEqual(["Agent Platform B", "AbarVa Agents"]);
    expect(parseAgentMix("")).toEqual([]);
    expect(() => parseAgentMix("Agent Platform B + ")).toThrow(/empty entry/);
  });
});

// ---------------------------------------------------------------------------
// Matching — never guessed
// ---------------------------------------------------------------------------

describe("matchRoleLabel", () => {
  const { roles, aliases } = REFERENCE;

  it("matches a canonical name exactly and an alias label exactly", () => {
    expect(matchRoleLabel("Data Architect", roles, aliases)).toEqual({ method: "exact", roleCode: "ROL-023" });
    expect(matchRoleLabel("Senior Data Engineer", roles, aliases)).toEqual({ method: "alias", roleCode: "ROL-037" });
  });

  it("leaves an unknown, abbreviated or differently-cased label unmatched", () => {
    for (const label of ["BI Dev", "Data Eng", "data architect", "Data Architect "]) {
      expect(matchRoleLabel(label, roles, aliases)).toEqual({
        method: "unmatched",
        roleCode: null,
        reason: "no_match",
        candidates: [],
      });
    }
  });

  it("leaves a label naming two roles unmatched and lists both", () => {
    expect(matchRoleLabel("Automation Engineer", roles, aliases)).toEqual({
      method: "unmatched",
      roleCode: null,
      reason: "ambiguous",
      candidates: ["ROL-020", "ROL-120"],
    });
    const aliasClash = [...aliases, { role_code: "ROL-023", alias_label: "Data Engineer", status: "active" }];
    expect(matchRoleLabel("Data Engineer", roles, aliasClash)).toMatchObject({
      method: "unmatched",
      reason: "ambiguous",
      candidates: ["ROL-023", "ROL-037"],
    });
  });

  it("ignores retired roles and inactive aliases", () => {
    expect(matchRoleLabel("Retired Role", roles, aliases)).toMatchObject({ method: "unmatched", reason: "no_match" });
    const retiredAlias = [{ role_code: "ROL-037", alias_label: "Old Label", status: "retired" }];
    expect(matchRoleLabel("Old Label", roles, retiredAlias)).toMatchObject({ method: "unmatched" });
  });
});

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

describe("convertPodLibrary on an in-memory workbook", () => {
  it("emits pods in code order with tower, level and agent codes", () => {
    const out = convert();
    expect(out.podTemplates).toEqual([
      {
        pod_code: "POD-001",
        name: "Data Pod",
        tower_code: "TWR-04",
        headcount: 5,
        blended_level_code: "LVL-08",
        agent_mix_codes: "AGENT-B|AGENT-ABARVA",
        source_artifact: "Workforce_Taxonomy_Master.xlsx:Delivery Pods",
        source_row: 7,
        status: "active",
        version: 1,
      },
      expect.objectContaining({ pod_code: "POD-002", agent_mix_codes: "AGENT-B", source_row: 8 }),
      expect.objectContaining({ pod_code: "POD-003", tower_code: "TWR-09", blended_level_code: "LVL-07", agent_mix_codes: "", source_row: 6 }),
    ]);
  });

  it("emits one role row per mix entry at the pod level (inside every role's range here); unmatched rows carry no role code", () => {
    const out = convert();
    const row = (pod: string, role: string, level: string, fte: number, raw: string, method: string, status: string, sourceRow: number) => ({
      pod_code: pod, role_code: role, level_code: level, original_level_code: level, level_adjustment: "none",
      fte, raw_role_text: raw, match_method: method, mapping_status: status, mapping_rule_id: "", source_row: sourceRow,
    });
    expect(out.podTemplateRoles).toEqual([
      row("POD-001", "ROL-023", "LVL-08", 1, "Data Architect", "exact", "confirmed", 7),
      row("POD-001", "ROL-037", "LVL-08", 3, "3x Senior Data Engineer", "alias", "confirmed", 7),
      row("POD-001", "", "LVL-08", 1, "BI Dev", "unmatched", "unmatched", 7),
      row("POD-002", "", "LVL-08", 2, "2x Automation Engineer", "unmatched", "unmatched", 8),
      row("POD-002", "ROL-500", "LVL-08", 1, "R&D Analyst", "exact", "confirmed", 8),
      row("POD-003", "ROL-101", "LVL-07", 2, "Platform Engineer x2", "exact", "confirmed", 6),
    ]);
  });

  it("reports coverage and every unmatched label with its reason, never a guessed code", () => {
    const { coverage } = convert();
    expect(coverage).toEqual({
      podsTotal: 3,
      podsFullyMatched: 1,
      podsFullyConfirmed: 1,
      podsWithProposedMappings: 0,
      podsPriceable: 1,
      podsPriceableConfirmedOnly: 1,
      roleRowsTotal: 6,
      roleRowsExact: 3,
      roleRowsAlias: 1,
      roleRowsProposed: 0,
      roleRowsUnmatched: 2,
      roleRowsClampedUp: 0,
      roleRowsClampedDown: 0,
      matchedRowsWithoutBand: 1, // ROL-500 has no band at LVL-08
      unmatchedLabels: [
        { label: "Automation Engineer", reason: "ambiguous", candidates: ["ROL-020", "ROL-120"], occurrences: 1, podCodes: ["POD-002"] },
        { label: "BI Dev", reason: "no_match", candidates: [], occurrences: 1, podCodes: ["POD-001"] },
      ],
      proposedMappings: [],
      unusedRuleIds: [],
    });
    const report = formatCoverageReport(coverage);
    expect(report).toContain("Pods: 3; fully mapped: 1 (confirmed only: 1; with proposed mappings: 0); priceable: 1 (confirmed only: 1)");
    expect(report).toContain('"Automation Engineer" ×1 [ambiguous: ROL-020, ROL-120] in POD-002');
    expect(report).toContain('"BI Dev" ×1 [no_match] in POD-001');
    expect(report).toContain("Rules that proposed nothing: none");
  });

  it("counts a fully matched pod without a band for a member as matched but not priceable", () => {
    const { coverage } = convert([["POD-009", "R&amp;D Pod", "Data & Analytics", "R&amp;D Analyst", 1, "Senior", ""]]);
    expect(coverage.podsFullyMatched).toBe(1);
    expect(coverage.podsPriceable).toBe(0);
    expect(coverage.podsPriceableConfirmedOnly).toBe(0);
  });

  it("emits agent profiles labelled as unapproved, low-confidence planning assumptions", () => {
    const out = convert();
    expect(out.agentProfiles).toEqual([
      {
        agent_code: "AGENT-B",
        name: "Agent Platform B",
        agent_type: "Coding agent",
        monthly_cost_usd: 4000,
        equiv_eng_fte: 1.2,
        utilization: 0.75,
        productivity: 1.8,
        documentation: 1.5,
        testing: 1.9,
        architecture: 1.25,
        assumption_basis: "product_owner_planning_assumption_no_external_source",
        source_artifact: "Workforce_Taxonomy_Master.xlsx:Agent Economics",
        source_row: 6,
        confidence: "low",
        approval_status: "global_starter_unapproved",
      },
      expect.objectContaining({ agent_code: "AGENT-ABARVA", equiv_eng_fte: 1.3, utilization: 0.72, source_row: 7 }),
    ]);
  });

  it("is deterministic: the same sheets render byte-identical CSVs", () => {
    const first = renderPodLibraryCsvs(convert());
    const second = renderPodLibraryCsvs(convert());
    expect(second).toEqual(first);
    expect(first["pricing_pod_template_roles.csv"].split("\n")[0]).toBe(
      "pod_code,role_code,level_code,original_level_code,level_adjustment,fte,raw_role_text,match_method,mapping_status,mapping_rule_id,source_row",
    );
    expect(first["pricing_pod_templates.csv"]).toContain("POD-001,Data Pod,TWR-04,5,LVL-08,AGENT-B|AGENT-ABARVA,");
    expect(first["pricing_pod_templates.csv"].endsWith("\n")).toBe(true);
  });

  it("refuses structural defects rather than reading around them", () => {
    expect(() => convert([["POD-001", "X", "Nowhere", "Data Architect", 1, "Senior", ""]])).toThrow(/tower "Nowhere"/);
    expect(() => convert([["POD-001", "X", "Cloud", "Data Architect", 1, "Wizard", ""]])).toThrow(/blended level "Wizard"/);
    expect(() => convert([["POD-001", "X", "Cloud", "Data Architect", 2, "Senior", ""]])).toThrow(/sums to 1 FTE but Headcount is 2/);
    expect(() => convert([["POD-001", "X", "Cloud", "Data Architect", 1, "Senior", "Agent Platform Z"]])).toThrow(/Agent Platform Z/);
    expect(() =>
      convert([
        ["POD-001", "X", "Cloud", "Data Architect", 1, "Senior", ""],
        ["POD-001", "Y", "Cloud", "Data Architect", 1, "Senior", ""],
      ]),
    ).toThrow(/duplicate pod code "POD-001"/);
    expect(() => convert(undefined, [["Agent Platform Q", "?", 1, 1, 0.5, 1, 1, 1, 1]])).toThrow(/Agent Platform Q/);
    expect(() => convert(undefined, [["Agent Platform B", "?", 1, 1, 75, 1, 1, 1, 1]])).toThrow(/Util %/);
  });

  it("reads data rows only up to the first row with a blank ID", () => {
    const sheets = buildSheets();
    const last = sheets.podRows[sheets.podRows.length - 1].rowNumber;
    const blank = Array.from({ length: 10 }, () => "");
    const podRows = [
      ...sheets.podRows,
      { rowNumber: last + 1, cells: ["", "footnote", ...blank.slice(2)] },
      { rowNumber: last + 2, cells: ["NOTE", "not a pod", ...blank.slice(2)] },
    ];
    const out = convertPodLibrary({ ...sheets, podRows, reference: REFERENCE, rules: [] });
    expect(out.podTemplates.map((p) => p.pod_code)).toEqual(["POD-001", "POD-002", "POD-003"]);
  });

  it("orders unmatched labels by occurrences, then label, and lists each pod once", () => {
    const { coverage } = convert([
      ["POD-001", "A", "Cloud", "BI Dev, BI Dev", 2, "Senior", ""],
      ["POD-002", "B", "Cloud", "Analyst, BI Dev", 2, "Senior", ""],
    ]);
    expect(coverage.unmatchedLabels.map((u) => [u.label, u.occurrences, u.podCodes])).toEqual([
      ["BI Dev", 3, ["POD-001", "POD-002"]],
      ["Analyst", 1, ["POD-002"]],
    ]);
  });

  it("refuses an agent type listed twice", () => {
    expect(() => convert(undefined, [DEFAULT_AGENTS[0], DEFAULT_AGENTS[0]])).toThrow(/"Agent Platform B" appears twice/);
  });

  it("refuses a sheet whose header labels have drifted", () => {
    const sheets = buildSheets();
    const drifted = sheets.podRows.map((r) =>
      r.cells[0] === "ID" ? { ...r, cells: r.cells.map((c) => (c === "Role Mix" ? "Roles" : c)) } : r,
    );
    expect(() => convertPodLibrary({ ...sheets, podRows: drifted, reference: REFERENCE, rules: [] })).toThrow(
      /expected column 5 header "Role Mix", found "Roles"/,
    );
  });
});

describe("withPodLibraryManifestSection", () => {
  const base = { dataset_id: "pricing-engine-v1", version: "1.1.0", version_bump_reason: "PR4 reason", row_counts: { a: 1 } };

  it("bumps the version, keeps every other field and the prior reason, and checksums the CSVs it is given", () => {
    const conversion = convert();
    const csvs = renderPodLibraryCsvs(conversion);
    const next = withPodLibraryManifestSection(base, csvs, conversion);
    expect(next.version).toBe(POD_LIBRARY_PACK_VERSION);
    expect(next.dataset_id).toBe("pricing-engine-v1");
    expect(next.row_counts).toEqual({ a: 1 });
    expect(next.previous_version_bump_reasons).toEqual([{ version: "1.1.0", version_bump_reason: "PR4 reason" }]);
    const section = next.rom_pod_library as Record<string, Record<string, unknown>>;
    expect(section.row_counts).toEqual({
      "pricing_pod_templates.csv": 3,
      "pricing_pod_template_roles.csv": 6,
      "pricing_agent_profiles.csv": 2,
    });
    expect(section.file_checksums_sha256["pricing_pod_templates.csv"]).toBe(sha256Hex(csvs["pricing_pod_templates.csv"]));
    expect(section.role_match_coverage).toMatchObject({
      pods_total: 3,
      pods_fully_matched: 1,
      role_rows_unmatched: 2,
      ambiguous_labels: [{ label: "Automation Engineer", candidates: ["ROL-020", "ROL-120"] }],
    });
  });

  it("is idempotent: applying it to its own output changes nothing", () => {
    const conversion = convert();
    const csvs = renderPodLibraryCsvs(conversion);
    const once = withPodLibraryManifestSection(base, csvs, conversion);
    const twice = withPodLibraryManifestSection(once, csvs, conversion);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });
});

// ---------------------------------------------------------------------------
// Generic-role rules — proposed mapping by tower, never silent
// ---------------------------------------------------------------------------

const FIXTURE_RULES: GenericRoleRule[] = [
  { id: "GR-T1", towerCode: "TWR-04", labels: ["BI Dev"], roleCode: "ROL-041", kind: "abbreviation", rationale: "BI Developer" },
  { id: "GR-T2", towerCode: "TWR-04", labels: ["Automation Engineer"], roleCode: "ROL-120", kind: "ambiguity_resolution", resolvesAmbiguity: true, rationale: "the QE one" },
  { id: "GR-T3", towerCode: "TWR-09", labels: ["Engineer", "Developer"], roleCode: "ROL-101", kind: "generic_family", rationale: "generic engineer" },
];

function rolesOf(out: ReturnType<typeof convert>, pod: string) {
  return out.podTemplateRoles.filter((r) => r.pod_code === pod);
}

describe("generic-role rules on the fixture", () => {
  it("proposes the rule's role for an unmatched label in the rule's tower, as proposed_unapproved naming the rule", () => {
    const out = convert(undefined, undefined, FIXTURE_RULES);
    expect(rolesOf(out, "POD-001")[2]).toEqual({
      pod_code: "POD-001", role_code: "ROL-041", level_code: "LVL-08", original_level_code: "LVL-08", level_adjustment: "none",
      fte: 1, raw_role_text: "BI Dev", match_method: "proposed_by_tower", mapping_status: "proposed_unapproved",
      mapping_rule_id: "GR-T1", source_row: 7,
    });
    // Confirmed rows are untouched by the rules.
    expect(rolesOf(out, "POD-001").slice(0, 2).map((r) => [r.match_method, r.mapping_status, r.mapping_rule_id])).toEqual([
      ["exact", "confirmed", ""],
      ["alias", "confirmed", ""],
    ]);
    expect(out.coverage).toMatchObject({
      podsFullyMatched: 3,
      podsFullyConfirmed: 1,
      podsWithProposedMappings: 2,
      podsPriceable: 1, // ROL-041, ROL-120 and ROL-500 have no band at LVL-08
      podsPriceableConfirmedOnly: 1,
      roleRowsExact: 3,
      roleRowsAlias: 1,
      roleRowsProposed: 2,
      roleRowsUnmatched: 0,
      matchedRowsWithoutBand: 3,
      unmatchedLabels: [],
      proposedMappings: [
        { label: "Automation Engineer", towerCode: "TWR-04", roleCode: "ROL-120", ruleId: "GR-T2", occurrences: 1, podCodes: ["POD-002"] },
        { label: "BI Dev", towerCode: "TWR-04", roleCode: "ROL-041", ruleId: "GR-T1", occurrences: 1, podCodes: ["POD-001"] },
      ],
      unusedRuleIds: ["GR-T3"],
    });
    const report = formatCoverageReport(out.coverage);
    expect(report).toContain('"BI Dev" in TWR-04 → ROL-041 by GR-T1 ×1 in POD-001');
    expect(report).toContain("Rules that proposed nothing: GR-T3");
    expect(report).toContain("Role rows: 6 (exact 3, alias 1, proposed 2, unmatched 0)");
  });

  it("a rule fires only in its own tower and only on the exact label", () => {
    const out = convert(
      [
        ["POD-001", "A", "Cloud", "BI Dev, Engineer, Developer, engineer", 4, "Lead", ""],
        ["POD-002", "B", "Data & Analytics", "Engineer, bi dev, BI  Dev", 3, "Senior", ""],
      ],
      undefined,
      FIXTURE_RULES,
    );
    expect(out.podTemplateRoles.map((r) => [r.pod_code, r.raw_role_text, r.role_code, r.match_method, r.mapping_rule_id])).toEqual([
      ["POD-001", "BI Dev", "", "unmatched", ""],
      ["POD-001", "Engineer", "ROL-101", "proposed_by_tower", "GR-T3"],
      ["POD-001", "Developer", "ROL-101", "proposed_by_tower", "GR-T3"],
      ["POD-001", "engineer", "", "unmatched", ""],
      ["POD-002", "Engineer", "", "unmatched", ""],
      ["POD-002", "bi dev", "", "unmatched", ""],
      // Whitespace is normalized by the parser before matching, so this IS the rule's label.
      ["POD-002", "BI Dev", "ROL-041", "proposed_by_tower", "GR-T1"],
    ]);
    expect(out.coverage.proposedMappings.map((m) => [m.label, m.towerCode, m.occurrences])).toEqual([
      ["BI Dev", "TWR-04", 1],
      ["Developer", "TWR-09", 1],
      ["Engineer", "TWR-09", 1],
    ]);
  });

  it("orders proposed mappings by occurrences, then label, and lists each pod once", () => {
    const { coverage } = convert(
      [
        ["POD-001", "A", "Data & Analytics", "BI Dev, BI Dev", 2, "Senior", ""],
        ["POD-002", "B", "Data & Analytics", "Automation Engineer, BI Dev", 2, "Senior", ""],
      ],
      undefined,
      FIXTURE_RULES,
    );
    expect(coverage.proposedMappings.map((m) => [m.label, m.occurrences, m.podCodes])).toEqual([
      ["BI Dev", 3, ["POD-001", "POD-002"]],
      ["Automation Engineer", 1, ["POD-002"]],
    ]);
  });

  it("never overrides a confirmed match: a rule naming a canonical label proposes nothing", () => {
    const rules: GenericRoleRule[] = [
      { id: "GR-X", towerCode: "TWR-04", labels: ["Data Architect"], roleCode: "ROL-041", kind: "abbreviation", rationale: "x" },
    ];
    const out = convert(undefined, undefined, rules);
    expect(rolesOf(out, "POD-001")[0]).toMatchObject({ role_code: "ROL-023", match_method: "exact", mapping_status: "confirmed" });
    expect(out.coverage.unusedRuleIds).toEqual(["GR-X"]);
  });

  it("an ambiguous label is resolved only by a rule that says so, and only to one of its candidates", () => {
    const silent: GenericRoleRule[] = [{ ...FIXTURE_RULES[1], resolvesAmbiguity: undefined }];
    const stays = convert(undefined, undefined, silent);
    expect(rolesOf(stays, "POD-002")[0]).toMatchObject({ role_code: "", match_method: "unmatched", mapping_status: "unmatched" });
    expect(stays.coverage.unmatchedLabels[0]).toMatchObject({ label: "Automation Engineer", reason: "ambiguous" });
    expect(stays.coverage.unusedRuleIds).toEqual(["GR-T2"]);

    const resolved = convert(undefined, undefined, [FIXTURE_RULES[1]]);
    expect(rolesOf(resolved, "POD-002")[0]).toMatchObject({ role_code: "ROL-120", match_method: "proposed_by_tower", mapping_rule_id: "GR-T2" });

    const notACandidate: GenericRoleRule[] = [{ ...FIXTURE_RULES[1], roleCode: "ROL-041" }];
    expect(() => convert(undefined, undefined, notACandidate)).toThrow(
      /GR-T2: resolves ambiguous label "Automation Engineer" to ROL-041, which is not one of its candidates \(ROL-020, ROL-120\)/,
    );
  });

  it.each([
    ["a blank id", [{ ...FIXTURE_RULES[0], id: " " }], /a rule has a blank id/],
    ["a duplicate id", [FIXTURE_RULES[0], { ...FIXTURE_RULES[1], id: "GR-T1" }], /duplicate rule id "GR-T1"/],
    ["an unknown tower", [{ ...FIXTURE_RULES[0], towerCode: "TWR-99" }], /GR-T1: unknown tower_code "TWR-99"/],
    ["an unknown role", [{ ...FIXTURE_RULES[0], roleCode: "ROL-404" }], /GR-T1: role_code "ROL-404" is not an active role/],
    ["a retired role", [{ ...FIXTURE_RULES[0], roleCode: "ROL-900" }], /GR-T1: role_code "ROL-900" is not an active role/],
    ["no labels", [{ ...FIXTURE_RULES[0], labels: [] }], /GR-T1: no labels/],
    [
      "two rules claiming one tower + label",
      [FIXTURE_RULES[0], { ...FIXTURE_RULES[2], id: "GR-T9", towerCode: "TWR-04", labels: ["Steward", "BI Dev"] }],
      /GR-T9: tower TWR-04 label "BI Dev" is already claimed by GR-T1/,
    ],
  ])("refuses a rule table with %s", (_label, rules, pattern) => {
    expect(() => convert(undefined, undefined, rules as GenericRoleRule[])).toThrow(pattern);
  });

  it("the same label may have different rules in different towers", () => {
    expect(() =>
      validateGenericRoleRules(
        [FIXTURE_RULES[2], { ...FIXTURE_RULES[2], id: "GR-T4", towerCode: "TWR-04" }],
        REFERENCE,
      ),
    ).not.toThrow();
  });

  it("is deterministic and independent of the rule table's order", () => {
    const forward = renderPodLibraryCsvs(convert(undefined, undefined, FIXTURE_RULES));
    const again = renderPodLibraryCsvs(convert(undefined, undefined, FIXTURE_RULES));
    const reversed = renderPodLibraryCsvs(convert(undefined, undefined, [...FIXTURE_RULES].reverse()));
    expect(again).toEqual(forward);
    expect(reversed).toEqual(forward);
  });
});

// ---------------------------------------------------------------------------
// Level clamping
// ---------------------------------------------------------------------------

describe("level clamping into the role's allowed range", () => {
  // Data Architect (ROL-023) is allowed Senior (LVL-08) .. Lead (LVL-07); its only band is at LVL-08.
  const out = convert(
    [
      ["POD-001", "Too junior", "Data & Analytics", "Data Architect, Mystery Role", 2, "Intermediate", ""],
      ["POD-002", "Too senior", "Data & Analytics", "Data Architect, BI Dev", 2, "Manager", ""],
      ["POD-003", "In range", "Data & Analytics", "Data Architect", 1, "Senior", ""],
    ],
    undefined,
    FIXTURE_RULES,
  );

  it("raises a level below the role's junior bound and lowers one above its senior bound, keeping the original", () => {
    expect(out.podTemplateRoles.map((r) => [r.pod_code, r.raw_role_text, r.original_level_code, r.level_code, r.level_adjustment])).toEqual([
      ["POD-001", "Data Architect", "LVL-09", "LVL-08", "clamped_up"],
      ["POD-001", "Mystery Role", "LVL-09", "LVL-09", "none"], // unmatched: keeps the pod level
      ["POD-002", "Data Architect", "LVL-06", "LVL-07", "clamped_down"],
      ["POD-002", "BI Dev", "LVL-06", "LVL-08", "clamped_down"], // a proposed role is clamped too
      ["POD-003", "Data Architect", "LVL-08", "LVL-08", "none"],
    ]);
  });

  it("counts clamps and checks the band at the clamped level", () => {
    expect(out.coverage).toMatchObject({
      roleRowsClampedUp: 1,
      roleRowsClampedDown: 2,
      // ROL-023 at LVL-07 and ROL-041 at LVL-08 have no band; ROL-023 at LVL-08 has one.
      matchedRowsWithoutBand: 2,
      podsFullyMatched: 2,
      podsPriceable: 1,
    });
    expect(formatCoverageReport(out.coverage)).toContain("Levels clamped into the role's allowed range: 1 up, 2 down");
  });

  it("refuses a matched role whose allowed range names an unknown level, or runs backwards", () => {
    const withRange = (min: string, max: string): PodLibraryReference => ({
      ...REFERENCE,
      roles: REFERENCE.roles.map((r) => (r.role_code === "ROL-023" ? { ...r, allowed_level_min: min, allowed_level_max: max } : r)),
    });
    const pods: PodLine[] = [["POD-001", "A", "Data & Analytics", "Data Architect", 1, "Senior", ""]];
    expect(() => convertPodLibrary({ ...buildSheets(pods), reference: withRange("Wizard", "Lead"), rules: [] })).toThrow(
      /role ROL-023: allowed level range "Wizard".."Lead" names a level that is not in pricing_seniority_levels.csv/,
    );
    expect(() => convertPodLibrary({ ...buildSheets(pods), reference: withRange("Lead", "Senior"), rules: [] })).toThrow(
      /role ROL-023: allowed level range "Lead".."Senior" has its minimum more senior than its maximum/,
    );
  });
});

describe("withPodLibraryManifestSection records the rules and the new coverage", () => {
  it("lists every applied rule and the proposal / clamp counts", () => {
    const conversion = convert(undefined, undefined, FIXTURE_RULES);
    const next = withPodLibraryManifestSection({ version: "1.2.0", version_bump_reason: "2a" }, renderPodLibraryCsvs(conversion), conversion);
    const section = next.rom_pod_library as Record<string, unknown>;
    expect(section.generic_role_rules).toEqual([
      { id: "GR-T1", tower_code: "TWR-04", labels: ["BI Dev"], role_code: "ROL-041", kind: "abbreviation", resolves_ambiguity: false, rationale: "BI Developer" },
      { id: "GR-T2", tower_code: "TWR-04", labels: ["Automation Engineer"], role_code: "ROL-120", kind: "ambiguity_resolution", resolves_ambiguity: true, rationale: "the QE one" },
      { id: "GR-T3", tower_code: "TWR-09", labels: ["Engineer", "Developer"], role_code: "ROL-101", kind: "generic_family", resolves_ambiguity: false, rationale: "generic engineer" },
    ]);
    expect(section.role_match_coverage).toMatchObject({
      pods_fully_matched: 3,
      pods_fully_confirmed: 1,
      pods_with_proposed_mappings: 2,
      pods_priceable: 1,
      pods_priceable_confirmed_only: 1,
      role_rows_proposed: 2,
      role_rows_unmatched: 0,
      role_rows_clamped_up: 0,
      role_rows_clamped_down: 0,
      unused_rule_ids: ["GR-T3"],
    });
    expect(next.previous_version_bump_reasons).toEqual([{ version: "1.2.0", version_bump_reason: "2a" }]);
  });
});

// ---------------------------------------------------------------------------
// The real rule table against the committed reference pack (no workbook read)
// ---------------------------------------------------------------------------

describe("GENERIC_ROLE_RULES against the committed reference pack", () => {
  const REAL = loadPodLibraryReference(path.resolve(__dirname, "..", "..", "..", "datasets", "reference", "pricing-engine-v1"));
  const towerName = (code: string) => {
    const t = REAL.towers.find((x) => x.tower_code === code);
    if (!t) throw new Error(`no tower ${code}`);
    return t.tower_name;
  };
  function convertReal(towerCode: string, labels: string[]) {
    return convertPodLibrary({
      ...buildSheets([["POD-001", "Probe", towerName(towerCode), labels.join(", "), labels.length, "Senior", ""]]),
      reference: REAL,
    });
  }

  it("the table is valid against the committed taxonomy", () => {
    expect(() => validateGenericRoleRules(GENERIC_ROLE_RULES, REAL)).not.toThrow();
    expect(GENERIC_ROLE_RULES.length).toBeGreaterThan(0);
  });

  it("every rule maps each of its labels, in its tower, to its declared role as a proposal", () => {
    for (const rule of GENERIC_ROLE_RULES) {
      const out = convertReal(rule.towerCode, [...rule.labels]);
      expect(out.podTemplateRoles.map((r) => [r.raw_role_text, r.role_code, r.match_method, r.mapping_status, r.mapping_rule_id])).toEqual(
        rule.labels.map((label) => [label, rule.roleCode, "proposed_by_tower", "proposed_unapproved", rule.id]),
      );
    }
  });

  it.each([
    ["TWR-09", "Developer", "ROL-080"],
    ["TWR-09", "Engineer", "ROL-080"],
    ["TWR-10", "Developer", "ROL-086"],
    ["TWR-17", "L1", "ROL-129"],
    ["TWR-17", "L2", "ROL-128"],
    ["TWR-17", "L3", "ROL-127"],
    ["TWR-17", "L3 (ERP)", "ROL-127"],
    ["TWR-15", "Automation Engineer", "ROL-120"],
  ])("in %s, %j is proposed %s", (tower, label, role) => {
    expect(convertReal(tower, [label]).podTemplateRoles[0]).toMatchObject({ role_code: role, match_method: "proposed_by_tower" });
  });

  it.each([
    ["TWR-03", "Automation Engineer", "ambiguous"], // the rule is Quality Engineering's only
    ["TWR-11", "Consultant", "no_match"],
    ["TWR-14", "Engineer", "no_match"],
    ["TWR-14", "Analyst", "no_match"],
    ["TWR-20", "PM", "no_match"],
    ["TWR-17", "Delivery Mgr", "no_match"],
    ["TWR-17", "L4", "no_match"],
    ["TWR-05", "Developer", "no_match"],
  ])("in %s, %j has no rule and stays unmatched (%s)", (tower, label, reason) => {
    const out = convertReal(tower, [label]);
    expect(out.podTemplateRoles[0]).toMatchObject({ role_code: "", match_method: "unmatched", mapping_status: "unmatched" });
    expect(out.coverage.unmatchedLabels[0]).toMatchObject({ label, reason });
  });
});

// ---------------------------------------------------------------------------
// The committed CSV and manifest agree with the CURRENT rule table — a rule
// edited without re-running the conversion fails here, without the workbook.
// ---------------------------------------------------------------------------

describe("the committed pod library was produced by the current GENERIC_ROLE_RULES", () => {
  const DIR = path.resolve(__dirname, "..", "..", "..", "datasets", "reference", "pricing-engine-v1");
  const towerOf = new Map(readCsv(path.join(DIR, "pricing_pod_templates.csv")).map((p) => [p.pod_code, p.tower_code]));
  const rows = readCsv(path.join(DIR, "pricing_pod_template_roles.csv"));
  const labelOf = (raw: string) => parseRoleMix(raw)[0].roleLabel;

  it("every proposed row names a rule for its pod's tower and label, with that rule's role", () => {
    const proposed = rows.filter((r) => r.match_method === "proposed_by_tower");
    expect(proposed.length).toBeGreaterThan(0);
    for (const r of proposed) {
      const rule = GENERIC_ROLE_RULES.find((g) => g.id === r.mapping_rule_id);
      expect(rule).toBeDefined();
      expect([rule?.towerCode, rule?.roleCode, rule?.labels.includes(labelOf(r.raw_role_text))]).toEqual([
        towerOf.get(r.pod_code),
        r.role_code,
        true,
      ]);
    }
  });

  it("no unmatched row has a rule in the current table", () => {
    for (const r of rows.filter((x) => x.match_method === "unmatched")) {
      const tower = towerOf.get(r.pod_code);
      const label = labelOf(r.raw_role_text);
      expect(GENERIC_ROLE_RULES.filter((g) => g.towerCode === tower && g.labels.includes(label))).toEqual([]);
    }
  });

  it("the manifest records the current table", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));
    expect(manifest.rom_pod_library.generic_role_rules.map((r: { id: string; role_code: string; tower_code: string; labels: string[]; resolves_ambiguity: boolean }) => [r.id, r.tower_code, r.labels, r.role_code, r.resolves_ambiguity])).toEqual(
      GENERIC_ROLE_RULES.map((r) => [r.id, r.towerCode, [...r.labels], r.roleCode, r.resolvesAmbiguity === true]),
    );
  });
});
