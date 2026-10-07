/**
 * Two grounded answers in `archetype-context-bundle` asserted something the
 * layer underneath them did not say.
 *
 * `resolveArchetypeRequirements` returns a severity per evidence family, and
 * for a soft one its own rationale reads "is not a hard blocker". The P2
 * answer flattened hard and soft into one list introduced by the word
 * "requires", so an optional family was stated to the reader as required and
 * nothing in the answer distinguished the two.
 *
 * The next answer mapped a phase number to an archetype phase key with
 * `phase === 1 ? "charter" : phase === 2 ? "diagnose" : "charter"`, so P0, P3,
 * P4 and P5 were all answered with the charter entries under the words "at
 * this phase".
 *
 * Both are pinned here against the declared demo archetype, whose phase model
 * is the one the end-to-end walk traverses. Expected labels are written out
 * rather than mapped from the record under test, so a rename or a dropped
 * entry fails a case instead of travelling into the expectation.
 */
import {
  answerGrounded,
  type ArchetypeContextBundle,
} from "../archetype-context-bundle";
import { phaseKeyForNumber } from "../archetypes/phase-key";
import { PHASE_NUMBER, type PhaseKey } from "../archetypes/types";
import { emptyProfile, type ReadinessReport } from "../current-state-readiness";
import { buildCurrentStatePlan } from "../current-state-plan";
import {
  scoreMaturity,
  deriveCapabilityGaps,
  rankLeverage,
  type CurrentStateRecommendation,
} from "../current-state-maturity";

const ARCHETYPE_ID = "GOVERNED_DATA_FOUNDATION";

/** The eleven the archetype declares `hard` at diagnose. */
const HARD_FAMILIES = [
  "data_governance_ownership",
  "semantic_layer_certification",
  "data_lineage_audit_trail",
  "data_quality_rules",
  "source_system_data_access",
  "platform_architecture_readiness",
  "master_identity_resolution",
  "privacy_security_controls",
  "model_risk_responsible_ai_controls",
  "measurement_owner_cadence",
  "finance_baseline_value_plan",
] as const;

/** The optional twelfth. The approved evidence pack supplies the eleven only. */
const SOFT_FAMILY = "change_adoption_owner";

/**
 * Label every family through the bundle's own instruments, so each assertion
 * matches a string this test owns rather than product copy that may be
 * reworded for unrelated reasons.
 */
const labelFor = (key: string) => `LBL:${key}`;

const profile = emptyProfile();
const maturity = scoreMaturity(profile, {});
const gaps = deriveCapabilityGaps(maturity);
const recommendation: CurrentStateRecommendation = {
  profile,
  maturity,
  gaps,
  ranking: rankLeverage(profile, maturity, gaps),
  whereToStart: "Start with the governed data foundation.",
  overallConfidence: "low",
};

const readiness: ReadinessReport = {
  phase: 2,
  archetypeId: ARCHETYPE_ID,
  archetypeName: "Governed Data Foundation",
  archetypeVersion: "0.1.0",
  profile,
  instruments: [...HARD_FAMILIES, SOFT_FAMILY].map((key) => ({
    key,
    label: labelFor(key),
    kind: "metric_baseline" as const,
    whyNeeded: "",
    sourceDocHint: "",
    severity: "hard" as const,
    status: "missing" as const,
    backingTable: null,
    committedRows: 0,
    rationale: "r",
    documentFamily: false,
    pendingReviews: [],
    evidenceDigest: [],
  })),
  coverageScore: 0,
  hardGaps: [...HARD_FAMILIES],
  softGaps: [SOFT_FAMILY],
};

function bundleAtPhase(phase: number): ArchetypeContextBundle {
  return {
    tenant: "demo-tenant",
    archetype: {
      id: ARCHETYPE_ID,
      name: "Governed Data Foundation",
      version: "0.1.0",
    },
    phase,
    profile,
    readiness,
    recommendation,
    plan: buildCurrentStatePlan(recommendation, { moveName: "m" }),
    missingEvidence: readiness.hardGaps,
  };
}

