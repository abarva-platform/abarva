import {
  createRestrictedFinancialTextStreamer,
  sanitizeRestrictedFinancialText,
} from "../restricted-output-policy";

const RESTRICTED = { outputPolicy: { exactFinancialValues: false } };
const ENTITLED = { outputPolicy: { exactFinancialValues: true } };

/** Feed deltas through the streamer the way the agent route does. */
function stream(deltas: readonly string[], policy = RESTRICTED): string {
  const streamer = createRestrictedFinancialTextStreamer(policy);
  return deltas.map((delta) => streamer.push(delta)).join("") + streamer.flush();
}

describe("createRestrictedFinancialTextStreamer", () => {
  it("does not leak digits when a money token is split across deltas", () => {
    // Live-observed leak: "$22" was redacted on its own, then ".1K" streamed
    // through untouched, producing "[restricted financial value].1K".
    const out = stream(["The variance is ", "$22", ".1K", " this year."]);

    expect(out).not.toContain(".1K");
    expect(out).not.toMatch(/\d/);
    expect(out).toBe(
      "The variance is [restricted financial value] this year.",
    );
  });

  it("redacts a value split one character at a time", () => {
    const out = stream("$43.5M".split(""));
    expect(out).toBe("[restricted financial value]");
  });

  it("redacts a value that ends the stream", () => {
    const out = stream(["Total exposure: ", "$140.7M"]);
    expect(out).toBe("Total exposure: [restricted financial value]");
  });

  it("matches whole-string sanitization for text delivered in one delta", () => {
    const text = "Reproducible $387K, not reproducible $6.4M.";
    expect(stream([text])).toBe(
      sanitizeRestrictedFinancialText(text, RESTRICTED),
    );
  });

  it("never holds output back indefinitely on a stray dollar sign", () => {
    const tail = "x".repeat(80);
    const out = stream(["cost in $", tail]);
    expect(out).toContain(tail);
  });

  it("leaves text untouched for an entitled user", () => {
    const out = stream(["The variance is ", "$22", ".1K"], ENTITLED);
    expect(out).toBe("The variance is $22.1K");
  });

  it("emits nothing extra when flushed with an empty buffer", () => {
    const streamer = createRestrictedFinancialTextStreamer(RESTRICTED);
    expect(streamer.push("no money here.")).toBe("no money here.");
    expect(streamer.flush()).toBe("");
    expect(streamer.flush()).toBe("");
  });

  it("redacts a spelled-out magnitude whole, leaving no fragment behind", () => {
    // The alternation used to put `m` ahead of `million`, so "$5 million"
    // matched only "$5 m" and left "illion" in the output — a corrupted line
    // that still disclosed the magnitude of a restricted value.
    expect(
      sanitizeRestrictedFinancialText("$5 million of value", RESTRICTED),
    ).toBe("[restricted financial value] of value");
    expect(
      sanitizeRestrictedFinancialText("$2 billion committed", RESTRICTED),
    ).toBe("[restricted financial value] committed");
    expect(stream(["$5 mil", "lion of value"])).toBe(
      "[restricted financial value] of value",
    );
  });

  it("keeps the space when a bare amount is followed by a word", () => {
    // The space sat outside the optional magnitude group, so "$8 of value"
    // matched "$8 " and rendered as "[restricted financial value]of value".
    expect(
      sanitizeRestrictedFinancialText("$8 of protected value", RESTRICTED),
    ).toBe("[restricted financial value] of protected value");
  });

  it("still redacts compact and comma-separated amounts", () => {
    for (const [input, expected] of [
      ["$1.56B portfolio", "[restricted financial value] portfolio"],
      ["$140.7M exposure", "[restricted financial value] exposure"],
      ["costs $1,250,000 total", "costs [restricted financial value] total"],
      ["$2M–$5M band", "[restricted financial value]–[restricted financial value] band"],
    ] as const) {
      expect(sanitizeRestrictedFinancialText(input, RESTRICTED)).toBe(expected);
    }
  });

  it("handles several money tokens across many deltas", () => {
    const out = stream([
      "Rate variance ",
      "$36",
      "5K",
      " and VMS ",
      "$2",
      "2.1K",
      " remain.",
    ]);
    expect(out).not.toMatch(/\d/);
    expect(out).toBe(
      "Rate variance [restricted financial value] and VMS [restricted financial value] remain.",
    );
  });
});
