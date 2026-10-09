/**
 * ROM increment 2a — pod templates and the agent capacity scenario.
 *
 * The first suites use small invented libraries so every expectation is
 * hand-computable. The agent scenario is checked against the workbook's own
 * "Estimation Engine" worked example (8 humans + 12 agents at 1.3 equiv FTE
 * and 72% utilization). The last suite runs against the committed pod
 * library and asserts only relationships computed from the rows it reads.
 */
import { describe, expect, it } from "@jest/globals";
import type {
  PricingAgentProfileRow,
  PricingPodTemplateRoleRow,
  PricingPodTemplateRow,
} from "../../types";
import { defaultReferencePackDir, loadPodLibrary } from "../../reference-pack-loader";
import { evaluateFormulaTerms } from "../formula-terms";
import { pricePod, type PodRateResolver, type ResolvedPodRate } from "../pod-pricer";
import { createReferencePodRateResolver } from "../pod-rate-adapter";
import {
  AGENT_SCENARIO_ASSUMPTION_STATUS,
  DEFAULT_AGENT_LICENCE_BASIS_REASON,
  agentCapacityScenario,
  podMembersFromTemplate,
  type PodTemplateLibrary,
} from "../pod-templates";
import { loadRealPodRateReference } from "../__fixtures__/test-fixtures";

function template(code: string, overrides: Partial<PricingPodTemplateRow> = {}): PricingPodTemplateRow {
  return {
    pod_code: code,
    name: `${code} pod`,
    tower_code: "TWR-04",
    headcount: 4,
    blended_level_code: "LVL-08",
    agent_mix_codes: ["AGENT-B", "AGENT-ABARVA"],
    source_artifact: "Workforce_Taxonomy_Master.xlsx:Delivery Pods",
    source_row: 6,
    status: "active",
    version: 1,
    ...overrides,
  };
}

function role(
  podCode: string,
  roleCode: string | null,
  fte: number,
  raw: string,
): PricingPodTemplateRoleRow {
  return {
    pod_code: podCode,
    role_code: roleCode,
    level_code: "LVL-08",
    original_level_code: "LVL-08",
    level_adjustment: "none",
    fte,
    raw_role_text: raw,
    match_method: roleCode === null ? "unmatched" : "exact",
    mapping_status: roleCode === null ? "unmatched" : "confirmed",
    mapping_rule_id: null,
    source_row: 6,
  };
}

const LIBRARY: PodTemplateLibrary = {
  podTemplates: [
    template("POD-001"),
    template("POD-002", { headcount: 5 }),
    template("POD-003", { status: "retired" }),
    template("POD-004"),
  ],
  podTemplateRoles: [
    role("POD-001", "ROL-023", 1, "Data Architect"),
    role("POD-001", "ROL-037", 3, "3x Data Engineer"),
    role("POD-002", "ROL-023", 1, "Data Architect"),
    role("POD-002", null, 1, "Data Product Mgr"),
    role("POD-002", "ROL-037", 2, "2x Data Engineer"),
    role("POD-002", null, 1, "BI Dev"),
    role("POD-003", "ROL-023", 4, "4x Data Architect"),
  ],
};

function profile(code: string, overrides: Partial<PricingAgentProfileRow> = {}): PricingAgentProfileRow {
  return {
    agent_code: code,
    name: code,
    agent_type: "agent",
    monthly_cost_usd: 3500,
    equiv_eng_fte: 1.3,
    utilization: 0.72,
    productivity: 1.85,
    documentation: 1.65,
    testing: 1.8,
    architecture: 1.4,
    assumption_basis: "product_owner_planning_assumption_no_external_source",
    source_artifact: "Workforce_Taxonomy_Master.xlsx:Agent Economics",
    source_row: 10,
    confidence: "low",
    approval_status: "global_starter_unapproved",
    ...overrides,
  };
}

