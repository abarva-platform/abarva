// The promotion policy: what a scan result means for sign-off.
//
// The load-bearing case is `not_scanned`. A gate that reports an unexamined
// document as "clear" is exactly the failure this whole check exists to
// prevent, and it is the easiest one to introduce by accident.

import {
  evaluateClientReadinessForSignOff,
  htmlToScannableText,
} from "../client-readiness-gate";

const CLEAN =
  "SkyHarbor Global should instrument turnaround delay at the stand before " +
  "committing to a predictive model. No owner is named for the delay-volume " +
  "source, so no baseline can be certified.";

const WITH_BLOCKER = `${CLEAN} Generated with claude-sonnet-5.`;
const WITH_REVIEW_ONLY = `${CLEAN} The quality score was 80.`;

describe("clean content", () => {
  it("clears sign-off", () => {
    const result = evaluateClientReadinessForSignOff({ content: CLEAN });
    expect(result.verdict).toBe("clear");
    expect(result.allowed).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(result.summary).toMatch(/No client-readiness issues/);
  });
});

describe("review items never block", () => {
  it("clears sign-off but says how many need a look", () => {
    const result = evaluateClientReadinessForSignOff({
      content: WITH_REVIEW_ONLY,
    });
    expect(result.verdict).toBe("clear");
    expect(result.allowed).toBe(true);
    expect(result.reviewItems.length).toBeGreaterThan(0);
    expect(result.summary).toMatch(/No blockers/);
  });
});

describe("blockers stop sign-off", () => {
  it("refuses, and names what a client would see", () => {
    const result = evaluateClientReadinessForSignOff({
      content: WITH_BLOCKER,
    });
    expect(result.verdict).toBe("blocked");
    expect(result.allowed).toBe(false);
    expect(result.blockers.map((f) => f.match)).toContain("claude-sonnet-5");
    expect(result.summary).toMatch(/visible to a client/);
  });

  it("tells the reviewer both ways out", () => {
    const { summary } = evaluateClientReadinessForSignOff({
      content: WITH_BLOCKER,
    });
    expect(summary).toMatch(/Fix the document/);
    expect(summary).toMatch(/acknowledging these findings/);
  });

  it("records nothing as acknowledged while still blocked", () => {
    expect(
      evaluateClientReadinessForSignOff({ content: WITH_BLOCKER })
        .acknowledgedFindings,
    ).toEqual([]);
  });
});

describe("the override is deliberate, and audited", () => {
  it("allows sign-off when the reviewer acknowledges the blockers", () => {
    const result = evaluateClientReadinessForSignOff({
      content: WITH_BLOCKER,
      acknowledgeBlockers: true,
    });
    expect(result.verdict).toBe("acknowledged");
    expect(result.allowed).toBe(true);
  });

  it("is never reported as clean", () => {
    // "Signed off with known leaks" and "was clean" are different facts and
    // must not be confusable by anyone reading the record later.
    const result = evaluateClientReadinessForSignOff({
      content: WITH_BLOCKER,
      acknowledgeBlockers: true,
    });
    expect(result.verdict).not.toBe("clear");
    expect(result.summary).toMatch(/acknowledged/);
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it("captures the specific findings accepted, for the approval record", () => {
    const result = evaluateClientReadinessForSignOff({
      content: WITH_BLOCKER,
      acknowledgeBlockers: true,
    });
    expect(result.acknowledgedFindings).toEqual([
      "model_name: claude-sonnet-5",
    ]);
  });

  it("does not invent an acknowledgement when there was nothing to acknowledge", () => {
    const result = evaluateClientReadinessForSignOff({
      content: CLEAN,
      acknowledgeBlockers: true,
    });
    expect(result.verdict).toBe("clear");
    expect(result.acknowledgedFindings).toEqual([]);
  });
});

describe("nothing to scan is not the same as clean", () => {
  it.each([undefined, null, "", "   "])(
    "reports not_scanned for %p rather than clearing it",
    (content) => {
      const result = evaluateClientReadinessForSignOff({
        content: content as string | null | undefined,
      });
      expect(result.verdict).toBe("not_scanned");
      expect(result.summary).toMatch(/not assessed/);
    },
  );

  it("still permits sign-off, because emptiness is another guard's business", () => {
    // This gate only refuses to vouch for what it did not read. Whether an
    // empty deliverable is signable at all is decided elsewhere.
    expect(evaluateClientReadinessForSignOff({ content: "" }).allowed).toBe(
      true,
    );
  });
});

describe("html content", () => {
  it("finds a blocker inside markup", () => {
    const result = evaluateClientReadinessForSignOff({
      content: `<div><h1>Architecture</h1><p>Record 5bbf2d7c-328c-41e0-8a69-50094cd15f75.</p></div>`,
    });
    expect(result.verdict).toBe("blocked");
    expect(result.blockers[0].kind).toBe("uuid");
  });

  it("does not treat tag names as document text", () => {
    const result = evaluateClientReadinessForSignOff({
      content: `<section><p>${CLEAN}</p></section>`,
    });
    expect(result.verdict).toBe("clear");
  });

  it("separates block elements so phrase rules keep matching", () => {
    // Fused across a tag boundary this phrase would silently stop matching.
    const html = "<p>In today's</p><p>rapidly evolving market</p>";
    expect(htmlToScannableText(html)).toBe(
      "In today's\nrapidly evolving market",
    );
  });

  it("decodes entities without double-decoding an ampersand", () => {
    expect(htmlToScannableText("<p>A &amp;amp; B</p>")).toBe("A &amp; B");
  });
});
