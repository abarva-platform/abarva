// Blast-radius diagnostic — the classification must never manufacture a repair
// candidate. Every corruption call requires an exact known-boilerplate match
// plus a differing non-empty scaffold source. "Looks generic" is not evidence.

import {
  CHARTER_MIRROR_TARGETS,
  diagnoseMove,
  OVERWRITABLE_CAPTURE_KEYS,
  SCAFFOLD_SOURCE_KEYS,
  summarizeBlastRadius,
  type MoveLayers,
} from "../p0-corruption-diagnostic";
import { LEGACY_ORIGINATE_PLACEHOLDERS } from "../phase-capture-integrity";

const BOILER_PROBLEM = LEGACY_ORIGINATE_PLACEHOLDERS[0];
const BOILER_SPONSOR = LEGACY_ORIGINATE_PLACEHOLDERS[2];
const REAL_PROBLEM =
  "Carrier-controlled delay is the largest addressable reliability loss at the in-scope stations.";
const REAL_SPONSOR = "Accountable sponsor: SVP Flight Operations.";

function layers(over: Partial<MoveLayers> = {}): MoveLayers {
  return {
    moveId: "move-1",
    tenantKey: "skyharbor",
    moveName: "Predictive Turnaround",
    scaffold: {},
    charter: {},
    captureValues: {},
    ...over,
  };
}

describe("scope of what could have been damaged", () => {
  it("assesses exactly the eight keys the broken client sent", () => {
    expect(OVERWRITABLE_CAPTURE_KEYS).toHaveLength(8);
    const assessed = diagnoseMove(layers()).fields.map((f) => f.captureKey);
    expect(assessed).toEqual([...OVERWRITABLE_CAPTURE_KEYS]);
  });

  it("never assesses the three keys that were never in the payload", () => {
    for (const never of [
      "scope_out",
      "outcomes_success",
      "discovery_questions",
    ]) {
      expect(OVERWRITABLE_CAPTURE_KEYS).not.toContain(never);
      expect(CHARTER_MIRROR_TARGETS[never]).toBeUndefined();
    }
  });

  it("marks the charter layer not-applicable where the mirror never wrote", () => {
    // recommendation_to_advance IS mirrored; a key outside the map would not be.
    const d = diagnoseMove(layers());
    for (const field of d.fields) {
      const mirrored = Boolean(CHARTER_MIRROR_TARGETS[field.captureKey]);
      if (!mirrored) {
        expect(field.charterAssessment).toBe("not_applicable");
        expect(field.charterMirrorValue).toBeNull();
      }
    }
  });
});

describe("corruption requires all three conditions", () => {
  it("flags boilerplate in capture with a differing scaffold value", () => {
    const d = diagnoseMove(
      layers({
        scaffold: { problem_statement: REAL_PROBLEM },
        captureValues: { problem_statement: BOILER_PROBLEM },
      }),
    );
    const field = d.fields.find((f) => f.captureKey === "problem_statement")!;
    expect(field.captureAssessment).toBe("likely_corrupt_repairable");
    expect(d.affected).toBe(true);
    expect(d.corruptCaptureKeys).toContain("problem_statement");
  });

  it("does NOT flag bland-but-real text that is not a known placeholder", () => {
    const d = diagnoseMove(
      layers({
        scaffold: { problem_statement: REAL_PROBLEM },
        captureValues: {
          problem_statement: "We want to improve things generally.",
        },
      }),
    );
    expect(d.affected).toBe(false);
    expect(
      d.fields.find((f) => f.captureKey === "problem_statement")!
        .captureAssessment,
    ).toBe("clean");
  });

  it("calls boilerplate with NO scaffold source ambiguous, not clean", () => {
    const d = diagnoseMove(
      layers({ captureValues: { problem_statement: BOILER_PROBLEM } }),
    );
    const field = d.fields.find((f) => f.captureKey === "problem_statement")!;
    expect(field.captureAssessment).toBe("ambiguous");
    expect(field.captureAction).toBe("human_review");
    expect(d.ambiguousKeys).toContain("problem_statement");
    expect(d.fullyRestorable).toBe(false);
  });

  it("does not flag when scaffold happens to equal the live value", () => {
    // Nothing to restore — the values already agree, whatever they say.
    const d = diagnoseMove(
      layers({
        scaffold: { problem_statement: BOILER_PROBLEM },
        captureValues: { problem_statement: BOILER_PROBLEM },
      }),
    );
    expect(
      d.fields.find((f) => f.captureKey === "problem_statement")!
        .captureAssessment,
    ).toBe("corrupt_unrestorable");
    expect(d.fullyRestorable).toBe(false);
  });

  it("treats an empty capture value as never_captured, not corrupt", () => {
    // "Never captured" is a legitimate state, not damage.
    const d = diagnoseMove(
      layers({
        scaffold: { problem_statement: REAL_PROBLEM },
        captureValues: { problem_statement: "" },
      }),
    );
    expect(d.affected).toBe(false);
    expect(
      d.fields.find((f) => f.captureKey === "problem_statement")!
        .captureAssessment,
    ).toBe("never_captured");
  });

  it("recommends restore only for the deterministically repairable case", () => {
    const d = diagnoseMove(
      layers({
        scaffold: { problem_statement: REAL_PROBLEM },
        captureValues: { problem_statement: BOILER_PROBLEM },
      }),
    );
    expect(
      d.fields.find((f) => f.captureKey === "problem_statement")!.captureAction,
    ).toBe("restore_from_scaffold");
  });
});

