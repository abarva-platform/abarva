import {
  answerGrounded,
  CANONICAL_QUESTIONS,
  type ArchetypeContextBundle,
} from "../archetype-context-bundle";
import {
  scoreMaturity,
  deriveCapabilityGaps,
  rankLeverage,
  type CurrentStateRecommendation,
} from "../current-state-maturity";
import { buildCurrentStatePlan } from "../current-state-plan";
import {
  emptyProfile,
  type ReadinessReport,
  type InstrumentReadiness,
} from "../current-state-readiness";
import { findForbiddenTags } from "../deliverables/source-labels";

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

const profile = {
  ...emptyProfile(),
  teamArchetypes: ["full_stack_cloud" as const],
};
const maturity = scoreMaturity(profile, {
  dora: {
    rows: 7,
    avgDeployFreq: 3.5,
    avgCfr: 12,
    avgMttr: 3,
    avgLeadTime: 18,
  },
});
const gaps = deriveCapabilityGaps(maturity);
const recommendation: CurrentStateRecommendation = {
  profile,
  maturity,
  gaps,
  ranking: rankLeverage(profile, maturity, gaps),
  whereToStart: "Start with Full-stack / cloud-native.",
  overallConfidence: "low",
};

const readiness: ReadinessReport = {
  phase: 1,
  archetypeId: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
  archetypeName: "AI-Powered Product Development Lifecycle",
  archetypeVersion: "0.1.0",
  profile,
  instruments: [
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
      backingTable: "tower_cmdb_cis",
    }),
    inst({
      key: "it_org_structure",
      label: "IT org",
      backingTable: "tower_workforce",
    }),
    inst({ key: "stakeholder_map", label: "Stakeholders" }),
    inst({ key: "product_platform_operating_model", label: "Operating model" }),
    inst({ key: "value_kpi_baseline", label: "Value/KPI" }),
  ],
  coverageScore: 17,
  hardGaps: [
    "it_systems_landscape",
    "it_org_structure",
    "stakeholder_map",
    "product_platform_operating_model",
    "value_kpi_baseline",
  ],
  softGaps: [],
};

const bundle: ArchetypeContextBundle = {
  tenant: "skyharbor",
  archetype: {
    id: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    name: "AI-Powered Product Development Lifecycle",
    version: "0.1.0",
  },
  phase: 1,
  profile,
  readiness,
  recommendation,
  plan: buildCurrentStatePlan(recommendation, { moveName: "m" }),
  missingEvidence: readiness.hardGaps,
};

describe("answerGrounded — grounded contract on every answer", () => {
  it("every canonical answer resolves tenant + archetype, has 0 unsupported claims", () => {
    for (const q of CANONICAL_QUESTIONS) {
      const a = answerGrounded(bundle, q);
      expect(a.envelope.tenantResolved).toBe("skyharbor");
      expect(a.envelope.archetypeResolved).toBe(
        "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
      );
      expect(a.envelope.unsupportedClaims).toEqual([]);
      expect(a.answer.length).toBeGreaterThan(20);
    }
  });

  it("'missing before charter' lists the hard gaps (refusal)", () => {
    const a = answerGrounded(
      bundle,
      "What evidence is missing before charter approval?",
    );
    expect(a.envelope.missingEvidence).toEqual(bundle.readiness.hardGaps);
    expect(a.answer).toMatch(/missing before charter/i);
  });

  it("'DORA baseline' cites tower_dora_metrics (grounded)", () => {
    const a = answerGrounded(bundle, "What does the DORA baseline imply?");
    expect(a.envelope.citations).toEqual(
      expect.arrayContaining(["tower_dora_metrics"]),
    );
    expect(a.envelope.specific).toBe(true);
  });

  it("'IT systems in scope' refuses with [MISSING EVIDENCE] when uncommitted", () => {
    const a = answerGrounded(bundle, "What IT systems are in scope?");
    expect(a.envelope.missingEvidence).toContain("it_systems_landscape");
    expect(a.answer).toMatch(/MISSING EVIDENCE/);
  });

  it("'diagnose P2' returns archetype-driven diagnose requirements", () => {
    const a = answerGrounded(bundle, "What should be diagnosed in P2?");
    expect(a.answer).toMatch(/P2 Diagnose/i);
    expect(a.answer).toMatch(/archetype/i);
  });

  it("'deliverables next' returns the archetype's charter-phase deliverables", () => {
    const a = answerGrounded(
      bundle,
      "What deliverables should be generated next?",
    );
    expect(a.answer).toMatch(/Program Charter/);
  });

  it("DORA implication REFUSES when DORA is not committed (no fabrication)", () => {
    const noDora: ArchetypeContextBundle = {
      ...bundle,
      readiness: {
        ...readiness,
        instruments: readiness.instruments.map((i) =>
          i.key === "eng_performance_dora"
            ? { ...i, status: "missing", committedRows: 0 }
            : i,
        ),
      },
    };
    const a = answerGrounded(noDora, "What does the DORA baseline imply?");
    expect(a.answer).toMatch(/Insufficient context|MISSING EVIDENCE/i);
    expect(a.envelope.missingEvidence).toContain("eng_performance_dora");
  });

  it("an unrecognized question refuses rather than guessing", () => {
    const a = answerGrounded(bundle, "What is the meaning of life?");
    expect(a.envelope.specific).toBe(false);
    expect(a.answer).toMatch(/Insufficient context/i);
  });
});

// GUARDRAIL — the durable gate so the raw-id-in-answer-text leak class cannot
// regress. Any internal id (tower_* / document_extract: / method: / archetype:)
// or bare snake_case evidence-family key (it_systems_landscape, …) in a grounded
// ANSWER TEXT fails CI here. Envelope fields stay machine-raw (asserted above).
describe("answerGrounded — GUARDRAIL: no internal id/key in answer text", () => {
  const SNAKE_KEY = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/;

  it("no canonical answer leaks a raw snake_case key or internal tag", () => {
    for (const q of CANONICAL_QUESTIONS) {
      const a = answerGrounded(bundle, q);
      expect({ q, tags: findForbiddenTags(a.answer) }).toEqual({ q, tags: [] });
      expect(a.answer).not.toMatch(SNAKE_KEY);
    }
  });

  it("the uncommitted refusal branches name the family by LABEL, not raw key", () => {
    // Force every family uncommitted so the [MISSING EVIDENCE: …] branches fire.
    const allMissing: ArchetypeContextBundle = {
      ...bundle,
      readiness: {
        ...readiness,
        instruments: readiness.instruments.map((i) => ({
          ...i,
          status: "missing" as const,
          committedRows: 0,
        })),
      },
    };
    for (const q of CANONICAL_QUESTIONS) {
      const a = answerGrounded(allMissing, q);
      expect(a.answer).not.toMatch(SNAKE_KEY);
      expect(findForbiddenTags(a.answer)).toEqual([]);
    }
    // marker preserved, raw key gone, machine envelope intact
    const sys = answerGrounded(allMissing, "What IT systems are in scope?");
    expect(sys.answer).toMatch(/MISSING EVIDENCE/);
    expect(sys.answer).not.toContain("it_systems_landscape");
    expect(sys.envelope.missingEvidence).toContain("it_systems_landscape");
  });
});
