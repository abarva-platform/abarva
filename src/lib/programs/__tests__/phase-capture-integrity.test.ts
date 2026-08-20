// PR A invariants — the P0 capture path must be non-destructive.
//
// Background: a client defect rendered synthetic boilerplate for P0 inputs and
// POSTed it back as authoritative capture. The route merged it over the real
// persisted values and, on phase 0, mirrored the same boilerplate into
// `engagements.charter` — the authoritative origination record.
//
// These cover the pure integrity primitives. Invariants 1-5 that need a live
// route/DB are covered by the route-level suite; what is provable without I/O
// is proved here, because these are the functions the route's guards rely on.

import {
  CLIENT_SYNTHESIZED_PHASE_CAPTURE_MARKERS,
  computeCaptureRevision,
  diffCaptureValues,
  findPlaceholderValues,
  isKnownPlaceholderValue,
  LEGACY_ORIGINATE_PLACEHOLDERS,
  normalizeForCompare,
} from "../phase-capture-integrity";

const REAL_ANSWER =
  "Carrier-controlled delay is the largest addressable reliability loss at the in-scope stations.";

describe("invariant 7 — defaults can never serialize as authoritative values", () => {
  it("recognises every legacy boilerplate string", () => {
    for (const placeholder of LEGACY_ORIGINATE_PLACEHOLDERS) {
      expect(isKnownPlaceholderValue(placeholder)).toBe(true);
    }
  });

  it("is not fooled by reformatting, case, or padding", () => {
    const original = LEGACY_ORIGINATE_PLACEHOLDERS[0];
    expect(isKnownPlaceholderValue(`  ${original}  `)).toBe(true);
    expect(isKnownPlaceholderValue(original.toUpperCase())).toBe(true);
    expect(isKnownPlaceholderValue(original.replace(/ /g, "  "))).toBe(true);
    expect(isKnownPlaceholderValue(original.replace(/ /g, "\n"))).toBe(true);
  });

  it("does not reject real client answers", () => {
    expect(isKnownPlaceholderValue(REAL_ANSWER)).toBe(false);
    expect(
      isKnownPlaceholderValue("In scope: narrow-body domestic turnarounds."),
    ).toBe(false);
  });

  it("treats empty and non-string values as not-placeholder", () => {
    // Empty is a legitimate "not captured yet", not synthetic content.
    expect(isKnownPlaceholderValue("")).toBe(false);
    expect(isKnownPlaceholderValue("   ")).toBe(false);
    expect(isKnownPlaceholderValue(null)).toBe(false);
    expect(isKnownPlaceholderValue(undefined)).toBe(false);
    expect(isKnownPlaceholderValue(42)).toBe(false);
  });

  it("names every offending key so the sending client can be fixed", () => {
    const rejected = findPlaceholderValues({
      problem_statement: LEGACY_ORIGINATE_PLACEHOLDERS[0],
      scope_out: REAL_ANSWER,
      recommendation_to_advance: LEGACY_ORIGINATE_PLACEHOLDERS.at(-1)!,
    });
    expect(rejected.map((r) => r.key).sort()).toEqual([
      "problem_statement",
      "recommendation_to_advance",
    ]);
  });

  it("passes a payload of entirely real answers", () => {
    expect(
      findPlaceholderValues({
        problem_statement: REAL_ANSWER,
        scope_out: "Out: wide-body.",
      }),
    ).toEqual([]);
  });

  it("rejects synthesized P1 charter snippets as non-authoritative capture", () => {
    const rejected = findPlaceholderValues({
      sponsor_commitment:
        "Sponsor/title: SVP. Operating owners and technology/data co-sponsors must confirm cadence, authority, and phase-gate attendance.",
      stakeholder_map:
        "Core roles: executive sponsor, operating owner, technology/data owner, risk/privacy/compliance owner, finance value owner, and change/adoption owner.",
      decision_rights:
        "Sponsor approves scope and phase advancement; operating owner approves process fit; technology/data owner approves platform and integration assumptions; risk/privacy/compliance approve controls and PHI boundaries; finance validates value logic.",
    });
    expect(rejected.map((r) => r.key).sort()).toEqual([
      "decision_rights",
      "sponsor_commitment",
      "stakeholder_map",
    ]);
  });

  it("rejects synthesized P2-P5 phase templates as non-authoritative capture", () => {
    const synthesized =
      "Current-state findings: What works, what breaks, and what the loaded evidence says about the current process. " +
      "Move: Predictive Turnaround. Phase: P2 Discover & Diagnose. " +
      "Selected approach: Optimize the current workflow. " +
      "Evidence basis: Uploaded phase files, completed templates, workshop outputs, and owner attestations in Files & Evidence. " +
      "Approval note: accountable owner review and caveats must remain attached to the gate record.";
    expect(isKnownPlaceholderValue(synthesized)).toBe(true);
    expect(
      findPlaceholderValues({ current_state_findings: synthesized }),
    ).toEqual([{ key: "current_state_findings", value: synthesized }]);
  });

  it("normalizes synthesized phase-capture markers before matching", () => {
    const marker = CLIENT_SYNTHESIZED_PHASE_CAPTURE_MARKERS.at(-1)!;
    expect(isKnownPlaceholderValue(`  ${marker.toUpperCase()}\n`)).toBe(true);
  });
});

