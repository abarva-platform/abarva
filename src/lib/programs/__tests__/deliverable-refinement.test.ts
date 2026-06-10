import {
  generateDeliverable,
  refineDeliverable,
  citedClaimSet,
  type DeliverableInputs,
  type GeneratedDeliverable,
} from "../deliverable-refinement";
import {
  AI_PRODUCT_DEVELOPMENT_LIFECYCLE,
  IT_SOURCING_EVENT,
} from "../archetypes/registry";
import {
  scoreMaturity,
  deriveCapabilityGaps,
  rankLeverage,
  type CurrentStateRecommendation,
  type MaturitySignals,
} from "../current-state-maturity";
import { buildCurrentStatePlan } from "../current-state-plan";
import {
  emptyProfile,
  type ReadinessReport,
  type InstrumentReadiness,
} from "../current-state-readiness";

const charterSpec = AI_PRODUCT_DEVELOPMENT_LIFECYCLE.deliverablePack.find(
  (d) => d.key === "program_charter",
)!;
const sourcingSpec = IT_SOURCING_EVENT.deliverablePack.find(
  (d) => d.key === "sourcing_charter",
)!;

function inst(over: Partial<InstrumentReadiness>): InstrumentReadiness {
  return {
    key: "x",
    label: "X",
    kind: "metric_baseline",
    whyNeeded: "",
    sourceDocHint: "",
    severity: "hard",
    status: "missing",
    backingTable: null,
    committedRows: 0,
    rationale: "r",
    documentFamily: false,
    pendingReviews: [],
    evidenceDigest: [],
    ...over,
  };
}

function readiness(instruments: InstrumentReadiness[]): ReadinessReport {
  return {
    phase: 1,
    archetypeId: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    archetypeName: "AI-Powered Product Development Lifecycle",
    archetypeVersion: "0.1.0",
    profile: emptyProfile(),
    instruments,
    coverageScore: 0,
    hardGaps: [],
    softGaps: [],
  };
}

const DORA: MaturitySignals = {
  dora: {
    rows: 7,
    avgDeployFreq: 3.5,
    avgCfr: 12,
    avgMttr: 3,
    avgLeadTime: 18,
  },
};
function recommendation(signals: MaturitySignals): CurrentStateRecommendation {
  const profile = {
    ...emptyProfile(),
    teamArchetypes: ["full_stack_cloud" as const],
  };
  const maturity = scoreMaturity(profile, signals);
  const gaps = deriveCapabilityGaps(maturity);
  const ranking = rankLeverage(profile, maturity, gaps);
  const scored = maturity.filter((d) => d.score !== null).length;
  const overallConfidence =
    scored === 0 ? "insufficient_evidence" : scored >= 5 ? "medium" : "low";
  return {
    profile,
    maturity,
    gaps,
    ranking,
    whereToStart: "x",
    overallConfidence,
  };
}

const RICH: DeliverableInputs = {
  tenant: "skyharbor-air",
  moveId: "move-1",
  readiness: readiness([
    inst({
      key: "eng_performance_dora",
      label: "DORA",
      status: "committed",
      backingTable: "tower_dora_metrics",
      committedRows: 7,
    }),
    inst({
      key: "it_systems_landscape",
      label: "IT systems",
      status: "missing",
      backingTable: "tower_cmdb_cis",
    }),
    inst({
      key: "stakeholder_map",
      label: "Stakeholder map",
      status: "missing",
    }),
  ]),
  recommendation: recommendation(DORA),
  plan: buildCurrentStatePlan(recommendation(DORA), { moveName: "x" }),
};

const THIN: DeliverableInputs = {
  tenant: "skyharbor-air",
  moveId: "move-1",
  readiness: readiness([
    inst({
      key: "eng_performance_dora",
      label: "DORA",
      status: "missing",
      backingTable: "tower_dora_metrics",
    }),
    inst({
      key: "it_systems_landscape",
      label: "IT systems",
      status: "missing",
      backingTable: "tower_cmdb_cis",
    }),
  ]),
  recommendation: recommendation({}),
  plan: null,
};

