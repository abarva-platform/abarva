// Generality proof: the SAME engine code serves a completely different archetype
// (IT_SOURCING_EVENT) with ZERO change to any Charter/phase/engine code — the only
// IT_SOURCING-specific code is its registry entry. This is the framework's reason
// to exist.

import { resolveArchetypeRequirements } from "../resolver";
import {
  AI_PRODUCT_DEVELOPMENT_LIFECYCLE,
  IT_SOURCING_EVENT,
} from "../registry";
import {
  generateDeliverable,
  type DeliverableInputs,
} from "@/lib/programs/deliverable-refinement";
import {
  answerGrounded,
  type ArchetypeContextBundle,
} from "@/lib/programs/archetype-context-bundle";
import {
  scoreMaturity,
  deriveCapabilityGaps,
  rankLeverage,
} from "@/lib/programs/current-state-maturity";
import { buildCurrentStatePlan } from "@/lib/programs/current-state-plan";
import {
  emptyProfile,
  type ReadinessReport,
  type InstrumentReadiness,
} from "@/lib/programs/current-state-readiness";

const keys = (rs: { family: { key: string } }[]) => rs.map((r) => r.family.key);

describe("generality — IT_SOURCING_EVENT through the same engine", () => {
  it("charter requirements are sourcing evidence, NOT DORA/IT (resolver)", () => {
    const k = keys(resolveArchetypeRequirements(IT_SOURCING_EVENT, "charter"));
    expect(k).toEqual(
      expect.arrayContaining([
        "vendor_spend",
        "contract_inventory",
        "sla_baseline",
        "current_scope",
      ]),
    );
    expect(k).not.toContain("eng_performance_dora");
    expect(k).not.toContain("it_systems_landscape");
  });

  it("deliverable structure adapts — sourcing charter sections, not AI-PDLC", () => {
    const sourcingSpec = IT_SOURCING_EVENT.deliverablePack.find(
      (d) => d.key === "sourcing_charter",
    )!;
    const aiSpec = AI_PRODUCT_DEVELOPMENT_LIFECYCLE.deliverablePack.find(
      (d) => d.key === "program_charter",
    )!;

    const readiness: ReadinessReport = {
      phase: 1,
      archetypeId: "IT_SOURCING_EVENT",
      archetypeName: "IT Sourcing Event",
      archetypeVersion: "0.1.0",
      profile: emptyProfile(),
      instruments: [],
      coverageScore: 0,
      hardGaps: [],
      softGaps: [],
    };
    const inputs: DeliverableInputs = {
      tenant: "skyharbor-air",
      moveId: "sourcing-move",
      readiness,
      recommendation: null,
      plan: null,
    };

    const doc = generateDeliverable(sourcingSpec, inputs);
    const heads = doc.sections.map((s) => s.heading);
    expect(heads).toEqual(
      expect.arrayContaining([
        "Scope & service towers",
        "Spend baseline",
        "SLA baseline",
      ]),
    );
    expect(heads).not.toEqual(aiSpec.sections);
    expect(doc.envelope.archetypeResolved).toBe("IT_SOURCING_EVENT");
    expect(doc.envelope.unsupportedClaims).toEqual([]);
  });

  it("grounded answers serve IT_SOURCING's own families (diagnose + deliverables)", () => {
    const profile = emptyProfile();
    const maturity = scoreMaturity(profile, {});
    const gaps = deriveCapabilityGaps(maturity);
    const readiness: ReadinessReport = {
      phase: 1,
      archetypeId: "IT_SOURCING_EVENT",
      archetypeName: "IT Sourcing Event",
      archetypeVersion: "0.1.0",
      profile,
      instruments: [
        {
          key: "vendor_spend",
          label: "Vendor spend",
          kind: "financial",
          whyNeeded: "",
          sourceDocHint: "",
          severity: "hard",
          status: "missing",
          backingTable: null,
          committedRows: 0,
          rationale: "r",
        } as InstrumentReadiness,
      ],
      coverageScore: 0,
      hardGaps: ["vendor_spend", "contract_inventory", "sla_baseline"],
      softGaps: [],
    };
    const recommendation = {
      profile,
      maturity,
      gaps,
      ranking: rankLeverage(profile, maturity, gaps),
      whereToStart: "x",
      overallConfidence: "insufficient_evidence" as const,
    };
    const bundle: ArchetypeContextBundle = {
      tenant: "skyharbor-air",
      archetype: {
        id: "IT_SOURCING_EVENT",
        name: "IT Sourcing Event",
        version: "0.1.0",
      },
      phase: 1,
      profile,
      readiness,
      recommendation,
      plan: buildCurrentStatePlan(recommendation, { moveName: "m" }),
      missingEvidence: readiness.hardGaps,
    };

    const diagnose = answerGrounded(bundle, "What should be diagnosed in P2?");

    // What this case claims is in its name: the answer serves IT_SOURCING's OWN
    // families. It used to assert that by matching three raw family keys, and
    // went red when the answer began rendering humanised labels instead —
    // "Sla Baseline" for `sla_baseline`. The families were right the whole
    // time; only the vocabulary moved, and a pinned vocabulary reports that as
    // a product defect.
    //
    // So the expectation is DERIVED from the archetype's own phase model, and
    // compared on a normalised form that is blind to case and separators. The
    // negative half is what makes it a proof rather than a keyword search: the
    // other archetype's families are disjoint from this one's, and none of them
    // may appear. An answer built from a fixed list would fail that.
    const normalise = (value: string) =>
      value.toLowerCase().replace(/[^a-z0-9]+/g, " ");
    const familiesOf = (archetype: typeof IT_SOURCING_EVENT) =>
      archetype.phaseModel.flatMap((phase) =>
        phase.requiredEvidence.map((evidence) => evidence.family),
      );

    const ownFamilies = familiesOf(IT_SOURCING_EVENT);
    const foreignFamilies = familiesOf(AI_PRODUCT_DEVELOPMENT_LIFECYCLE).filter(
      (family) => !ownFamilies.includes(family),
    );
    const normalisedAnswer = normalise(diagnose.answer);

    // Non-vacuous: an empty list on either side would make the two assertions
    // below hold against any answer at all, including an empty string.
    expect(ownFamilies.length).toBeGreaterThan(0);
    expect(foreignFamilies.length).toBeGreaterThan(0);

    expect(
      ownFamilies.filter((family) =>
        normalisedAnswer.includes(normalise(family)),
      ),
    ).not.toEqual([]);
    expect(
      foreignFamilies.filter((family) =>
        normalisedAnswer.includes(normalise(family)),
      ),
    ).toEqual([]);
    expect(diagnose.envelope.tenantResolved).toBe("skyharbor-air");
    expect(diagnose.envelope.archetypeResolved).toBe("IT_SOURCING_EVENT");

    const next = answerGrounded(
      bundle,
      "What deliverables should be generated next?",
    );
    expect(next.answer).toMatch(/Sourcing Charter/);

    const missing = answerGrounded(
      bundle,
      "What evidence is missing before charter approval?",
    );
    expect(missing.envelope.missingEvidence).toEqual(readiness.hardGaps);
    // Same engine, different archetype — still 0 unsupported.
    for (const a of [diagnose, next, missing]) {
      expect(a.envelope.unsupportedClaims).toEqual([]);
    }
  });
});