describe("invariant 6 — a stale revision cannot overwrite newer data", () => {
  it("is stable for the same content regardless of key order", () => {
    const a = computeCaptureRevision({ b: "two", a: "one" });
    const b = computeCaptureRevision({ a: "one", b: "two" });
    expect(a).toBe(b);
  });

  it("changes when any value changes", () => {
    const before = computeCaptureRevision({ a: "one", b: "two" });
    expect(computeCaptureRevision({ a: "one", b: "TWO" })).not.toBe(before);
  });

  it("changes when a key is added or removed", () => {
    const before = computeCaptureRevision({ a: "one" });
    expect(computeCaptureRevision({ a: "one", b: "" })).not.toBe(before);
    expect(computeCaptureRevision({})).not.toBe(before);
  });

  it("cannot be confused by values that concatenate to the same string", () => {
    // A naive join would collide these two; the delimiter must prevent it.
    expect(computeCaptureRevision({ a: "xy", b: "z" })).not.toBe(
      computeCaptureRevision({ a: "x", b: "yz" }),
    );
  });

  it("treats null and empty as the same absent value", () => {
    expect(computeCaptureRevision({ a: null })).toBe(
      computeCaptureRevision({ a: "" }),
    );
  });
});

describe("invariants 3 and 4 — reload and no-edit save change nothing", () => {
  const persisted = {
    problem_statement: REAL_ANSWER,
    scope_out: "Out: wide-body operations.",
    outcomes_success: "Reduce carrier-delay minutes per departure.",
  };

  it("reports no changes when the client echoes back exactly what it loaded", () => {
    expect(diffCaptureValues(persisted, { ...persisted })).toEqual([]);
  });

  it("reports no changes for a partial echo of unchanged fields", () => {
    expect(
      diffCaptureValues(persisted, { scope_out: persisted.scope_out }),
    ).toEqual([]);
  });

  it("ignores leading and trailing whitespace drift from a round-trip", () => {
    expect(
      diffCaptureValues(persisted, {
        problem_statement: `  ${REAL_ANSWER}  `,
      }),
    ).toEqual([]);
  });
});

describe("invariant 5 — an explicit edit changes only the intended field", () => {
  const persisted = {
    problem_statement: REAL_ANSWER,
    scope_out: "Out: wide-body operations.",
    outcomes_success: "Reduce carrier-delay minutes per departure.",
  };

  it("returns exactly the edited field, with before and after", () => {
    const changed = diffCaptureValues(persisted, {
      ...persisted,
      scope_out: "Out: wide-body and international operations.",
    });
    expect(changed).toEqual([
      {
        key: "scope_out",
        previous: "Out: wide-body operations.",
        next: "Out: wide-body and international operations.",
      },
    ]);
  });

  it("detects filling a previously empty field", () => {
    const changed = diffCaptureValues(
      { ...persisted, discovery_questions: "" },
      { discovery_questions: "What is our carrier-delay share?" },
    );
    expect(changed.map((c) => c.key)).toEqual(["discovery_questions"]);
  });

  it("detects clearing a field, which is a real edit", () => {
    const changed = diffCaptureValues(persisted, { scope_out: "" });
    expect(changed).toEqual([
      {
        key: "scope_out",
        previous: "Out: wide-body operations.",
        next: "",
      },
    ]);
  });

  it("treats a key absent from the payload as untouched, not cleared", () => {
    // A partial save must never be read as "delete everything I did not send".
    const changed = diffCaptureValues(persisted, {
      problem_statement: "A genuinely new problem statement.",
    });
    expect(changed.map((c) => c.key)).toEqual(["problem_statement"]);
  });
});

describe("normalizeForCompare", () => {
  it("collapses whitespace and lowercases", () => {
    expect(normalizeForCompare("  Two   Words\nHere ")).toBe("two words here");
  });
});