const OPTIONAL_MARKER = "Optional context, not a blocker:";

describe("phaseKeyForNumber — the inverse is derived, not re-written", () => {
  it("maps each product phase number to its declared phase key", () => {
    expect(phaseKeyForNumber(0)).toBe("originate");
    expect(phaseKeyForNumber(1)).toBe("charter");
    expect(phaseKeyForNumber(2)).toBe("diagnose");
    expect(phaseKeyForNumber(3)).toBe("design");
    expect(phaseKeyForNumber(4)).toBe("roadmap_business_case");
    expect(phaseKeyForNumber(5)).toBe("mobilize");
    expect(phaseKeyForNumber(6)).toBe("handoff_operate");
  });

  it("covers every key PHASE_NUMBER declares, with no number answering twice", () => {
    const keys = Object.keys(PHASE_NUMBER) as PhaseKey[];
    for (const key of keys) {
      expect(phaseKeyForNumber(PHASE_NUMBER[key])).toBe(key);
    }
    const numbers = keys.map((key) => PHASE_NUMBER[key]);
    expect(new Set(numbers).size).toBe(keys.length);
  });

  it("answers null for a number that names no phase, rather than a phase", () => {
    expect(phaseKeyForNumber(7)).toBeNull();
    expect(phaseKeyForNumber(-1)).toBeNull();
    expect(phaseKeyForNumber(1.5)).toBeNull();
  });
});

describe("P2 diagnose answer — severity survives into the sentence", () => {
  const answer = answerGrounded(
    bundleAtPhase(2),
    "What should be diagnosed in P2?",
  ).answer;

  it("states every hard family as required", () => {
    const required = answer.split(OPTIONAL_MARKER)[0]!;
    for (const family of HARD_FAMILIES) {
      expect(required).toContain(labelFor(family));
    }
  });

  it("states the soft family as optional context, not as a requirement", () => {
    expect(answer).toContain(OPTIONAL_MARKER);
    const [required, optional] = answer.split(OPTIONAL_MARKER);
    expect(required).not.toContain(labelFor(SOFT_FAMILY));
    expect(optional).toContain(labelFor(SOFT_FAMILY));
  });

  it("does not describe the optional family with the word it is governed by", () => {
    // The defect was a single list introduced by "requires". A reader who
    // searches the requirement sentence for the optional family must not
    // find it there.
    const required = answer.split(OPTIONAL_MARKER)[0]!;
    expect(required).toMatch(/requires:/);
    expect(
      required.split(/requires:/)[1]!.includes(labelFor(SOFT_FAMILY)),
    ).toBe(false);
  });
});

describe("next-deliverables answer — the phase asked about is the phase answered", () => {
  const ask = (phase: number) =>
    answerGrounded(bundleAtPhase(phase), "What deliverables should be generated next?")
      .answer;

  it("P1 names the charter entry", () => {
    expect(ask(1)).toContain("Program Charter");
  });

  it("P2 names the diagnose entry", () => {
    const a = ask(2);
    expect(a).toContain("Discovery & Diagnostic Report");
    expect(a).not.toContain("Program Charter");
  });

  it("P3 names the design entries, not the charter entry", () => {
    const a = ask(3);
    expect(a).toContain("Target AI-Augmented Operations Model");
    expect(a).toContain("AI Decision-Support Architecture");
    expect(a).not.toContain("Program Charter");
  });

  it("P4 names the roadmap and business-case entries", () => {
    const a = ask(4);
    expect(a).toContain("Business Case & Financial Model");
    expect(a).toContain("Execution Roadmap");
    expect(a).not.toContain("Program Charter");
  });

  it("P5 names the mobilize entry", () => {
    const a = ask(5);
    expect(a).toContain("Mobilization & Go-Decision Packet");
    expect(a).not.toContain("Program Charter");
  });

  it("a phase the pack declares nothing for says so, rather than borrowing another phase's", () => {
    const a = ask(0);
    expect(a).toContain("none defined");
    expect(a).not.toContain("Program Charter");
  });
});
