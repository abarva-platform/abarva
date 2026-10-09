/**
 * ROM increment 2a — the pod library in the reference pack: the committed
 * CSVs load, validate, match their manifest section and round-trip byte for
 * byte; and the shared validator catches each defect class on its own.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";
import { sha256File, toCsv } from "../../../../scripts/pricing/csv-utils";
import { clampLevelToRoleRange } from "../../../../scripts/pricing/validate-pricing-role-coverage";
import {
  AGENT_PROFILE_HEADERS,
  POD_TEMPLATE_HEADERS,
  POD_TEMPLATE_ROLE_HEADERS,
} from "../../../../scripts/pricing/convert-pod-library";
import {
  computePackContentHash,
  defaultReferencePackDir,
  loadPodLibrary,
  parsePodLibrary,
  podLibraryRowCounts,
  POD_LIBRARY_CSV_FILES,
  readPodLibraryDir,
  readReferencePackDir,
  rowCountsByTable,
  validatePodLibraryAgainstPack,
  type PodLibraryRawData,
} from "../reference-pack-loader";

const REAL_DIR = defaultReferencePackDir();

interface PodLibraryManifestSection {
  row_counts: Record<string, number>;
  file_checksums_sha256: Record<string, string>;
  role_match_coverage: {
    pods_total: number;
    pods_fully_matched: number;
    pods_fully_confirmed: number;
    role_rows_unmatched: number;
    role_rows_proposed: number;
    role_rows_clamped_up: number;
    role_rows_clamped_down: number;
  };
}

function manifestSection(): PodLibraryManifestSection {
  const manifest = JSON.parse(fs.readFileSync(path.join(REAL_DIR, "manifest.json"), "utf8"));
  return manifest.rom_pod_library as PodLibraryManifestSection;
}

describe("the committed pod library", () => {
  it("row counts and checksums match manifest.json#rom_pod_library", () => {
    const section = manifestSection();
    expect(podLibraryRowCounts(readPodLibraryDir(REAL_DIR))).toEqual(section.row_counts);
    for (const file of Object.values(POD_LIBRARY_CSV_FILES)) {
      expect(sha256File(path.join(REAL_DIR, file))).toBe(section.file_checksums_sha256[file]);
    }
  });

  it("validates against the taxonomy with no errors; unmatched, proposed and clamped rows are warnings only", () => {
    const raw = readPodLibraryDir(REAL_DIR);
    const result = validatePodLibraryAgainstPack(raw, readReferencePackDir(REAL_DIR));
    expect(result.errors).toEqual([]);
    const section = manifestSection();
    const c = section.role_match_coverage;
    expect(result.summary.podCount).toBe(c.pods_total);
    expect(result.summary.podsFullyMatched).toBe(c.pods_fully_matched);
    expect(result.summary.podsFullyConfirmed).toBe(c.pods_fully_confirmed);
    expect(result.summary.unmatchedRoleRows).toBe(c.role_rows_unmatched);
    expect(result.summary.proposedRoleRows).toBe(c.role_rows_proposed);
    expect(result.summary.clampedRoleRows).toBe(c.role_rows_clamped_up + c.role_rows_clamped_down);
    const expectedWarnings = [result.summary.unmatchedRoleRows, result.summary.proposedRoleRows, result.summary.clampedRoleRows].filter((n) => n > 0);
    expect(result.warnings).toHaveLength(expectedWarnings.length);
  });

  it("loadPodLibrary returns typed rows: numbers, a null role code exactly on unmatched rows, agent codes as a list", () => {
    const { data } = loadPodLibrary(REAL_DIR);
    for (const p of data.podTemplates) {
      expect(typeof p.headcount).toBe("number");
      expect(Array.isArray(p.agent_mix_codes)).toBe(true);
    }
    for (const r of data.podTemplateRoles) {
      expect(r.role_code === null).toBe(r.match_method === "unmatched");
      expect(r.mapping_rule_id === null).toBe(r.match_method !== "proposed_by_tower");
      expect(r.mapping_status === "confirmed").toBe(r.match_method === "exact" || r.match_method === "alias");
      expect(r.level_adjustment === "none").toBe(r.level_code === r.original_level_code);
      expect(r.fte).toBeGreaterThan(0);
    }
    for (const a of data.agentProfiles) {
      expect(a.confidence).toBe("low");
      expect(a.approval_status).toBe("global_starter_unapproved");
      expect(a.assumption_basis).toBe("product_owner_planning_assumption_no_external_source");
    }
  });

  it("round-trips: parsed rows re-serialized with the converter's headers equal the committed bytes", () => {
    const { data } = loadPodLibrary(REAL_DIR);
    const rendered = {
      [POD_LIBRARY_CSV_FILES.podTemplates]: toCsv(
        POD_TEMPLATE_HEADERS,
        data.podTemplates.map((p) => ({ ...p, agent_mix_codes: p.agent_mix_codes.join("|") })),
      ),
      [POD_LIBRARY_CSV_FILES.podTemplateRoles]: toCsv(
        POD_TEMPLATE_ROLE_HEADERS,
        data.podTemplateRoles.map((r) => ({ ...r, role_code: r.role_code ?? "", mapping_rule_id: r.mapping_rule_id ?? "" })),
      ),
      [POD_LIBRARY_CSV_FILES.agentProfiles]: toCsv(AGENT_PROFILE_HEADERS, data.agentProfiles.map((a) => ({ ...a }))),
    };
    for (const [file, content] of Object.entries(rendered)) {
      expect(content).toBe(fs.readFileSync(path.join(REAL_DIR, file), "utf8"));
    }
  });

  it("loadPodLibrary throws, listing the error, when a committed file is broken", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pod-library-"));
    try {
      fs.cpSync(REAL_DIR, dir, { recursive: true });
      const file = path.join(dir, POD_LIBRARY_CSV_FILES.podTemplateRoles);
      const lines = fs.readFileSync(file, "utf8").split("\n");
      const cells = lines[1].split(",");
      cells[5] = "0"; // fte
      lines[1] = cells.join(",");
      fs.writeFileSync(file, lines.join("\n"));
      expect(() => loadPodLibrary(dir)).toThrow(/failed validation:[\s\S]*fte must be a finite number > 0/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("stays out of the taxonomy load: not in rowCountsByTable or the taxonomy content hash", () => {
    const pack = readReferencePackDir(REAL_DIR);
    for (const file of Object.values(POD_LIBRARY_CSV_FILES)) {
      expect(rowCountsByTable(pack)).not.toHaveProperty(file);
    }
    expect(Object.keys(pack)).not.toEqual(expect.arrayContaining(["podTemplates"]));
    expect(computePackContentHash(pack)).toBe(computePackContentHash(readReferencePackDir(REAL_DIR)));
  });
});

// ---------------------------------------------------------------------------
// Validator — one defect at a time on a small valid baseline
// ---------------------------------------------------------------------------

const PACK = {
  towers: [{ tower_code: "TWR-04" }],
  roles: [
    // ROL-023 allowed Lead..Lead, so a Senior pod clamps it UP to Lead.
    { role_code: "ROL-023", allowed_level_min: "Lead", allowed_level_max: "Lead" },
    { role_code: "ROL-037", allowed_level_min: "Intermediate", allowed_level_max: "Lead" },
    { role_code: "ROL-041", allowed_level_min: "Intermediate", allowed_level_max: "Senior" },
  ],
  seniorityLevels: [
    { level_code: "LVL-07", level_name: "Lead", rank: "7" },
    { level_code: "LVL-08", level_name: "Senior", rank: "8" },
    { level_code: "LVL-09", level_name: "Intermediate", rank: "9" },
  ],
} as never;

function roleRow(overrides: Record<string, string>): Record<string, string> {
  return {
    pod_code: "POD-001", role_code: "", level_code: "LVL-08", original_level_code: "LVL-08", level_adjustment: "none",
    fte: "1", raw_role_text: "", match_method: "exact", mapping_status: "confirmed", mapping_rule_id: "", source_row: "6",
    ...overrides,
  };
}

function baseline(): PodLibraryRawData {
  return {
    podTemplates: [
      {
        pod_code: "POD-001", name: "Data Pod", tower_code: "TWR-04", headcount: "5", blended_level_code: "LVL-08",
        agent_mix_codes: "AGENT-B", source_artifact: "x", source_row: "6", status: "active", version: "1",
      },
    ],
    podTemplateRoles: [
      roleRow({ role_code: "ROL-023", level_code: "LVL-07", level_adjustment: "clamped_up", fte: "1", raw_role_text: "Data Architect" }),
      roleRow({ role_code: "ROL-037", fte: "2", raw_role_text: "2x Data Engineer" }),
      roleRow({ role_code: "", fte: "1", raw_role_text: "Steward", match_method: "unmatched", mapping_status: "unmatched" }),
      roleRow({ role_code: "ROL-041", fte: "1", raw_role_text: "BI Dev", match_method: "proposed_by_tower", mapping_status: "proposed_unapproved", mapping_rule_id: "GR-09" }),
    ],
    agentProfiles: [
      {
        agent_code: "AGENT-B", name: "Agent Platform B", agent_type: "Coding agent", monthly_cost_usd: "4000",
        equiv_eng_fte: "1.2", utilization: "0.75", productivity: "1.8", documentation: "1.5", testing: "1.9",
        architecture: "1.25", assumption_basis: "product_owner_planning_assumption_no_external_source",
        source_artifact: "x", source_row: "7", confidence: "low", approval_status: "global_starter_unapproved",
      },
    ],
  };
}

function errorsAfter(mutate: (d: PodLibraryRawData) => void): string[] {
  const data = baseline();
  mutate(data);
  return validatePodLibraryAgainstPack(data, PACK).errors;
}

describe("validatePodLibrary", () => {
  it("accepts the baseline, warning about its unmatched, proposed and clamped rows", () => {
    const result = validatePodLibraryAgainstPack(baseline(), PACK);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      "1 pod role row(s) across 1 pod(s) are unmatched (no role code); those pods cannot be priced until an alias, role or generic-role rule is authored",
      "1 pod role row(s) across 1 pod(s) carry a proposed role mapping (proposed_by_tower, unapproved); they price only with that caveat on every term",
      "1 pod role row(s) are priced at a level clamped into the role's allowed range, not at the pod's blended level",
    ]);
    expect(result.summary).toEqual({
      podCount: 1, roleRowCount: 4, agentProfileCount: 1, podsFullyMatched: 0, podsFullyConfirmed: 0,
      unmatchedRoleRows: 1, proposedRoleRows: 1, clampedRoleRows: 1,
    });
  });

  it("counts a pod with no unmatched rows as fully matched, and fully confirmed only when no row is proposed", () => {
    const data = baseline();
    data.podTemplateRoles[2] = { ...data.podTemplateRoles[2], role_code: "ROL-037", match_method: "alias", mapping_status: "confirmed" };
    const matched = validatePodLibraryAgainstPack(data, PACK);
    expect(matched.errors).toEqual([]);
    expect(matched.summary).toMatchObject({ podsFullyMatched: 1, podsFullyConfirmed: 0 });
    expect(matched.warnings.some((w) => w.includes("unmatched"))).toBe(false);
    data.podTemplateRoles[3] = { ...data.podTemplateRoles[3], match_method: "exact", mapping_status: "confirmed", mapping_rule_id: "" };
    const confirmed = validatePodLibraryAgainstPack(data, PACK);
    expect(confirmed.errors).toEqual([]);
    expect(confirmed.summary).toMatchObject({ podsFullyMatched: 1, podsFullyConfirmed: 1, proposedRoleRows: 0 });
  });

  it("a pod with an unknown match method is not counted as fully confirmed", () => {
    const data = baseline();
    data.podTemplateRoles = data.podTemplateRoles.slice(0, 2).map((r) => ({ ...r }));
    data.podTemplates[0].headcount = "3";
    data.podTemplateRoles[1].match_method = "fuzzy";
    const result = validatePodLibraryAgainstPack(data, PACK);
    expect(result.summary).toMatchObject({ podsFullyMatched: 1, podsFullyConfirmed: 0 });
  });

  it.each([
    ["an unmatched row carrying a role code", (d: PodLibraryRawData) => (d.podTemplateRoles[2].role_code = "ROL-037"), /is unmatched but carries role_code "ROL-037"/],
    ["a proposed row marked confirmed", (d: PodLibraryRawData) => (d.podTemplateRoles[3].mapping_status = "confirmed"), /is "proposed_by_tower" with mapping_status "confirmed", expected "proposed_unapproved"/],
    ["an exact row marked proposed", (d: PodLibraryRawData) => (d.podTemplateRoles[1].mapping_status = "proposed_unapproved"), /is "exact" with mapping_status "proposed_unapproved", expected "confirmed"/],
    ["an unmatched row marked confirmed", (d: PodLibraryRawData) => (d.podTemplateRoles[2].mapping_status = "confirmed"), /is "unmatched" with mapping_status "confirmed", expected "unmatched"/],
    ["a proposed row naming no rule", (d: PodLibraryRawData) => (d.podTemplateRoles[3].mapping_rule_id = ""), /is proposed_by_tower but names no mapping_rule_id/],
    ["a confirmed row naming a rule", (d: PodLibraryRawData) => (d.podTemplateRoles[1].mapping_rule_id = "GR-09"), /is "exact" but carries mapping_rule_id "GR-09"/],
    ["a proposed row with no role code", (d: PodLibraryRawData) => (d.podTemplateRoles[3].role_code = ""), /is "proposed_by_tower" but has no role_code/],
    ["an unknown level adjustment", (d: PodLibraryRawData) => (d.podTemplateRoles[1].level_adjustment = "nudged"), /level_adjustment "nudged", expected one of none, clamped_up, clamped_down/],
    ["a level that is not the clamp of the pod level", (d: PodLibraryRawData) => (d.podTemplateRoles[1].level_code = "LVL-07"), /level_code "LVL-07" \(none\), but clamping "LVL-08" into its role's range gives "LVL-08" \(none\)/],
    ["a clamp that was not applied", (d: PodLibraryRawData) => Object.assign(d.podTemplateRoles[0], { level_code: "LVL-08", level_adjustment: "none" }), /level_code "LVL-08" \(none\), but clamping "LVL-08" into its role's range gives "LVL-07" \(clamped_up\)/],
    ["a clamp in the wrong direction", (d: PodLibraryRawData) => (d.podTemplateRoles[0].level_adjustment = "clamped_down"), /\(clamped_down\), but clamping "LVL-08" into its role's range gives "LVL-07" \(clamped_up\)/],
    ["an unmatched row with a moved level", (d: PodLibraryRawData) => Object.assign(d.podTemplateRoles[2], { level_code: "LVL-07", level_adjustment: "clamped_up" }), /gives "LVL-08" \(none\)/],
    ["a matched row with no role code", (d: PodLibraryRawData) => (d.podTemplateRoles[0].role_code = ""), /is "exact" but has no role_code/],
    ["an unknown role code", (d: PodLibraryRawData) => (d.podTemplateRoles[0].role_code = "ROL-999"), /unknown role_code "ROL-999"/],
    ["an unknown match method", (d: PodLibraryRawData) => (d.podTemplateRoles[0].match_method = "fuzzy"), /match_method "fuzzy"/],
    ["an original level that is not the pod level", (d: PodLibraryRawData) => (d.podTemplateRoles[1].original_level_code = "LVL-07"), /original_level_code "LVL-07", but the pod's blended level is "LVL-08"/],
    ["a role source row that is not the pod's", (d: PodLibraryRawData) => (d.podTemplateRoles[0].source_row = "9"), /source_row "9", but the pod's source_row is "6"/],
    ["a non-positive fte", (d: PodLibraryRawData) => (d.podTemplateRoles[0].fte = "0"), /fte must be a finite number > 0/],
    ["role FTE that does not sum to headcount", (d: PodLibraryRawData) => (d.podTemplates[0].headcount = "6"), /sum to 5 FTE, but its headcount is 6/],
    ["a role row for an unknown pod", (d: PodLibraryRawData) => (d.podTemplateRoles[0].pod_code = "POD-404"), /unknown pod_code "POD-404"/],
    ["a pod with no role rows", (d: PodLibraryRawData) => (d.podTemplateRoles = []), /has no role rows/],
    ["a duplicate pod code", (d: PodLibraryRawData) => d.podTemplates.push({ ...d.podTemplates[0] }), /Duplicate pod_code "POD-001"/],
    ["an unknown tower", (d: PodLibraryRawData) => (d.podTemplates[0].tower_code = "TWR-99"), /unknown tower_code "TWR-99"/],
    ["an unknown blended level", (d: PodLibraryRawData) => (d.podTemplates[0].blended_level_code = "LVL-99"), /unknown blended_level_code "LVL-99"/],
    ["a non-positive headcount", (d: PodLibraryRawData) => (d.podTemplates[0].headcount = "-1"), /headcount must be a finite number > 0/],
    ["an agent mix naming an unknown agent", (d: PodLibraryRawData) => (d.podTemplates[0].agent_mix_codes = "AGENT-B|AGENT-Z"), /unknown agent_code "AGENT-Z"/],
    ["a duplicate agent code", (d: PodLibraryRawData) => d.agentProfiles.push({ ...d.agentProfiles[0] }), /Duplicate agent_code "AGENT-B"/],
    ["an agent profile presented with medium confidence", (d: PodLibraryRawData) => (d.agentProfiles[0].confidence = "medium"), /confidence must be "low"/],
    ["an agent profile marked approved", (d: PodLibraryRawData) => (d.agentProfiles[0].approval_status = "approved"), /approval_status must be "global_starter_unapproved"/],
    ["an agent profile presented as researched", (d: PodLibraryRawData) => (d.agentProfiles[0].assumption_basis = "market_benchmark"), /assumption_basis must be/],
    ["a utilization above 1", (d: PodLibraryRawData) => (d.agentProfiles[0].utilization = "72"), /utilization must be a fraction in \(0, 1\]/],
    ["a zero equivalent FTE", (d: PodLibraryRawData) => (d.agentProfiles[0].equiv_eng_fte = "0"), /equiv_eng_fte must be a finite number > 0/],
    ["a negative monthly cost", (d: PodLibraryRawData) => (d.agentProfiles[0].monthly_cost_usd = "-1"), /monthly_cost_usd must be a finite number >= 0/],
    ["a non-numeric multiplier", (d: PodLibraryRawData) => (d.agentProfiles[0].testing = "high"), /testing must be a finite multiplier > 0/],
  ])("rejects %s", (_label, mutate, pattern) => {
    const errors = errorsAfter(mutate);
    expect(errors).toEqual(expect.arrayContaining([expect.stringMatching(pattern)]));
  });
});

describe("validatePodLibrary — role ranges", () => {
  it("reports a matched row whose role's range names an unknown level", () => {
    const pack = {
      ...(PACK as unknown as Record<string, unknown>),
      roles: [
        { role_code: "ROL-023", allowed_level_min: "Lead", allowed_level_max: "Lead" },
        { role_code: "ROL-037", allowed_level_min: "Wizard", allowed_level_max: "Lead" },
        { role_code: "ROL-041", allowed_level_min: "Intermediate", allowed_level_max: "Senior" },
      ],
    } as never;
    expect(validatePodLibraryAgainstPack(baseline(), pack).errors).toEqual([
      'Pod role row "POD-001" / "2x Data Engineer": allowed level range "Wizard".."Lead" names a level that is not in pricing_seniority_levels.csv',
    ]);
  });
});

describe("parsePodLibrary", () => {
  it("coerces numbers, maps an empty role code to null and splits the agent mix", () => {
    const parsed = parsePodLibrary(baseline());
    expect(parsed.podTemplates[0]).toMatchObject({ headcount: 5, source_row: 6, version: 1, agent_mix_codes: ["AGENT-B"] });
    expect(parsed.podTemplateRoles.map((r) => r.role_code)).toEqual(["ROL-023", "ROL-037", null, "ROL-041"]);
    expect(parsed.podTemplateRoles.map((r) => r.mapping_rule_id)).toEqual([null, null, null, "GR-09"]);
    expect(parsed.podTemplateRoles[0]).toMatchObject({
      level_code: "LVL-07",
      original_level_code: "LVL-08",
      level_adjustment: "clamped_up",
      mapping_status: "confirmed",
    });
    expect(parsed.podTemplateRoles[3]).toMatchObject({ match_method: "proposed_by_tower", mapping_status: "proposed_unapproved" });
    expect(parsed.agentProfiles[0]).toMatchObject({ equiv_eng_fte: 1.2, utilization: 0.75, monthly_cost_usd: 4000 });
  });

  it("an empty agent mix is an empty list, and a non-numeric field throws", () => {
    const data = baseline();
    data.podTemplates[0].agent_mix_codes = "";
    expect(parsePodLibrary(data).podTemplates[0].agent_mix_codes).toEqual([]);
    data.podTemplateRoles[0].fte = "";
    expect(() => parsePodLibrary(data)).toThrow(/fte: expected a number/);
  });
});

describe("clampLevelToRoleRange", () => {
  const LEVELS = [
    { level_code: "LVL-06", level_name: "Manager", rank: "6" },
    { level_code: "LVL-07", level_name: "Lead", rank: "7" },
    { level_code: "LVL-08", level_name: "Senior", rank: "8" },
    { level_code: "LVL-09", level_name: "Intermediate", rank: "9" },
  ];
  const leadToSenior = { allowed_level_min: "Senior", allowed_level_max: "Lead" };

  it.each([
    ["LVL-06", "LVL-07", "clamped_down"],
    ["LVL-07", "LVL-07", "none"],
    ["LVL-08", "LVL-08", "none"],
    ["LVL-09", "LVL-08", "clamped_up"],
  ])("clamps %s into Senior..Lead as %s (%s)", (level, expected, adjustment) => {
    expect(clampLevelToRoleRange(level, leadToSenior, LEVELS)).toEqual({ ok: true, levelCode: expected, adjustment });
  });

  it("a one-level range clamps both ways onto it", () => {
    const leadOnly = { allowed_level_min: "Lead", allowed_level_max: "Lead" };
    expect(clampLevelToRoleRange("LVL-09", leadOnly, LEVELS)).toEqual({ ok: true, levelCode: "LVL-07", adjustment: "clamped_up" });
    expect(clampLevelToRoleRange("LVL-06", leadOnly, LEVELS)).toEqual({ ok: true, levelCode: "LVL-07", adjustment: "clamped_down" });
  });

  it("refuses an unknown level, an unknown bound on either side and a backwards range", () => {
    expect(clampLevelToRoleRange("LVL-99", leadToSenior, LEVELS)).toEqual({ ok: false, error: 'unknown level_code "LVL-99"' });
    expect(clampLevelToRoleRange("LVL-08", { allowed_level_min: "Wizard", allowed_level_max: "Lead" }, LEVELS)).toMatchObject({ ok: false });
    expect(clampLevelToRoleRange("LVL-08", { allowed_level_min: "Senior", allowed_level_max: "Wizard" }, LEVELS)).toMatchObject({
      ok: false,
      error: 'allowed level range "Senior".."Wizard" names a level that is not in pricing_seniority_levels.csv',
    });
    expect(clampLevelToRoleRange("LVL-08", { allowed_level_min: "Lead", allowed_level_max: "Senior" }, LEVELS)).toEqual({
      ok: false,
      error: 'allowed level range "Lead".."Senior" has its minimum more senior than its maximum',
    });
  });
});