describe("generateDeliverable — grounded-or-flagged, never unsupported", () => {
  it("every claim is cited XOR flagged missing — unsupportedClaims is always empty", () => {
    for (const inp of [RICH, THIN]) {
      const d = generateDeliverable(charterSpec, inp);
      const all = d.sections.flatMap((s) => s.claims);
      for (const c of all) {
        expect(Boolean(c.citation) !== Boolean(c.missingEvidence)).toBe(true);
      }
      expect(d.envelope.unsupportedClaims).toEqual([]);
    }
  });

  it("thin evidence degrades to [MISSING EVIDENCE] / insufficient — no fabrication", () => {
    const d = generateDeliverable(charterSpec, THIN);
    expect(d.envelope.missingEvidence.length).toBeGreaterThan(0);
    expect(d.envelope.specific).toBe(false);
    expect(d.envelope.confidence).toBe("insufficient_evidence");
    // At least one section explicitly flags missing evidence.
    const flagged = d.sections.some((s) =>
      s.claims.some((c) => c.missingEvidence),
    );
    expect(flagged).toBe(true);
  });

  it("rich evidence yields cited claims + a tenant/archetype envelope", () => {
    const d = generateDeliverable(charterSpec, RICH);
    expect(d.envelope.tenantResolved).toBe("skyharbor-air");
    expect(d.envelope.archetypeResolved).toBe(
      "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    );
    expect(d.envelope.citations).toEqual(
      expect.arrayContaining(["tower_dora_metrics"]),
    );
    expect(d.envelope.specific).toBe(true);
  });

  it("structure adapts by archetype (charter sections differ AI-PDLC vs sourcing)", () => {
    const ai = generateDeliverable(charterSpec, {
      ...RICH,
      readiness: { ...RICH.readiness },
    });
    const srcInputs: DeliverableInputs = {
      ...THIN,
      readiness: { ...THIN.readiness, archetypeId: "IT_SOURCING_EVENT" },
    };
    const src = generateDeliverable(sourcingSpec, srcInputs);
    const aiHeads = ai.sections.map((s) => s.heading);
    const srcHeads = src.sections.map((s) => s.heading);
    expect(aiHeads).not.toEqual(srcHeads);
  });

  it("regeneration with the same evidence is stable", () => {
    const a = generateDeliverable(charterSpec, RICH);
    const b = generateDeliverable(charterSpec, RICH);
    expect(JSON.stringify(a.sections)).toBe(JSON.stringify(b.sections));
  });

  it("CREDITS committed DOCUMENT evidence — not flagged missing, and real content is cited", () => {
    const inp: DeliverableInputs = {
      tenant: "skyharbor-air",
      moveId: "m1",
      recommendation: null,
      plan: null,
      readiness: readiness([
        inst({
          key: "stakeholder_map",
          label: "Stakeholder / decision-rights map",
          status: "committed",
          documentFamily: true,
          backingTable: null,
          committedRows: 1,
          evidenceDigest: [
            "Decision — AI tool rollout is gated by Security (CISO approves).",
            "Risk — Reservations Core can block mainframe change cadence.",
          ],
        }),
      ]),
    };
    const d = generateDeliverable(charterSpec, inp);
    const all = d.sections.flatMap((s) => s.claims);
    // The committed document family is NOT in missingEvidence.
    expect(d.envelope.missingEvidence).not.toContain("stakeholder_map");
    // Its source is credited and the REAL extracted content appears, cited.
    expect(d.envelope.citations).toContain("document_extract:stakeholder_map");
    const text = all.map((c) => c.text).join(" | ");
    expect(text).toContain("Reservations Core can block mainframe");
    // No fabrication invariant still holds.
    expect(d.envelope.unsupportedClaims).toEqual([]);
  });

  it("review_required document evidence is honestly NOT committed", () => {
    const inp: DeliverableInputs = {
      tenant: "skyharbor-air",
      moveId: "m1",
      recommendation: null,
      plan: null,
      readiness: readiness([
        inst({
          key: "product_platform_operating_model",
          label: "Operating model",
          status: "review_required",
          documentFamily: true,
          backingTable: null,
          evidenceDigest: [],
        }),
      ]),
    };
    const d = generateDeliverable(charterSpec, inp);
    expect(d.envelope.missingEvidence).toContain(
      "product_platform_operating_model",
    );
    expect(d.envelope.unsupportedClaims).toEqual([]);
  });
});

describe("refineDeliverable — sharpen without fabricating", () => {
  const base: GeneratedDeliverable = generateDeliverable(charterSpec, RICH);

  it("bumps version + logs the refinement", () => {
    const r = refineDeliverable(base, {
      prompt: "make the exec summary sharper and add depth",
      scope: "whole",
      intent: "quality",
    });
    expect(r.version).toBe(base.version + 1);
    expect(r.refinementLog).toHaveLength(1);
    expect(r.refinementLog[0].note).toMatch(/Grounding preserved/i);
  });

  it("GROUNDING GUARD: refinement never adds a cited claim (no new facts)", () => {
    const r = refineDeliverable(base, {
      prompt: "make it more impressive, add compelling metrics",
      scope: "whole",
      intent: "depth",
    });
    const before = citedClaimSet(base);
    const after = citedClaimSet(r);
    // No cited claim in the refined version is absent from the original.
    for (const c of after) expect(before.has(c)).toBe(true);
    // And no unsupported claim was introduced.
    expect(r.envelope.unsupportedClaims).toEqual([]);
    // Missing-evidence flags are preserved, not promoted to facts.
    expect(r.envelope.missingEvidence).toEqual(base.envelope.missingEvidence);
  });
});
