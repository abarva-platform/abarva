/**
 * ROM increment 2b — proposed role mappings and clamped levels reach the
 * pod pricer as CAVEATS, never as confirmed inputs (product-owner decision,
 * 2026-10-10: "proposed mapping by tower, never silent").
 *
 * The first suites use a small invented library so every string is
 * hand-checkable. The last suite runs every template of the committed pod
 * library through the reference rate adapter and asserts only relationships
 * computed from the rows it reads.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";
import type { PricingPodTemplateRoleRow, PricingPodTemplateRow } from "../../types";
import { defaultReferencePackDir, loadPodLibrary } from "../../reference-pack-loader";
import { evaluateFormulaTerms } from "../formula-terms";
import {
  PROPOSED_ROLE_MAPPING_CAVEAT,
  podMemberCaveats,
  pricePod,
  type PodMember,
  type PodRateResolver,
  type ResolvedPodRate,
} from "../pod-pricer";
import { createReferencePodRateResolver } from "../pod-rate-adapter";
import { podMembersFromTemplate, type PodTemplateLibrary } from "../pod-templates";
import { loadRealPodRateReference } from "../__fixtures__/test-fixtures";

function template(code: string): PricingPodTemplateRow {
  return {
    pod_code: code,
    name: `${code} pod`,
    tower_code: "TWR-04",
    headcount: 3,
    blended_level_code: "LVL-08",
    agent_mix_codes: [],
    source_artifact: "Workforce_Taxonomy_Master.xlsx:Delivery Pods",
    source_row: 9,
    status: "active",
    version: 1,
  };
}

function row(podCode: string, overrides: Partial<PricingPodTemplateRoleRow>): PricingPodTemplateRoleRow {
  return {
    pod_code: podCode,
    role_code: "ROL-037",
    level_code: "LVL-08",
    original_level_code: "LVL-08",
    level_adjustment: "none",
    fte: 1,
    raw_role_text: "Data Engineer",
    match_method: "exact",
    mapping_status: "confirmed",
    mapping_rule_id: null,
    source_row: 9,
    ...overrides,
  };
}

const PROPOSED = { match_method: "proposed_by_tower", mapping_status: "proposed_unapproved", mapping_rule_id: "GR-09" } as const;

const LIBRARY: PodTemplateLibrary = {
  podTemplates: [template("POD-P1"), template("POD-P2"), template("POD-P3")],
  podTemplateRoles: [
    // P1: a confirmed role clamped up, a proposed role, a plain confirmed role.
    row("POD-P1", { role_code: "ROL-023", level_code: "LVL-07", level_adjustment: "clamped_up", raw_role_text: "Data Architect" }),
    row("POD-P1", { role_code: "ROL-041", raw_role_text: "BI Dev", ...PROPOSED }),
    row("POD-P1", {}),
    // P2: confirmed only, one clamped down.
    row("POD-P2", { role_code: "ROL-044", level_code: "LVL-09", level_adjustment: "clamped_down", raw_role_text: "Reporting Analyst" }),
    row("POD-P2", { fte: 2, raw_role_text: "2x Data Engineer" }),
    // P3: a proposed role that is ALSO clamped.
    row("POD-P3", { role_code: "ROL-024", level_code: "LVL-06", level_adjustment: "clamped_up", raw_role_text: "Data Product Mgr", ...PROPOSED, mapping_rule_id: "GR-08", fte: 3 }),
  ],
};

const LOC = "LOC-INDIA-TIER-1";

const flatRate: PodRateResolver = (member) => {
  const rate: ResolvedPodRate = {
    basis: "loaded_cost",
    currency: "USD",
    baseSource: `test:${member.roleCode}-${member.levelCode}`,
    baseRateCents: 10000,
    location: { source: "test", value: 1, notAppliedReason: null },
    provider: { source: "test", value: 1, notAppliedReason: null },
    hourlyRateCents: 10000,
    rateTerms: [{ label: "base", value: 10000, source: "test", cellRole: "rate" }],
    trace: "test",
    notes: ["band confidence medium"],
  };
  return rate;
};

function priced(code: string) {
  const built = podMembersFromTemplate(code, { library: LIBRARY, locationCode: LOC });
  if (!built.ok) throw new Error(built.message);
  const result = pricePod({ adjustedHours: 400, pod: built.pod, hoursPerFteWeek: 40, productiveShare: 0.8, rateResolver: flatRate });
  if (!result.ok) throw new Error(result.message);
  return { built, result };
}

// ---------------------------------------------------------------------------
// podMembersFromTemplate
// ---------------------------------------------------------------------------

describe("podMembersFromTemplate with proposed mappings and clamped levels", () => {
  it("accepts them by default; each member carries its row's level and provenance flags", () => {
    const built = podMembersFromTemplate("POD-P1", { library: LIBRARY, locationCode: LOC });
    if (!built.ok) throw new Error(built.message);
    expect(built.members.map((m) => [m.roleCode, m.levelCode, m.provenance])).toEqual([
      ["ROL-023", "LVL-07", { roleMapping: "confirmed", mappingRuleId: null, rawRoleText: "Data Architect", levelAdjustment: "clamped_up", originalLevelCode: "LVL-08" }],
      ["ROL-041", "LVL-08", { roleMapping: "proposed_unapproved", mappingRuleId: "GR-09", rawRoleText: "BI Dev", levelAdjustment: "none", originalLevelCode: "LVL-08" }],
      ["ROL-037", "LVL-08", { roleMapping: "confirmed", mappingRuleId: null, rawRoleText: "Data Engineer", levelAdjustment: "none", originalLevelCode: "LVL-08" }],
    ]);
    expect(built).toMatchObject({ allMappingsConfirmed: false, proposedMappingCount: 1, clampedLevelCount: 1, blendedLevelCode: "LVL-08" });
  });

  it("a confirmed-only template with a clamp is all-confirmed", () => {
    const built = podMembersFromTemplate("POD-P2", { library: LIBRARY, locationCode: LOC, requireConfirmedMappings: true });
    expect(built).toMatchObject({ ok: true, allMappingsConfirmed: true, proposedMappingCount: 0, clampedLevelCount: 1 });
  });

  it("requireConfirmedMappings refuses a template with any proposed mapping, listing each", () => {
    expect(podMembersFromTemplate("POD-P1", { library: LIBRARY, locationCode: LOC, requireConfirmedMappings: true })).toEqual({
      ok: false,
      code: "unconfirmed_role_mappings",
      message:
        "pod template 'POD-P1' has 1 role entry with a proposed, unapproved role mapping (\"BI Dev\" → ROL-041); confirmed mappings were required",
      proposedRoles: [{ rawRoleText: "BI Dev", roleCode: "ROL-041", mappingRuleId: "GR-09", fte: 1 }],
    });
    const twoProposed: PodTemplateLibrary = {
      podTemplates: [template("POD-P4")],
      podTemplateRoles: [
        row("POD-P4", { role_code: "ROL-041", raw_role_text: "BI Dev", ...PROPOSED }),
        row("POD-P4", { role_code: "ROL-024", raw_role_text: "Data Product Mgr", ...PROPOSED, mapping_rule_id: "GR-08", fte: 2 }),
      ],
    };
    const refused = podMembersFromTemplate("POD-P4", { library: twoProposed, locationCode: LOC, requireConfirmedMappings: true });
    expect(refused).toMatchObject({ ok: false, code: "unconfirmed_role_mappings" });
    expect(refused.ok ? "" : refused.message).toContain("has 2 role entries with a proposed, unapproved role mapping");
    expect(podMembersFromTemplate("POD-P1", { library: LIBRARY, locationCode: LOC, requireConfirmedMappings: false }).ok).toBe(true);
  });

  it("still refuses an unmatched row first, whatever the confirmed-only option", () => {
    const library: PodTemplateLibrary = {
      podTemplates: [template("POD-P5")],
      podTemplateRoles: [
        row("POD-P5", { role_code: "ROL-041", raw_role_text: "BI Dev", ...PROPOSED }),
        row("POD-P5", { role_code: null, raw_role_text: "Consultant", match_method: "unmatched", mapping_status: "unmatched", fte: 2 }),
      ],
    };
    for (const requireConfirmedMappings of [true, false]) {
      expect(podMembersFromTemplate("POD-P5", { library, locationCode: LOC, requireConfirmedMappings })).toMatchObject({
        ok: false,
        code: "unmatched_roles",
        unmatchedRoles: [{ rawRoleText: "Consultant", fte: 2 }],
      });
    }
  });

  it("refuses a row whose status alone says unmatched", () => {
    const library: PodTemplateLibrary = {
      podTemplates: [template("POD-P6")],
      podTemplateRoles: [row("POD-P6", { mapping_status: "unmatched", fte: 3 })],
    };
    expect(podMembersFromTemplate("POD-P6", { library, locationCode: LOC })).toMatchObject({ ok: false, code: "unmatched_roles" });
  });

  it.each([
    ["an exact row whose status says proposed", { mapping_status: "proposed_unapproved" as const }],
    ["a proposed row whose status says confirmed", { match_method: "proposed_by_tower" as const, mapping_rule_id: "GR-09" }],
  ])("treats %s as proposed: confirmed needs BOTH method and status", (_label, overrides) => {
    const library: PodTemplateLibrary = {
      podTemplates: [template("POD-P7")],
      podTemplateRoles: [row("POD-P7", { ...overrides, fte: 3 })],
    };
    const built = podMembersFromTemplate("POD-P7", { library, locationCode: LOC });
    expect(built).toMatchObject({ ok: true, allMappingsConfirmed: false, proposedMappingCount: 1 });
    expect(built.ok && built.members[0].provenance?.roleMapping).toBe("proposed_unapproved");
    expect(podMembersFromTemplate("POD-P7", { library, locationCode: LOC, requireConfirmedMappings: true })).toMatchObject({
      ok: false,
      code: "unconfirmed_role_mappings",
    });
  });

  it("an alias row is confirmed", () => {
    const library: PodTemplateLibrary = {
      podTemplates: [template("POD-P8")],
      podTemplateRoles: [row("POD-P8", { match_method: "alias", fte: 3 })],
    };
    expect(podMembersFromTemplate("POD-P8", { library, locationCode: LOC, requireConfirmedMappings: true })).toMatchObject({
      ok: true,
      allMappingsConfirmed: true,
    });
  });
});

// ---------------------------------------------------------------------------
// The pricer prints the caveats wherever the member appears
// ---------------------------------------------------------------------------

describe("pricePod prints proposed mappings and clamped levels on every term that uses them", () => {
  const CLAMP = "level clamped from LVL-08 to LVL-07";
  const PROPOSAL = `${PROPOSED_ROLE_MAPPING_CAVEAT} ("BI Dev" → ROL-041 by rule GR-09)`;

  it("uses the exact caveat wording", () => {
    expect(PROPOSED_ROLE_MAPPING_CAVEAT).toBe("proposed role mapping, unapproved");
  });

  it("puts each member's caveats in its FTE term, rate term, rate notes, line and the formula trace", () => {
    const { result } = priced("POD-P1");
    const [clamped, proposed, plain] = result.memberLines;

    expect(clamped.caveats).toEqual([CLAMP]);
    expect(clamped.formulaTerms[0]).toMatchObject({ label: "ROL-023/LVL-07@LOC-INDIA-TIER-1 FTE", source: `pod [${CLAMP}]` });
    expect(clamped.formulaTerms.find((t) => t.cellRole === "rate")?.source).toBe(`resolved:test:ROL-023-LVL-07 [${CLAMP}]`);
    expect(clamped.rate.notes).toEqual(["band confidence medium", CLAMP]);

    expect(proposed.caveats).toEqual([PROPOSAL]);
    expect(proposed.formulaTerms[0].source).toBe(`pod [${PROPOSAL}]`);
    expect(proposed.formulaTerms.find((t) => t.cellRole === "rate")?.source).toBe(`resolved:test:ROL-041-LVL-08 [${PROPOSAL}]`);
    expect(proposed.rate.notes).toEqual(["band confidence medium", PROPOSAL]);

    // A confirmed, unclamped member reads exactly as before.
    expect(plain.caveats).toEqual([]);
    expect(plain.formulaTerms[0].source).toBe("pod");
    expect(plain.formulaTerms.find((t) => t.cellRole === "rate")?.source).toBe("resolved:test:ROL-037-LVL-08");
    expect(plain.rate.notes).toEqual(["band confidence medium"]);

    expect(result.caveats).toEqual([
      `ROL-023/LVL-07@LOC-INDIA-TIER-1: ${CLAMP}`,
      `ROL-041/LVL-08@LOC-INDIA-TIER-1: ${PROPOSAL}`,
    ]);
    expect(result.formulaTrace).toContain(`ROL-023/LVL-07@LOC-INDIA-TIER-1 [${CLAMP}] 1 FTE × `);
    expect(result.formulaTrace).toContain(`ROL-041/LVL-08@LOC-INDIA-TIER-1 [${PROPOSAL}] 1 FTE × `);
    expect(result.formulaTrace).toContain(" + ROL-037/LVL-08@LOC-INDIA-TIER-1 1 FTE × ");
  });

  it("caveats change no number: the terms still reconcile and cost equals the un-caveated pod's", () => {
    const { built, result } = priced("POD-P1");
    for (const line of result.memberLines) {
      expect(evaluateFormulaTerms(line.formulaTerms)).toEqual({ hours: line.paidHours, costCents: line.costCents });
    }
    const bare = pricePod({
      adjustedHours: 400,
      pod: { podCode: "POD-P1", members: built.members.map((m) => ({ ...m, provenance: undefined })) },
      hoursPerFteWeek: 40,
      productiveShare: 0.8,
      rateResolver: flatRate,
    });
    if (!bare.ok) throw new Error(bare.message);
    expect(bare.totalCostCents).toBe(result.totalCostCents);
    expect(bare.caveats).toEqual([]);
  });

  it("a proposed AND clamped member carries both caveats, proposal first", () => {
    const { result } = priced("POD-P3");
    expect(result.memberLines[0].caveats).toEqual([
      `${PROPOSED_ROLE_MAPPING_CAVEAT} ("Data Product Mgr" → ROL-024 by rule GR-08)`,
      "level clamped from LVL-08 to LVL-06",
    ]);
    expect(result.memberLines[0].formulaTerms[0].source).toBe(
      `pod [${PROPOSED_ROLE_MAPPING_CAVEAT} ("Data Product Mgr" → ROL-024 by rule GR-08); level clamped from LVL-08 to LVL-06]`,
    );
  });

  it("a confirmed-only clamped pod shows only the clamp", () => {
    const { result } = priced("POD-P2");
    expect(result.caveats).toEqual(["ROL-044/LVL-09@LOC-INDIA-TIER-1: level clamped from LVL-08 to LVL-09"]);
  });

  it("podMemberCaveats omits the rule clause when no rule is named, and is empty without provenance", () => {
    const base: PodMember = { roleCode: "ROL-041", levelCode: "LVL-08", locationCode: LOC, fte: 1 };
    expect(podMemberCaveats(base)).toEqual([]);
    expect(
      podMemberCaveats({
        ...base,
        provenance: { roleMapping: "proposed_unapproved", mappingRuleId: null, rawRoleText: "BI Dev", levelAdjustment: "none", originalLevelCode: "LVL-08" },
      }),
    ).toEqual([`${PROPOSED_ROLE_MAPPING_CAVEAT} ("BI Dev" → ROL-041)`]);
  });

  it.each([
    ["a clamp flag on an unmoved level", { levelAdjustment: "clamped_up", originalLevelCode: "LVL-08" }],
    ["a moved level flagged none", { levelAdjustment: "none", originalLevelCode: "LVL-09" }],
    ["an unknown role mapping", { roleMapping: "guessed" }],
    ["an unknown level adjustment", { levelAdjustment: "nudged", originalLevelCode: "LVL-09" }],
  ])("refuses provenance with %s", (_label, overrides) => {
    const member = {
      roleCode: "ROL-041",
      levelCode: "LVL-08",
      locationCode: LOC,
      fte: 1,
      provenance: { roleMapping: "confirmed", mappingRuleId: null, rawRoleText: "BI Dev", levelAdjustment: "none", originalLevelCode: "LVL-08", ...overrides },
    } as unknown as PodMember;
    expect(
      pricePod({ adjustedHours: 10, pod: { podCode: "X", members: [member] }, hoursPerFteWeek: 40, productiveShare: 0.8, rateResolver: flatRate }),
    ).toMatchObject({ ok: false, code: "invalid_member_provenance" });
  });

  it.each([
    ["clamped_up", "LVL-09"], // raised from Intermediate to Senior
    ["clamped_down", "LVL-07"], // lowered from Lead to Senior
  ])("accepts a %s member whose level moved", (adjustment, originalLevelCode) => {
    const member: PodMember = {
      roleCode: "ROL-041",
      levelCode: "LVL-08",
      locationCode: LOC,
      fte: 1,
      provenance: { roleMapping: "confirmed", mappingRuleId: null, rawRoleText: "BI Dev", levelAdjustment: adjustment as "clamped_up", originalLevelCode },
    };
    const result = pricePod({ adjustedHours: 10, pod: { podCode: "X", members: [member] }, hoursPerFteWeek: 40, productiveShare: 0.8, rateResolver: flatRate });
    expect(result).toMatchObject({ ok: true, caveats: [`ROL-041/LVL-08@${LOC}: level clamped from ${originalLevelCode} to LVL-08`] });
  });
});

// ---------------------------------------------------------------------------
// The committed pod library, end to end
// ---------------------------------------------------------------------------

describe("against the committed pod library", () => {
  const dir = defaultReferencePackDir();
  const { data } = loadPodLibrary(dir);
  const library: PodTemplateLibrary = data;
  const coverage = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8")).rom_pod_library.role_match_coverage as {
    pods_priceable: number;
    pods_priceable_confirmed_only: number;
  };
  const resolver = createReferencePodRateResolver({ basis: "loaded_cost", ...loadRealPodRateReference() });

  it("every fully mapped template prices, and every proposed or clamped member says so on its terms", () => {
    let priceable = 0;
    let withProposals = 0;
    for (const t of data.podTemplates) {
      const built = podMembersFromTemplate(t.pod_code, { library, locationCode: LOC });
      if (!built.ok) {
        expect(built.code).toBe("unmatched_roles");
        continue;
      }
      const result = pricePod({ adjustedHours: 2000, pod: built.pod, hoursPerFteWeek: 40, productiveShare: 0.85, rateResolver: resolver });
      if (!result.ok) throw new Error(`${t.pod_code}: ${result.message}`);
      priceable += 1;
      if (!built.allMappingsConfirmed) withProposals += 1;
      const rows = data.podTemplateRoles.filter((r) => r.pod_code === t.pod_code);
      result.memberLines.forEach((line, i) => {
        const r = rows[i];
        const fteSource = line.formulaTerms[0].source;
        const rateSource = line.formulaTerms.find((term) => term.cellRole === "rate")?.source ?? "";
        const proposed = r.mapping_status === "proposed_unapproved";
        const clamped = r.level_adjustment !== "none";
        for (const source of [fteSource, rateSource, line.rate.notes.join(" | ")]) {
          expect(source.includes(PROPOSED_ROLE_MAPPING_CAVEAT)).toBe(proposed);
          expect(source.includes(`level clamped from ${r.original_level_code} to ${r.level_code}`)).toBe(clamped);
        }
      });
    }
    expect(priceable).toBe(coverage.pods_priceable);
    expect(withProposals).toBeGreaterThan(0);
  });

  it("with requireConfirmedMappings, exactly the confirmed-only templates build", () => {
    const built = data.podTemplates.filter(
      (t) => podMembersFromTemplate(t.pod_code, { library, locationCode: LOC, requireConfirmedMappings: true }).ok,
    );
    expect(built.length).toBe(coverage.pods_priceable_confirmed_only);
    for (const t of built) {
      const rows = data.podTemplateRoles.filter((r) => r.pod_code === t.pod_code);
      expect(rows.every((r) => r.mapping_status === "confirmed")).toBe(true);
    }
  });
});