// The workbook's "Agent Economics" rows B (coding agent) and AbarVa Agents.
const PROFILES = [
  profile("AGENT-B", { monthly_cost_usd: 4000, equiv_eng_fte: 1.2, utilization: 0.75, productivity: 1.8 }),
  profile("AGENT-ABARVA"),
];

// ---------------------------------------------------------------------------
// podMembersFromTemplate
// ---------------------------------------------------------------------------

describe("podMembersFromTemplate", () => {
  it("builds one member per role row at its level, location and provider class, each with confirmed provenance", () => {
    const result = podMembersFromTemplate("POD-001", {
      library: LIBRARY,
      locationCode: "LOC-INDIA-TIER-1",
      providerClassCode: "SI-T2",
    });
    const confirmed = (raw: string) => ({
      roleMapping: "confirmed",
      mappingRuleId: null,
      rawRoleText: raw,
      levelAdjustment: "none",
      originalLevelCode: "LVL-08",
    });
    const members = [
      { roleCode: "ROL-023", levelCode: "LVL-08", locationCode: "LOC-INDIA-TIER-1", providerClassCode: "SI-T2", fte: 1, provenance: confirmed("Data Architect") },
      { roleCode: "ROL-037", levelCode: "LVL-08", locationCode: "LOC-INDIA-TIER-1", providerClassCode: "SI-T2", fte: 3, provenance: confirmed("3x Data Engineer") },
    ];
    expect(result).toEqual({
      ok: true,
      podCode: "POD-001",
      templateName: "POD-001 pod",
      blendedLevelCode: "LVL-08",
      members,
      pod: { podCode: "POD-001", members },
      agentMixCodes: ["AGENT-B", "AGENT-ABARVA"],
      allMappingsConfirmed: true,
      proposedMappingCount: 0,
      clampedLevelCount: 0,
      source: "Workforce_Taxonomy_Master.xlsx:Delivery Pods row 6",
    });
  });

  it("defaults the provider class to null", () => {
    const result = podMembersFromTemplate("POD-001", { library: LIBRARY, locationCode: "LOC-INDIA-TIER-1" });
    expect(result.ok && result.members.every((m) => m.providerClassCode === null)).toBe(true);
  });

  it("refuses a template with any unmatched role, listing every one — never a partial pod", () => {
    const result = podMembersFromTemplate("POD-002", { library: LIBRARY, locationCode: "LOC-INDIA-TIER-1" });
    expect(result).toEqual({
      ok: false,
      code: "unmatched_roles",
      message:
        "pod template 'POD-002' has 2 role entries with no role code (\"Data Product Mgr\", \"BI Dev\"); a partial pod is never priced",
      unmatchedRoles: [
        { rawRoleText: "Data Product Mgr", fte: 1 },
        { rawRoleText: "BI Dev", fte: 1 },
      ],
    });
    expect(result).not.toHaveProperty("members");
  });

  it("refuses a row with a null role code even if its method says matched", () => {
    const library: PodTemplateLibrary = {
      podTemplates: [template("POD-009")],
      podTemplateRoles: [{ ...role("POD-009", null, 4, "Engineer"), match_method: "exact" }],
    };
    expect(podMembersFromTemplate("POD-009", { library, locationCode: "LOC-INDIA-TIER-1" })).toMatchObject({
      ok: false,
      code: "unmatched_roles",
    });
  });

  it("refuses a row marked unmatched even if it carries a role code", () => {
    const library: PodTemplateLibrary = {
      podTemplates: [template("POD-009")],
      podTemplateRoles: [{ ...role("POD-009", "ROL-037", 4, "Engineer"), match_method: "unmatched" }],
    };
    expect(podMembersFromTemplate("POD-009", { library, locationCode: "LOC-INDIA-TIER-1" })).toMatchObject({
      ok: false,
      code: "unmatched_roles",
    });
  });

  it.each([
    ["POD-404", "LOC-INDIA-TIER-1", "unknown_template"],
    ["POD-003", "LOC-INDIA-TIER-1", "inactive_template"],
    ["POD-004", "LOC-INDIA-TIER-1", "template_has_no_roles"],
    ["POD-001", "  ", "invalid_location"],
  ])("refuses %s at %j as %s", (code, locationCode, expected) => {
    expect(podMembersFromTemplate(code, { library: LIBRARY, locationCode })).toMatchObject({
      ok: false,
      code: expected,
    });
  });
});

