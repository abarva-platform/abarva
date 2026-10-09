/**
 * ROM increment 2a — the pod-library converter, on a tiny in-memory workbook.
 *
 * No test here reads the source workbook (it lives outside the repository);
 * the fixture below is built with ExcelJS in memory, laid out like the real
 * "Delivery Pods" and "Agent Economics" sheets (header at B5, a formula
 * column the converter must not read), and run through the same
 * `readSheetRows` the CLI uses.
 */
import { describe, expect, it } from "@jest/globals";
import ExcelJS from "exceljs";
import { sha256Hex } from "../csv-utils";
import {
  AGENT_SHEET,
  POD_LIBRARY_PACK_VERSION,
  POD_SHEET,
  convertPodLibrary,
  decodeXmlEntities,
  formatCoverageReport,
  matchRoleLabel,
  parseAgentMix,
  parseRoleMix,
  readSheetRows,
  renderPodLibraryCsvs,
  withPodLibraryManifestSection,
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
    { level_code: "LVL-07", level_name: "Lead" },
    { level_code: "LVL-08", level_name: "Senior" },
  ],
  roles: [
    { role_code: "ROL-023", canonical_name: "Data Architect", status: "active" },
    { role_code: "ROL-037", canonical_name: "Data Engineer", status: "active" },
    { role_code: "ROL-101", canonical_name: "Platform Engineer", status: "active" },
    { role_code: "ROL-120", canonical_name: "Automation Engineer", status: "active" },
    { role_code: "ROL-020", canonical_name: "Automation Engineer", status: "active" },
    { role_code: "ROL-500", canonical_name: "R&D Analyst", status: "active" },
    { role_code: "ROL-900", canonical_name: "Retired Role", status: "retired" },
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

function convert(pods?: PodLine[], agents?: typeof DEFAULT_AGENTS) {
  return convertPodLibrary({ ...buildSheets(pods, agents), reference: REFERENCE });
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

  it("emits one role row per mix entry, inheriting the pod level; unmatched rows carry no role code", () => {
    const out = convert();
    expect(out.podTemplateRoles).toEqual([
      { pod_code: "POD-001", role_code: "ROL-023", level_code: "LVL-08", fte: 1, raw_role_text: "Data Architect", match_method: "exact", source_row: 7 },
      { pod_code: "POD-001", role_code: "ROL-037", level_code: "LVL-08", fte: 3, raw_role_text: "3x Senior Data Engineer", match_method: "alias", source_row: 7 },
      { pod_code: "POD-001", role_code: "", level_code: "LVL-08", fte: 1, raw_role_text: "BI Dev", match_method: "unmatched", source_row: 7 },
      { pod_code: "POD-002", role_code: "", level_code: "LVL-08", fte: 2, raw_role_text: "2x Automation Engineer", match_method: "unmatched", source_row: 8 },
      { pod_code: "POD-002", role_code: "ROL-500", level_code: "LVL-08", fte: 1, raw_role_text: "R&D Analyst", match_method: "exact", source_row: 8 },
      { pod_code: "POD-003", role_code: "ROL-101", level_code: "LVL-07", fte: 2, raw_role_text: "Platform Engineer x2", match_method: "exact", source_row: 6 },
    ]);
  });

  it("reports coverage and every unmatched label with its reason, never a guessed code", () => {
    const { coverage } = convert();
    expect(coverage).toEqual({
      podsTotal: 3,
      podsFullyMatched: 1,
      podsFullyMatchedWithBands: 1,
      roleRowsTotal: 6,
      roleRowsExact: 3,
      roleRowsAlias: 1,
      roleRowsUnmatched: 2,
      matchedRowsWithoutBand: 1, // ROL-500 has no band at LVL-08
      unmatchedLabels: [
        { label: "Automation Engineer", reason: "ambiguous", candidates: ["ROL-020", "ROL-120"], occurrences: 1, podCodes: ["POD-002"] },
        { label: "BI Dev", reason: "no_match", candidates: [], occurrences: 1, podCodes: ["POD-001"] },
      ],
    });
    const report = formatCoverageReport(coverage);
    expect(report).toContain("Pods: 3; fully role-matched: 1;");
    expect(report).toContain('"Automation Engineer" ×1 [ambiguous: ROL-020, ROL-120] in POD-002');
    expect(report).toContain('"BI Dev" ×1 [no_match] in POD-001');
  });

  it("counts a fully matched pod without a band for a member as matched but not band-complete", () => {
    const { coverage } = convert([["POD-009", "R&amp;D Pod", "Data & Analytics", "R&amp;D Analyst", 1, "Senior", ""]]);
    expect(coverage.podsFullyMatched).toBe(1);
    expect(coverage.podsFullyMatchedWithBands).toBe(0);
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
      "pod_code,role_code,level_code,fte,raw_role_text,match_method,source_row",
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
    const out = convertPodLibrary({ ...sheets, podRows, reference: REFERENCE });
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
    expect(() => convertPodLibrary({ ...sheets, podRows: drifted, reference: REFERENCE })).toThrow(
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
