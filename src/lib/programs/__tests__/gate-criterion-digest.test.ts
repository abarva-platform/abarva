import {
  GATE_CRITERION_DIGEST_LIMITS,
  digestOpenGateCriteria,
  readyWithCaveatsSentence,
} from "../gate-criterion-digest";
import { gateCriteriaForPhase } from "../governance";

const criterion = (n: number) => ({ id: `c${n}`, label: `Criterion ${n}` });
const criteria = (n: number) =>
  Array.from({ length: n }, (_, i) => criterion(i + 1));

describe("digestOpenGateCriteria", () => {
  it("renders every entry and states no remainder when the list fits", () => {
    const digest = digestOpenGateCriteria(criteria(2), "soft");
    expect(digest.shown).toHaveLength(2);
    expect(digest.hidden).toBe(0);
    expect(digest.total).toBe(2);
    expect(digest.remainderLabel).toBeNull();
  });

  it("states no remainder exactly AT the soft limit", () => {
    const digest = digestOpenGateCriteria(
      criteria(GATE_CRITERION_DIGEST_LIMITS.soft),
      "soft",
    );
    expect(digest.remainderLabel).toBeNull();
  });

  it("counts the remainder ONE OVER the soft limit", () => {
    const digest = digestOpenGateCriteria(
      criteria(GATE_CRITERION_DIGEST_LIMITS.soft + 1),
      "soft",
    );
    expect(digest.shown).toHaveLength(GATE_CRITERION_DIGEST_LIMITS.soft);
    expect(digest.hidden).toBe(1);
    expect(digest.remainderLabel).toBe("1 more");
  });

  it("states no remainder exactly AT the hard limit", () => {
    const digest = digestOpenGateCriteria(
      criteria(GATE_CRITERION_DIGEST_LIMITS.hard),
      "hard",
    );
    expect(digest.remainderLabel).toBeNull();
  });

  it("counts the remainder ONE OVER the hard limit", () => {
    const digest = digestOpenGateCriteria(
      criteria(GATE_CRITERION_DIGEST_LIMITS.hard + 1),
      "hard",
    );
    expect(digest.shown).toHaveLength(GATE_CRITERION_DIGEST_LIMITS.hard);
    expect(digest.hidden).toBe(1);
    expect(digest.remainderLabel).toBe("1 more");
  });

  it("is empty, with no remainder, for an empty open set", () => {
    const digest = digestOpenGateCriteria([], "soft");
    expect(digest.shown).toHaveLength(0);
    expect(digest.total).toBe(0);
    expect(digest.hidden).toBe(0);
    expect(digest.remainderLabel).toBeNull();
  });

  it("accounts for every open criterion at every size — nothing is lost", () => {
    for (const severity of ["hard", "soft"] as const) {
      for (let n = 0; n <= 12; n += 1) {
        const digest = digestOpenGateCriteria(criteria(n), severity);
        expect(digest.shown.length + digest.hidden).toBe(n);
        expect(digest.total).toBe(n);
        expect(digest.hidden > 0).toBe(digest.remainderLabel !== null);
      }
    }
  });

  it("keeps the first entries, in order", () => {
    const digest = digestOpenGateCriteria(criteria(6), "soft");
    expect(digest.shown.map((c) => c.id)).toEqual(["c1", "c2"]);
  });

  it("drops caveats at the real P4 and P0 soft counts without the remainder", () => {
    // The lived case: the canonical P4->P5 rule carries six soft checks, so a
    // phase with all six open hides four. P0->P1 carries three and hides one.
    const softCount = (fromPhase: number) =>
      (gateCriteriaForPhase(fromPhase) ?? []).filter(
        (c) => c.severity === "soft",
      ).length;
    expect(digestOpenGateCriteria(criteria(softCount(4)), "soft").hidden).toBe(
      4,
    );
    expect(digestOpenGateCriteria(criteria(softCount(0)), "soft").hidden).toBe(
      1,
    );
  });
});

describe("readyWithCaveatsSentence", () => {
  it("says nothing when no caveat is open", () => {
    expect(readyWithCaveatsSentence([])).toBeNull();
  });

  it("names the single open caveat and counts it as one", () => {
    expect(readyWithCaveatsSentence([{ label: "Funding recorded" }])).toBe(
      "Ready with 1 caveat: Funding recorded.",
    );
  });

  it("states the TOTAL, not the singular, when several are open", () => {
    const sentence = readyWithCaveatsSentence(criteria(6));
    expect(sentence).toBe("Ready with 6 caveats, including: Criterion 1.");
    // The defect this replaces: six open caveats read as one.
    expect(sentence).not.toBe("Ready with caveat: Criterion 1.");
    expect(sentence).toContain("6");
  });

  it("still counts when the first open caveat carries no label", () => {
    expect(readyWithCaveatsSentence([{ label: "" }, { label: "b" }])).toBe(
      "Ready with 2 caveats.",
    );
    expect(readyWithCaveatsSentence([{ label: null }])).toBe(
      "Ready with 1 caveat.",
    );
  });

  it("states a number that equals the digest's total at every size", () => {
    for (let n = 1; n <= 8; n += 1) {
      const digest = digestOpenGateCriteria(criteria(n), "soft");
      expect(readyWithCaveatsSentence(criteria(n))).toContain(String(n));
      expect(digest.total).toBe(n);
    }
  });

  it("agrees with the list: shown + remainder is the number it states", () => {
    const open = criteria(6);
    const digest = digestOpenGateCriteria(open, "soft");
    const sentence = readyWithCaveatsSentence(open) ?? "";
    expect(sentence).toContain(String(digest.shown.length + digest.hidden));
  });
});
