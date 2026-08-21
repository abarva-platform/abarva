// The `capture-field` artifact — aVa proposing a value for one Moves phase
// capture section.
//
// This exists because of a defect found by live proof. The "Draft proposed
// inputs" button asked aVa to draft the P1 inputs and cite each field. aVa
// replied "I'll draft the P1 inputs ... let me pull the charter and origination
// brief together now" and stopped. The client then attached its standard
// readiness scorecard and two fixed citations to that non-answer, so an empty
// result rendered as substantial, sourced work.
//
// The lesson encoded here: a proposal a reader cannot trace is not a draft.
// The parser drops an uncited proposal rather than rendering it, because
// silence is a safe output and an untraceable suggestion in front of a
// reviewer is not.

import { extractArtifacts, isKnownArtifactType } from "../artifacts";
import type { CaptureFieldArtifact } from "../artifacts";

/** Wrap a payload in the streaming sentinel protocol. */
function stream(payload: unknown, type = "capture-field"): string {
  return `[[artifact:${type}]]${JSON.stringify(payload)}[[/artifact]]`;
}

function parseOne(payload: unknown): CaptureFieldArtifact | null {
  const { artifacts } = extractArtifacts(stream(payload));
  return (artifacts[0] as CaptureFieldArtifact) ?? null;
}

const VALID = {
  phase: 1,
  key: "sponsor_commitment",
  value:
    "The SVP Flight Operations sponsors the discovery gate and chairs a weekly decision cadence.",
  citations: ["P0 origination brief · sponsor and owner view"],
};

describe("registration", () => {
  it("is a known artifact type", () => {
    expect(isKnownArtifactType("capture-field")).toBe(true);
  });
});

describe("a well-formed proposal", () => {
  it("parses with every field preserved", () => {
    expect(parseOne(VALID)).toEqual({ type: "capture-field", ...VALID });
  });

  it("keeps confidence when supplied", () => {
    expect(parseOne({ ...VALID, confidence: "medium" })?.confidence).toBe(
      "medium",
    );
  });

  it("drops an unrecognised confidence rather than failing the proposal", () => {
    // Confidence is advisory. A bad value must not cost us an otherwise
    // sound, cited proposal — but it must not be passed through either.
    const parsed = parseOne({ ...VALID, confidence: "very-sure" });
    expect(parsed).not.toBeNull();
    expect(parsed?.confidence).toBeUndefined();
  });

  it("trims the section key", () => {
    expect(parseOne({ ...VALID, key: "  sponsor_commitment  " })?.key).toBe(
      "sponsor_commitment",
    );
  });

  it("leaves the proposed value untouched", () => {
    // Whitespace normalisation belongs to the server on save, not here.
    // Silently reshaping a proposal would mean the reviewer approves one
    // string and a different one is stored.
    const value = "  Sponsor confirmed.  ";
    expect(parseOne({ ...VALID, value })?.value).toBe(value);
  });
});

describe("citations are required, not decorative", () => {
  it("drops a proposal with no citations field", () => {
    const withoutCitations = { ...VALID, citations: undefined };
    expect(parseOne(withoutCitations)).toBeNull();
  });

  it("drops a proposal with an empty citations array", () => {
    expect(parseOne({ ...VALID, citations: [] })).toBeNull();
  });

  it("drops a proposal whose citations are all empty strings", () => {
    expect(parseOne({ ...VALID, citations: ["", "  "] })).toBeNull();
  });

  it("drops a proposal whose citations are not strings", () => {
    expect(parseOne({ ...VALID, citations: [{ source: "brief" }] })).toBeNull();
  });

  it("keeps only the usable citations when the list is mixed", () => {
    expect(
      parseOne({ ...VALID, citations: ["P0 charter", "", 7, "P0 brief"] })
        ?.citations,
    ).toEqual(["P0 charter", "P0 brief"]);
  });
});

describe("the phase guard", () => {
  it.each([-1, 6, 1.5, "1", null])(
    "rejects phase %p so a draft cannot land on the wrong phase",
    (phase) => {
      expect(parseOne({ ...VALID, phase })).toBeNull();
    },
  );

  it.each([0, 1, 5])("accepts phase %i", (phase) => {
    expect(parseOne({ ...VALID, phase })?.phase).toBe(phase);
  });
});

describe("degenerate payloads", () => {
  it.each([
    ["a missing key", { ...VALID, key: undefined }],
    ["an empty key", { ...VALID, key: "   " }],
    ["a missing value", { ...VALID, value: undefined }],
    ["an empty value", { ...VALID, value: "   " }],
    ["a non-string value", { ...VALID, value: 42 }],
  ])("drops %s", (_label, payload) => {
    expect(parseOne(payload)).toBeNull();
  });

  it("drops malformed JSON without throwing", () => {
    expect(() =>
      extractArtifacts("[[artifact:capture-field]]{not json[[/artifact]]"),
    ).not.toThrow();
    expect(
      extractArtifacts("[[artifact:capture-field]]{not json[[/artifact]]")
        .artifacts,
    ).toHaveLength(0);
  });
});

describe("streaming behaviour", () => {
  it("does not leak the payload into visible chat text", () => {
    const { visibleText } = extractArtifacts(
      `Here is a draft.${stream(VALID)}Review it before saving.`,
    );
    expect(visibleText).not.toContain("sponsor_commitment");
    expect(visibleText).not.toContain("[[artifact");
    expect(visibleText).toBe("Here is a draft.Review it before saving.");
  });

  it("carries a proposal split across chunks", () => {
    const full = stream(VALID);
    const cut = Math.floor(full.length / 2);

    const first = extractArtifacts(full.slice(0, cut));
    expect(first.artifacts).toHaveLength(0);

    const second = extractArtifacts(first.remaining + full.slice(cut));
    expect(second.artifacts).toHaveLength(1);
    expect((second.artifacts[0] as CaptureFieldArtifact).key).toBe(
      "sponsor_commitment",
    );
  });

  it("parses several proposals in one response", () => {
    const { artifacts } = extractArtifacts(
      stream(VALID) +
        stream({ ...VALID, key: "scope_boundary", value: "In scope: ..." }),
    );
    expect(artifacts.map((a) => (a as CaptureFieldArtifact).key)).toEqual([
      "sponsor_commitment",
      "scope_boundary",
    ]);
  });

  it("keeps the good proposals when one in a batch is uncited", () => {
    // A partial answer is still useful. One unsourced field must not
    // discard the fields aVa could actually evidence.
    const { artifacts } = extractArtifacts(
      stream(VALID) +
        stream({ ...VALID, key: "scope_boundary", citations: [] }) +
        stream({ ...VALID, key: "decision_rights" }),
    );
    expect(artifacts.map((a) => (a as CaptureFieldArtifact).key)).toEqual([
      "sponsor_commitment",
      "decision_rights",
    ]);
  });
});