describe("both layers are assessed independently", () => {
  it("detects a corrupt charter mirror even when capture is clean", () => {
    const d = diagnoseMove(
      layers({
        scaffold: { sponsor_candidate: REAL_SPONSOR },
        charter: { sponsor_candidate: BOILER_SPONSOR },
        captureValues: { stakeholder_owner_view: REAL_SPONSOR },
      }),
    );
    expect(d.corruptCaptureKeys).toEqual([]);
    expect(d.corruptCharterKeys).toContain("stakeholder_owner_view");
    expect(d.affected).toBe(true);
  });

  it("detects both layers corrupted for the same field", () => {
    const d = diagnoseMove(
      layers({
        scaffold: { sponsor_candidate: REAL_SPONSOR },
        charter: { sponsor_candidate: BOILER_SPONSOR },
        captureValues: { stakeholder_owner_view: BOILER_SPONSOR },
      }),
    );
    expect(d.corruptCaptureKeys).toContain("stakeholder_owner_view");
    expect(d.corruptCharterKeys).toContain("stakeholder_owner_view");
    expect(d.fullyRestorable).toBe(true);
  });

  it("maps each capture key to its real charter mirror target", () => {
    // The mirror renamed fields on the way in; the diagnostic must follow.
    expect(CHARTER_MIRROR_TARGETS.initial_value_hypothesis).toBe(
      "value_hypothesis",
    );
    expect(CHARTER_MIRROR_TARGETS.stakeholder_owner_view).toBe(
      "sponsor_candidate",
    );
  });

  it("reads each capture key from its real scaffold origin", () => {
    expect(SCAFFOLD_SOURCE_KEYS.affected_function_process).toBe("scope_in");
    expect(SCAFFOLD_SOURCE_KEYS.known_evidence).toBe("evidence_family");
    // The old client hardcoded this one; origination never captured it.
    expect(SCAFFOLD_SOURCE_KEYS.recommendation_to_advance).toBeUndefined();
  });
});

describe("an untouched Move reports clean", () => {
  it("reports no corruption for a Move with real values everywhere", () => {
    const d = diagnoseMove(
      layers({
        scaffold: {
          problem_statement: REAL_PROBLEM,
          sponsor_candidate: REAL_SPONSOR,
        },
        charter: {
          problem_statement: REAL_PROBLEM,
          sponsor_candidate: REAL_SPONSOR,
        },
        captureValues: {
          problem_statement: REAL_PROBLEM,
          stakeholder_owner_view: REAL_SPONSOR,
        },
      }),
    );
    expect(d.affected).toBe(false);
    expect(d.corruptCaptureKeys).toEqual([]);
    expect(d.corruptCharterKeys).toEqual([]);
    expect(d.fullyRestorable).toBe(false); // not affected, so nothing to restore
  });

  it("reports clean for a Move with no P0 data at all", () => {
    expect(diagnoseMove(layers()).affected).toBe(false);
  });
});

describe("summarizeBlastRadius", () => {
  const clean = diagnoseMove(layers({ moveId: "clean-1" }));
  const restorable = diagnoseMove(
    layers({
      moveId: "corrupt-1",
      tenantKey: "lakeshore",
      scaffold: { problem_statement: REAL_PROBLEM },
      captureValues: { problem_statement: BOILER_PROBLEM },
    }),
  );
  const ambiguous = diagnoseMove(
    layers({
      moveId: "corrupt-2",
      tenantKey: "skyharbor",
      captureValues: { problem_statement: BOILER_PROBLEM },
    }),
  );

  it("counts only affected Moves and names their tenants", () => {
    const s = summarizeBlastRadius([clean, restorable, ambiguous]);
    expect(s.movesScanned).toBe(3);
    expect(s.movesAffected).toBe(2);
    expect(s.movesFullyRestorable).toBe(1);
    expect(s.movesNeedingReview).toBe(1);
    expect(s.tenantsAffected).toEqual(["lakeshore", "skyharbor"]);
  });

  it("counts corrupt fields once per Move even when both layers are hit", () => {
    const both = diagnoseMove(
      layers({
        moveId: "corrupt-3",
        scaffold: { sponsor_candidate: REAL_SPONSOR },
        charter: { sponsor_candidate: BOILER_SPONSOR },
        captureValues: { stakeholder_owner_view: BOILER_SPONSOR },
      }),
    );
    expect(summarizeBlastRadius([both]).corruptFieldCounts).toEqual({
      stakeholder_owner_view: 1,
    });
  });

  it("reports an all-clean estate as zero affected", () => {
    const s = summarizeBlastRadius([clean]);
    expect(s.movesAffected).toBe(0);
    expect(s.tenantsAffected).toEqual([]);
    expect(s.corruptFieldCounts).toEqual({});
  });
});