// ---------------------------------------------------------------------------
// agentCapacityScenario — the workbook's Estimation Engine formula
// ---------------------------------------------------------------------------

describe("agentCapacityScenario", () => {
  // Workbook "Estimation Engine": D35 humans = 8, D36 agents = 12, platform
  // "AbarVa Agents" (C14 equiv FTE 1.3, C15 utilization 0.72, C16 annual
  // = 3500 × 12). D37 = D35 + D36 × C14 × C15.
  const D35 = 8;
  const D36 = 12;
  const C14 = 1.3;
  const C15 = 0.72;
  const C16 = 3500 * 12;

  it("effective FTE equals the workbook's D35 + D36 × C14 × C15 exactly", () => {
    const result = agentCapacityScenario(D35, [{ agentCode: "AGENT-ABARVA", count: D36 }], {
      profiles: PROFILES,
      licenceBasis: "per_platform",
      licenceBasisReason: "matches the Estimation Engine worked example",
    });
    if (!result.ok) throw new Error(result.message);
    expect(result.effectiveFte).toBe(19.232);
    expect(result.effectiveFte).toBe(Math.round((D35 + D36 * C14 * C15) * 10000) / 10000);
    expect(result.agentFte).toBe(11.232);
    expect(result.agentLines[0].addedFte).toBe(11.232);
  });

  it("the traditional column (no agents) is the humans alone, at no licence cost", () => {
    const result = agentCapacityScenario(18, [], { profiles: PROFILES, licenceBasis: "per_agent" });
    expect(result).toMatchObject({ ok: true, effectiveFte: 18, agentFte: 0, licenceCostCentsPerMonth: 0, agentLines: [] });
  });

  it("per_platform licence matches the workbook's monthly platform charge (C16 ÷ 12); per_agent charges every agent", () => {
    const perPlatform = agentCapacityScenario(D35, [{ agentCode: "AGENT-ABARVA", count: D36 }], {
      profiles: PROFILES,
      licenceBasis: "per_platform",
      licenceBasisReason: "matches the Estimation Engine worked example",
    });
    const perAgent = agentCapacityScenario(D35, [{ agentCode: "AGENT-ABARVA", count: D36 }], {
      profiles: PROFILES,
      licenceBasis: "per_agent",
    });
    if (!perPlatform.ok || !perAgent.ok) throw new Error("refused");
    expect(perPlatform.licenceCostCentsPerMonth).toBe((C16 / 12) * 100);
    expect(perPlatform.agentLines[0].licenceQuantity).toBe(1);
    expect(perAgent.licenceCostCentsPerMonth).toBe(D36 * 3500 * 100);
    expect(perAgent.agentLines[0].licenceQuantity).toBe(D36);
    // The basis changes cost only, never capacity.
    expect(perAgent.effectiveFte).toBe(perPlatform.effectiveFte);
  });

  it("per_platform charges nothing for an agent type with count 0", () => {
    const result = agentCapacityScenario(2, [{ agentCode: "AGENT-B", count: 0 }], {
      profiles: PROFILES,
      licenceBasis: "per_platform",
      licenceBasisReason: "matches the Estimation Engine worked example",
    });
    expect(result).toMatchObject({ ok: true, effectiveFte: 2, licenceCostCentsPerMonth: 0 });
  });

  it("sums several agent types and its terms reconcile per line", () => {
    const result = agentCapacityScenario(
      5,
      [
        { agentCode: "AGENT-B", count: 2 },
        { agentCode: "AGENT-ABARVA", count: 3 },
      ],
      { profiles: PROFILES, licenceBasis: "per_agent" },
    );
    if (!result.ok) throw new Error(result.message);
    // 2 × 1.2 × 0.75 = 1.8; 3 × 1.3 × 0.72 = 2.808
    expect(result.agentLines.map((l) => l.addedFte)).toEqual([1.8, 2.808]);
    expect(result.agentFte).toBe(4.608);
    expect(result.effectiveFte).toBe(9.608);
    expect(result.licenceCostCentsPerMonth).toBe(2 * 400000 + 3 * 350000);
    for (const line of result.agentLines) {
      expect(evaluateFormulaTerms(line.capacityTerms)?.hours).toBe(line.addedFte);
      expect(evaluateFormulaTerms(line.licenceTerms)?.costCents).toBe(line.licenceCostCentsPerMonth);
    }
    expect(result.agentLines[0].capacityTerms.map((t) => t.source)).toEqual([
      "scenario",
      "pricing_agent_profiles:AGENT-B:equiv_eng_fte",
      "pricing_agent_profiles:AGENT-B:utilization",
      "engine",
    ]);
    expect(result.formulaTrace).toBe(
      "effective FTE = 5 humans + 2 × AGENT-B 1.2 FTE × 0.75 util (1.8) + 3 × AGENT-ABARVA 1.3 FTE × 0.72 util (2.808) = 9.608; " +
        `licences/month (per_agent: ${DEFAULT_AGENT_LICENCE_BASIS_REASON}) = 2 × $4000.00 + 3 × $3500.00 = $18500.00; unconfirmed planning assumption, no productivity credit applied`,
    );
  });

  it("labels its output an unconfirmed planning assumption and applies no productivity credit", () => {
    const result = agentCapacityScenario(8, [{ agentCode: "AGENT-ABARVA", count: 12 }], {
      profiles: PROFILES,
      licenceBasis: "per_agent",
    });
    if (!result.ok) throw new Error(result.message);
    expect(result.assumptionStatus).toBe(AGENT_SCENARIO_ASSUMPTION_STATUS);
    expect(AGENT_SCENARIO_ASSUMPTION_STATUS).toBe("unconfirmed planning assumption");
    expect(result.productivityCreditApplied).toBe(false);
    expect(result.profileApprovalStatuses).toEqual(["global_starter_unapproved"]);
    expect(result.agentLines[0].source).toBe(
      "pricing_agent_profiles:AGENT-ABARVA (global_starter_unapproved, confidence low)",
    );
    expect(result.agentLines[0].unappliedMultipliers).toEqual({
      productivity: 1.85,
      documentation: 1.65,
      testing: 1.8,
      architecture: 1.4,
    });
  });

  it("the gain multipliers change nothing it computes", () => {
    const inflated = [
      profile("AGENT-ABARVA", { productivity: 9, documentation: 9, testing: 9, architecture: 9 }),
    ];
    const base = agentCapacityScenario(8, [{ agentCode: "AGENT-ABARVA", count: 12 }], {
      profiles: PROFILES,
      licenceBasis: "per_agent",
    });
    const changed = agentCapacityScenario(8, [{ agentCode: "AGENT-ABARVA", count: 12 }], {
      profiles: inflated,
      licenceBasis: "per_agent",
    });
    if (!base.ok || !changed.ok) throw new Error("refused");
    expect(changed.effectiveFte).toBe(base.effectiveFte);
    expect(changed.licenceCostCentsPerMonth).toBe(base.licenceCostCentsPerMonth);
    expect(changed.agentLines[0].capacityTerms).toEqual(base.agentLines[0].capacityTerms);
  });

  describe("licence basis (product-owner decision: default per_agent)", () => {
    const twelve = [{ agentCode: "AGENT-ABARVA", count: 12 }];

    it("defaults to per_agent when the caller names no basis, and records that it defaulted and why", () => {
      const result = agentCapacityScenario(8, twelve, { profiles: PROFILES });
      if (!result.ok) throw new Error(result.message);
      expect(result.licenceBasis).toBe("per_agent");
      expect(result.licenceBasisDefaulted).toBe(true);
      expect(result.licenceBasisReason).toBe(DEFAULT_AGENT_LICENCE_BASIS_REASON);
      expect(DEFAULT_AGENT_LICENCE_BASIS_REASON).toMatch(/^default per_agent \(product-owner decision 2026-10-10\)/);
      expect(result.agentLines[0].licenceQuantity).toBe(12);
      expect(result.licenceCostCentsPerMonth).toBe(12 * 350000);
      expect(result.agentLines[0].licenceTerms[0]).toMatchObject({ label: "licensed agents", source: "scenario:per_agent" });
      expect(result.formulaTrace).toContain(`licences/month (per_agent: ${DEFAULT_AGENT_LICENCE_BASIS_REASON}) = 12 × $3500.00 = $42000.00`);
    });

    it("an explicit per_agent is not 'defaulted'; it records the caller's reason, or the default one", () => {
      const bare = agentCapacityScenario(8, twelve, { profiles: PROFILES, licenceBasis: "per_agent" });
      const reasoned = agentCapacityScenario(8, twelve, {
        profiles: PROFILES,
        licenceBasis: "per_agent",
        licenceBasisReason: "  vendor quotes per seat  ",
      });
      if (!bare.ok || !reasoned.ok) throw new Error("refused");
      expect(bare).toMatchObject({ licenceBasisDefaulted: false, licenceBasisReason: DEFAULT_AGENT_LICENCE_BASIS_REASON });
      expect(reasoned).toMatchObject({ licenceBasisDefaulted: false, licenceBasisReason: "vendor quotes per seat" });
      expect(reasoned.licenceCostCentsPerMonth).toBe(bare.licenceCostCentsPerMonth);
    });

    it.each([
      ["no reason", undefined],
      ["an empty reason", ""],
      ["a blank reason", "   "],
    ])("refuses per_platform with %s", (_label, reason) => {
      expect(
        agentCapacityScenario(8, twelve, { profiles: PROFILES, licenceBasis: "per_platform", licenceBasisReason: reason }),
      ).toEqual({
        ok: false,
        code: "licence_basis_reason_required",
        message:
          "licenceBasis 'per_platform' charges one subscription however many agents run, so it needs a non-empty licenceBasisReason; the default is 'per_agent'",
      });
    });

    it("accepts per_platform with a reason and records both in the output and the trace", () => {
      const result = agentCapacityScenario(8, twelve, {
        profiles: PROFILES,
        licenceBasis: "per_platform",
        licenceBasisReason: " enterprise platform contract ",
      });
      if (!result.ok) throw new Error(result.message);
      expect(result).toMatchObject({
        licenceBasis: "per_platform",
        licenceBasisReason: "enterprise platform contract",
        licenceBasisDefaulted: false,
        licenceCostCentsPerMonth: 350000,
      });
      expect(result.agentLines[0].licenceTerms[0]).toMatchObject({ label: "platform subscriptions", source: "scenario:per_platform" });
      expect(result.formulaTrace).toContain("licences/month (per_platform: enterprise platform contract) = 1 × $3500.00 = $3500.00");
    });

    it("a non-string reason counts as no reason", () => {
      expect(
        agentCapacityScenario(8, twelve, {
          profiles: PROFILES,
          licenceBasis: "per_platform",
          licenceBasisReason: 42 as unknown as string,
        }),
      ).toMatchObject({ ok: false, code: "licence_basis_reason_required" });
    });
  });

  it.each([
    ["negative humans", -1, [], "per_agent", "invalid_humans_fte"],
    ["NaN humans", Number.NaN, [], "per_agent", "invalid_humans_fte"],
    ["infinite humans", Number.POSITIVE_INFINITY, [], "per_agent", "invalid_humans_fte"],
    ["an unknown licence basis", 1, [], "per_seat", "invalid_licence_basis"],
    ["a fractional agent count", 1, [{ agentCode: "AGENT-B", count: 1.5 }], "per_agent", "invalid_agent_count"],
    ["a negative agent count", 1, [{ agentCode: "AGENT-B", count: -1 }], "per_agent", "invalid_agent_count"],
    ["a NaN agent count", 1, [{ agentCode: "AGENT-B", count: Number.NaN }], "per_agent", "invalid_agent_count"],
    ["a duplicate agent", 1, [{ agentCode: "AGENT-B", count: 1 }, { agentCode: "AGENT-B", count: 1 }], "per_agent", "duplicate_agent"],
    ["an unknown agent", 1, [{ agentCode: "AGENT-Z", count: 1 }], "per_agent", "unknown_agent"],
  ])("refuses %s", (_label, humans, agents, basis, code) => {
    expect(
      agentCapacityScenario(humans as number, agents as { agentCode: string; count: number }[], {
        profiles: PROFILES,
        licenceBasis: basis as "per_agent",
      }),
    ).toMatchObject({ ok: false, code });
  });

  it.each([
    ["zero equiv FTE", { equiv_eng_fte: 0 }],
    ["zero utilization", { utilization: 0 }],
    ["utilization above 1", { utilization: 72 }],
    ["a negative monthly cost", { monthly_cost_usd: -1 }],
    ["a NaN equiv FTE", { equiv_eng_fte: Number.NaN }],
  ])("refuses a profile with %s", (_label, overrides) => {
    expect(
      agentCapacityScenario(1, [{ agentCode: "AGENT-X", count: 1 }], {
        profiles: [profile("AGENT-X", overrides)],
        licenceBasis: "per_agent",
      }),
    ).toMatchObject({ ok: false, code: "invalid_agent_profile" });
  });
});

