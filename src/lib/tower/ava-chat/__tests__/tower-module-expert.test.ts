import type { TowerContextPack } from "@/lib/enterprise-knowledge/contracts";
import { classifyTowerAvaQuestion, shouldBuildTowerAvaPacketForMode } from "../answer-modes";
import { TOWER_AVA_MODULE_EXPERT_CONTRACT } from "../module-expert";
import { buildTowerAvaChatPacket } from "../packet";
import { runTowerAvaQualityGate } from "../quality-gate";

function contextPack(overrides: Partial<TowerContextPack> = {}): TowerContextPack {
  return {
    tenantKey: "demo-tenant",
    projectionStatus: "projected",
    caveats: [],
    gaps: [],
    towerTruthCaveats: [],
    towerMetricRecords: [
      {
        metricId: "m1",
        label: "Ticket deflection rate",
        value: "34%",
        safeToDisplay: true,
        projectionStatus: "measured",
      },
      {
        metricId: "m2",
        label: "Support cost per ticket",
        value: "$18.40",
        safeToDisplay: false,
        projectionStatus: "projected",
      },
    ],
    towerValueClaims: [
      {
        claimId: "c1",
        label: "Automation saving",
        gateStatus: "blocked",
        realizedValueLanguageAllowed: false,
        reason: "No finance-approved baseline on file.",
        requiredEvidence: ["finance-approved baseline"],
      },
    ],
    blockedValueClaims: [
      {
        claimId: "c1",
        label: "Automation saving",
        gateStatus: "blocked",
        realizedValueLanguageAllowed: false,
        reason: "No finance-approved baseline on file.",
        requiredEvidence: ["finance-approved baseline"],
      },
    ],
    ...overrides,
  } as unknown as TowerContextPack;
}

const PACKET = buildTowerAvaChatPacket({ contextPack: contextPack() }, "q");

describe("Tower aVa answer modes", () => {
  it("classifies Tower-owned questions", () => {
    expect(classifyTowerAvaQuestion("Have we realized the savings?").mode).toBe(
      "value_realization",
    );
    expect(classifyTowerAvaQuestion("What is the adoption level?").mode).toBe(
      "adoption_status",
    );
    expect(classifyTowerAvaQuestion("Where are we on the deflection metric?").mode).toBe(
      "metric_status",
    );
  });

  it("redirects work Tower observes but does not run", () => {
    for (const q of [
      "How do we advance this phase?",
      "Which vendor should we pick in the RFP?",
      "How do we negotiate the renewal?",
    ]) {
      expect([q, classifyTowerAvaQuestion(q).isOutOfScope]).toEqual([q, true]);
    }
  });

  it("builds no packet when the surface is not hardened", () => {
    expect(
      shouldBuildTowerAvaPacketForMode({ hardeningEnabled: false, mode: "metric_status" }),
    ).toBe(false);
  });
});

describe("Tower aVa packet carries only what the deterministic layer published", () => {
  it("withholds a metric that is not safe to display, and carries no number for it", () => {
    expect(PACKET.displayableMetrics.map((m) => m.label)).toEqual([
      "Ticket deflection rate",
    ]);
    expect(PACKET.displayableMetrics[0].normalizedFigures).toContain("pct:34");
    expect(PACKET.permittedFigureFingerprints).toContain("pct:34");
    expect(PACKET.withheldMetricLabels).toEqual(["Support cost per ticket"]);
    expect(JSON.stringify(PACKET)).not.toContain("18.40");
  });

  it("carries blocked claims with the reason and the evidence that would unblock them", () => {
    expect(PACKET.blockedValueClaims[0]).toMatchObject({
      label: "Automation saving",
      realizedValueLanguageAllowed: false,
      requiredEvidence: ["finance-approved baseline"],
    });
  });
});

describe("Tower aVa quality gate — explains, never computes", () => {
  it("PHASE 3 EXIT CRITERION: rejects a figure the packet never published", () => {
    const invented = runTowerAvaQualityGate(
      "Deflection is running at 34% and is saving about $2.4M a year. One gap remains.",
      PACKET,
      "metric_status",
    );
    expect(invented.checks.no_unsupported_number).toBe(false);
    expect(invented.pass).toBe(false);
    expect(invented.repairInstructions.join(" ")).toContain("not published");
  });

  it("accepts an answer that states only published figures", () => {
    const grounded = runTowerAvaQualityGate(
      "Ticket deflection rate is 34%. Support cost per ticket is tracked but not yet displayable, so that part stays unproven.",
      PACKET,
      "metric_status",
    );
    expect([grounded.failedChecks, grounded.pass]).toEqual([[], true]);
  });

  it("accepts a normalized restatement of a published figure", () => {
    const grounded = runTowerAvaQualityGate(
      "Ticket deflection rate is thirty-four percent. The support-cost metric is tracked but not yet displayable.",
      PACKET,
      "metric_status",
    );
    expect([grounded.failedChecks, grounded.pass]).toEqual([[], true]);
  });

  it("rejects a nearby rounded figure that the packet did not publish", () => {
    const rounded = runTowerAvaQualityGate(
      "Ticket deflection rate is 35%. The support-cost metric is tracked but not yet displayable.",
      PACKET,
      "metric_status",
    );
    expect(rounded.checks.no_unsupported_number).toBe(false);
  });

  it("rejects realized-value language when no claim permits it", () => {
    const result = runTowerAvaQualityGate(
      "The automation saving has been realized. One gap remains.",
      PACKET,
      "value_realization",
    );
    expect(result.checks.no_realized_value_overclaim).toBe(false);
  });

  it("rejects an answer claiming Tower certifies value", () => {
    const result = runTowerAvaQualityGate(
      "Tower certifies the benefit is on track. One gap remains.",
      PACKET,
      "value_realization",
    );
    expect(result.checks.no_certification_claim).toBe(false);
  });

  it("requires the evidence boundary to be named when the packet carries limits", () => {
    const silent = runTowerAvaQualityGate(
      "Ticket deflection rate is 34% and the programme looks healthy.",
      PACKET,
      "metric_status",
    );
    expect(silent.checks.names_evidence_boundary).toBe(false);
  });
});

describe("Tower module expert contract", () => {
  it("delegates to the same functions the direct path uses", () => {
    expect(TOWER_AVA_MODULE_EXPERT_CONTRACT.surface).toBe("tower");
    expect(TOWER_AVA_MODULE_EXPERT_CONTRACT.classifyQuestion("adoption?")).toEqual(
      classifyTowerAvaQuestion("adoption?"),
    );
    expect(
      TOWER_AVA_MODULE_EXPERT_CONTRACT.runQualityGate(
        "Ticket deflection rate is 34%. One gap remains.",
        PACKET,
        "metric_status",
      ),
    ).toEqual(
      runTowerAvaQualityGate(
        "Ticket deflection rate is 34%. One gap remains.",
        PACKET,
        "metric_status",
      ),
    );
  });
});
