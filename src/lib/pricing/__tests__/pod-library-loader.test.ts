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
  role_match_coverage: { pods_total: number; pods_fully_matched: number; role_rows_unmatched: number };
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

  it("validates against the taxonomy with no errors; unmatched rows are a warning only", () => {
    const raw = readPodLibraryDir(REAL_DIR);
    const result = validatePodLibraryAgainstPack(raw, readReferencePackDir(REAL_DIR));
    expect(result.errors).toEqual([]);
    const section = manifestSection();
    expect(result.summary.podCount).toBe(section.role_match_coverage.pods_total);
    expect(result.summary.podsFullyMatched).toBe(section.role_match_coverage.pods_fully_matched);
    expect(result.summary.unmatchedRoleRows).toBe(section.role_match_coverage.role_rows_unmatched);
    expect(result.warnings).toHaveLength(result.summary.unmatchedRoleRows > 0 ? 1 : 0);
  });

  it("loadPodLibrary returns typed rows: numbers, a null role code exactly on unmatched rows, agent codes as a list", () => {
    const { data } = loadPodLibrary(REAL_DIR);
    for (const p of data.podTemplates) {
      expect(typeof p.headcount).toBe("number");
      expect(Array.isArray(p.agent_mix_codes)).toBe(true);
    }
    for (const r of data.podTemplateRoles) {
      expect(r.role_code === null).toBe(r.match_method === "unmatched");
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
        data.podTemplateRoles.map((r) => ({ ...r, role_code: r.role_code ?? "" })),
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
      cells[3] = "0"; // fte
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
  roles: [{ role_code: "ROL-023" }, { role_code: "ROL-037" }],
  seniorityLevels: [{ level_code: "LVL-08" }, { level_code: "LVL-07" }],
} as never;

function baseline(): PodLibraryRawData {
  return {
    podTemplates: [
      {
        pod_code: "POD-001", name: "Data Pod", tower_code: "TWR-04", headcount: "4", blended_level_code: "LVL-08",
        agent_mix_codes: "AGENT-B", source_artifact: "x", source_row: "6", status: "active", version: "1",
      },
    ],
    podTemplateRoles: [
      { pod_code: "POD-001", role_code: "ROL-023", level_code: "LVL-08", fte: "1", raw_role_text: "Data Architect", match_method: "exact", source_row: "6" },
      { pod_code: "POD-001", role_code: "ROL-037", level_code: "LVL-08", fte: "2", raw_role_text: "2x Data Engineer", match_method: "exact", source_row: "6" },
      { pod_code: "POD-001", role_code: "", level_code: "LVL-08", fte: "1", raw_role_text: "BI Dev", match_method: "unmatched", source_row: "6" },
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
  it("accepts the baseline, warning about its one unmatched row", () => {
    const result = validatePodLibraryAgainstPack(baseline(), PACK);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      "1 pod role row(s) across 1 pod(s) are unmatched (no role code); those pods cannot be priced until an alias or role is authored",
    ]);
    expect(result.summary).toEqual({ podCount: 1, roleRowCount: 3, agentProfileCount: 1, podsFullyMatched: 0, unmatchedRoleRows: 1 });
  });

  it("counts a pod with no unmatched rows as fully matched", () => {
    const data = baseline();
    data.podTemplateRoles[2] = { ...data.podTemplateRoles[2], role_code: "ROL-023", match_method: "exact" };
    const result = validatePodLibraryAgainstPack(data, PACK);
    expect(result.summary.podsFullyMatched).toBe(1);
    expect(result.warnings).toEqual([]);
  });

  it.each([
    ["an unmatched row carrying a role code", (d: PodLibraryRawData) => (d.podTemplateRoles[2].role_code = "ROL-023"), /is unmatched but carries role_code "ROL-023"/],
    ["a matched row with no role code", (d: PodLibraryRawData) => (d.podTemplateRoles[0].role_code = ""), /is "exact" but has no role_code/],
    ["an unknown role code", (d: PodLibraryRawData) => (d.podTemplateRoles[0].role_code = "ROL-999"), /unknown role_code "ROL-999"/],
    ["an unknown match method", (d: PodLibraryRawData) => (d.podTemplateRoles[0].match_method = "fuzzy"), /match_method "fuzzy"/],
    ["a role level that is not the pod level", (d: PodLibraryRawData) => (d.podTemplateRoles[0].level_code = "LVL-07"), /level_code "LVL-07", but the pod's blended level is "LVL-08"/],
    ["a role source row that is not the pod's", (d: PodLibraryRawData) => (d.podTemplateRoles[0].source_row = "9"), /source_row "9", but the pod's source_row is "6"/],
    ["a non-positive fte", (d: PodLibraryRawData) => (d.podTemplateRoles[0].fte = "0"), /fte must be a finite number > 0/],
    ["role FTE that does not sum to headcount", (d: PodLibraryRawData) => (d.podTemplates[0].headcount = "5"), /sum to 4 FTE, but its headcount is 5/],
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

describe("parsePodLibrary", () => {
  it("coerces numbers, maps an empty role code to null and splits the agent mix", () => {
    const parsed = parsePodLibrary(baseline());
    expect(parsed.podTemplates[0]).toMatchObject({ headcount: 4, source_row: 6, version: 1, agent_mix_codes: ["AGENT-B"] });
    expect(parsed.podTemplateRoles.map((r) => r.role_code)).toEqual(["ROL-023", "ROL-037", null]);
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