// ---------------------------------------------------------------------------
// Default paths apply no agent credit
// ---------------------------------------------------------------------------

describe("default pod pricing applies no agent credit", () => {
  const flatRate: PodRateResolver = (member) => {
    const rate: ResolvedPodRate = {
      basis: "loaded_cost",
      currency: "USD",
      baseSource: `test:${member.roleCode}`,
      baseRateCents: 10000,
      location: { source: "test", value: 1, notAppliedReason: null },
      provider: { source: "test", value: 1, notAppliedReason: null },
      hourlyRateCents: 10000,
      rateTerms: [
        { label: "base", value: 10000, source: "test", cellRole: "rate" },
        { label: "loc", value: 1, source: "test", cellRole: "factor" },
        { label: "prov", value: 1, source: "test", cellRole: "factor" },
      ],
      trace: "test",
      notes: [],
    };
    return rate;
  };

  it("members carry only the humans: total FTE equals the template headcount, whatever its agent mix", () => {
    const result = podMembersFromTemplate("POD-001", { library: LIBRARY, locationCode: "LOC-INDIA-TIER-1" });
    if (!result.ok) throw new Error(result.message);
    expect(result.members.reduce((acc, m) => acc + m.fte, 0)).toBe(4);
    expect(result.members.map((m) => m.roleCode)).not.toContain("AGENT-B");
  });

  it("a template's agent mix changes neither weeks nor cost of the priced pod", () => {
    const withAgents = podMembersFromTemplate("POD-001", { library: LIBRARY, locationCode: "LOC-INDIA-TIER-1" });
    const noAgentsLibrary: PodTemplateLibrary = {
      ...LIBRARY,
      podTemplates: LIBRARY.podTemplates.map((t) => ({ ...t, agent_mix_codes: [] })),
    };
    const withoutAgents = podMembersFromTemplate("POD-001", { library: noAgentsLibrary, locationCode: "LOC-INDIA-TIER-1" });
    if (!withAgents.ok || !withoutAgents.ok) throw new Error("refused");
    const price = (pod: typeof withAgents.pod) =>
      pricePod({ adjustedHours: 1000, pod, hoursPerFteWeek: 40, productiveShare: 0.8, rateResolver: flatRate });
    const a = price(withAgents.pod);
    const b = price(withoutAgents.pod);
    if (!a.ok || !b.ok) throw new Error("refused");
    // 4 FTE × 40 h × 0.8 = 128 productive h/week; ceil(1000 / 128) = 8 weeks.
    expect(a.weeks).toBe(8);
    expect(a.totalCostCents).toBe(b.totalCostCents);
    expect(a.totalCostCents).toBe(4 * 8 * 40 * 10000);
    expect(a.toolLicenceLines).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The committed pod library
// ---------------------------------------------------------------------------

describe("against the committed pod library", () => {
  const { data } = loadPodLibrary(defaultReferencePackDir());
  const library: PodTemplateLibrary = data;

  it("every fully matched template yields members summing to its headcount; every other template is refused whole", () => {
    let built = 0;
    for (const t of data.podTemplates) {
      const rows = data.podTemplateRoles.filter((r) => r.pod_code === t.pod_code);
      const unmatched = rows.filter((r) => r.match_method === "unmatched");
      const result = podMembersFromTemplate(t.pod_code, { library, locationCode: "LOC-INDIA-TIER-1" });
      if (unmatched.length === 0) {
        if (!result.ok) throw new Error(`${t.pod_code}: ${result.message}`);
        built += 1;
        expect(result.members.reduce((acc, m) => acc + m.fte, 0)).toBe(t.headcount);
        expect(result.members.map((m) => m.levelCode)).toEqual(rows.map((r) => r.level_code));
        expect(result.members.every((m) => m.provenance?.originalLevelCode === t.blended_level_code)).toBe(true);
      } else {
        expect(result).toMatchObject({ ok: false, code: "unmatched_roles" });
        expect(result.ok ? [] : result.unmatchedRoles?.map((u) => u.rawRoleText)).toEqual(
          unmatched.map((r) => r.raw_role_text),
        );
      }
    }
    expect(built).toBeGreaterThan(0);
  });

  it("a fully matched template prices end to end through the reference rate adapter, or refuses for a missing band", () => {
    const reference = loadRealPodRateReference();
    const resolver = createReferencePodRateResolver({ basis: "loaded_cost", ...reference });
    let priced = 0;
    for (const t of data.podTemplates) {
      const result = podMembersFromTemplate(t.pod_code, { library, locationCode: "LOC-INDIA-TIER-1" });
      if (!result.ok) continue;
      const bandsPresent = result.members.every((m) =>
        reference.rateBands.some((b) => b.rate_band_code === `${m.roleCode}-${m.levelCode}`),
      );
      const priced1 = pricePod({
        adjustedHours: 2000,
        pod: result.pod,
        hoursPerFteWeek: 40,
        productiveShare: 0.85,
        rateResolver: resolver,
      });
      if (bandsPresent) {
        expect(priced1.ok).toBe(true);
        priced += 1;
      } else {
        expect(priced1).toMatchObject({ ok: false, code: "rate_unresolved", rateRefusal: { code: "no_rate_band" } });
      }
    }
    expect(priced).toBeGreaterThan(0);
  });

  it("the agent mixes name only committed agent profiles, and the scenario runs on them", () => {
    const codes = new Set(data.agentProfiles.map((a) => a.agent_code));
    for (const t of data.podTemplates) for (const c of t.agent_mix_codes) expect(codes.has(c)).toBe(true);
    const result = agentCapacityScenario(
      8,
      [{ agentCode: "AGENT-ABARVA", count: 12 }],
      { profiles: data.agentProfiles, licenceBasis: "per_platform", licenceBasisReason: "the Estimation Engine worked example" },
    );
    expect(result).toMatchObject({ ok: true, effectiveFte: 19.232, licenceCostCentsPerMonth: 350000 });
  });
});
