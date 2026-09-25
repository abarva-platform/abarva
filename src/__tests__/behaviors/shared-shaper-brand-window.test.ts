/**
 * Item C-517 — what happens to a banned engine name AFTER the shaper's single
 * brand rewrite.
 *
 * `shapeSharedAdvisorResponse` used to apply `BANNED_BRAND_RE` twice: once
 * before compaction and once again at the end, inside the trailing
 * `normalizeWhitespace(normalizeAssemblyArtifacts(...))`. Item T-617 measured
 * that removing the SECOND application left all 45 tests across the six
 * shared-shaper suites, and all 14 in the Atlas renderer suite, passing. That
 * is a survivor, and a survivor is not a verdict: unguarded is not the same as
 * redundant. The second pass ran on text the first had never seen — after the
 * label replacement, after `stripUnmappedRawIds`, after `compactForChat` — so
 * if any of those could put a word-bounded banned name into text that did not
 * have one, the pass was load-bearing and the missing thing was this test.
 *
 * The question was settled by search rather than by sample, and the search is
 * this file. `\b` is a function of exactly ONE character on each side of the
 * match, so sweeping every printable ASCII character on both sides IS complete
 * for "can a pass expose an occurrence that was not word-bounded" — there is no
 * second character to vary. What adjacency alone cannot cover is WHICH passes
 * run, so the adjacency cross is repeated inside one carrier per pass in the
 * window, and `reaches the pass it exists for` below asserts each carrier still
 * fires the pass it was written for. A carrier that silently stops triggering
 * its pass would leave this sweep green over nothing, which is the shape of
 * defect the whole backlog exists to repair.
 *
 * Measured, on the corpus below: 0 of 297,825 rows changed output when the
 * second application was removed, and 33,792 of those rows carried a
 * word-bounded name on input. With BOTH applications removed, 33,738 rows leak
 * a name and every carrier leaks — so the sweep has power in all of them.
 * The second application was deleted on that evidence.
 *
 * Deliberately NOT widened, per the item: `BANNED_BRAND_RE`'s membership and
 * the raw-id passes beside it are separate questions.
 */
import { shapeSharedAdvisorResponse } from "@/lib/answer/shared-response-shaper";

/** Exactly `BANNED_BRAND_RE`'s members. Not exported by the module. */
const BANNED_NAMES = ["Atlas", "Sentinel", "Nexus"] as const;
const BOUNDED = new RegExp(`\\b(?:${BANNED_NAMES.join("|")})\\b`);

/** Every printable ASCII character, 0x20..0x7e — 95 of them. */
const ASCII_PRINTABLE: string[] = Array.from({ length: 95 }, (_, i) =>
  String.fromCharCode(0x20 + i),
);

/**
 * An occurrence is word-bounded on both sides exactly when neither neighbour is
 * a word character, so the number of rows whose input carries a bounded name is
 * derived rather than written down. A literal would break the moment a carrier
 * is added, which teaches the next author to edit the number instead of asking
 * what it means.
 */
const NON_WORD_PRINTABLE = ASCII_PRINTABLE.filter(
  (char) => !/[A-Za-z0-9_]/.test(char),
);

const FILLER =
  "The renewal sits with the vendor owner and the budget line is the one the board asked about. " +
  "Spend is concentrated in three contracts and the proof for each is a signed order form. " +
  "Value realised to date is below the case, and the gap is owner time rather than licence cost. " +
  "Risk is the auto-renewal date, which lands before the portfolio review. ";

const SAMPLE_UUID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

type Carrier = {
  /** The pass this carrier exists to fire. */
  pass: string;
  key: string;
  preserveStructure: boolean;
  build: (occurrence: string) => string;
  /** Proof, from rendered output, that the pass actually ran. */
  fired: (output: string, input: string) => boolean;
};

const CARRIERS: Carrier[] = [
  {
    key: "short",
    pass: "compactForChat early return — under target, structure untouched",
    preserveStructure: false,
    build: (o) => `My read: ${o} carries the renewal risk.`,
    fired: (out, input) => out === input.trim(),
  },
  {
    key: "preserved",
    pass: "preserveStructure — compactForChat never runs at all",
    preserveStructure: true,
    build: (o) => `My read: ${o} carries the renewal risk. ${FILLER.repeat(4)}`,
    // Over the 900-char target and still whole: compaction did not run.
    fired: (out) => out.length > 900 && !out.includes("\n- "),
  },
  {
    key: "compacted",
    pass: "compactForChat rebuild — sentenceSplit, trimWords, support filter",
    preserveStructure: false,
    build: (o) =>
      `My read: the ${o} budget is the outlier. ${FILLER.repeat(3)} Next: open the ${o} renewal.`,
    fired: (out, input) => out.includes("\n- ") && out.length < input.length / 2,
  },
  {
    key: "table",
    pass: "tableToCompactLines and TABLE_CELL_SEPARATOR_RE",
    preserveStructure: false,
    build: (o) =>
      `Spend comparison:\n| Vendor | Value | Owner |\n| --- | --- | --- |\n| ${o} | $1.2M | CIO |\n| Second | $900K | CFO |\n| Third | $400K | COO |\n${FILLER.repeat(4)}`,
    fired: (out) => out.includes("$1.2M: CIO") && !out.includes("|"),
  },
  {
    key: "bullets",
    pass: "compactBulletLines",
    preserveStructure: false,
    build: (o) =>
      `Outliers worth flagging:\n- ${o} — renewal in 30 days\n- Second vendor — value gap\n- Third vendor — owner unassigned\n${FILLER.repeat(4)}`,
    fired: (out) =>
      out.includes("renewal in 30 days; Second vendor: value gap"),
  },
  {
    key: "artifacts",
    pass: "rewriteAssemblyArtifacts in the trailing normalize",
    preserveStructure: false,
    build: (o) =>
      `Read: Read: ${o} spend - Breakdown: ; ${o} value ; - the ${o} owner and.\n${FILLER.repeat(2)}`,
    fired: (out) => out.includes("\nBreakdown: ") && !out.includes("Read: Read:"),
  },
  {
    key: "artifacts-compacted",
    pass: "rewriteAssemblyArtifacts inside compactForChat",
    preserveStructure: false,
    build: (o) =>
      `Read: Read: ${o} spend - Breakdown: ; ${o} value ; - the ${o} owner and.\n${FILLER.repeat(4)}`,
    fired: (out) =>
      out.includes("Breakdown: ") &&
      !out.includes("Read: Read:") &&
      out.includes("\n- "),
  },
  {
    key: "segments",
    pass: "dedupeSemicolonSegments — drops a repeated segment",
    preserveStructure: true,
    build: (o) =>
      `Breakdown: ${o} spend; ${o} spend; ${o} value; the owner is unassigned`,
    fired: (out, input) =>
      out.split(";").length === input.split(";").length - 1,
  },
  {
    key: "rawids",
    pass: "stripUnmappedRawIds — id, UUID and the parenthesised placeholder",
    preserveStructure: true,
    build: (o) =>
      `My read: ${o}(ABC-DEF-1234) and ${o} — ${SAMPLE_UUID} then ${o} vs.${o}`,
    fired: (out) =>
      !out.includes("ABC-DEF-1234") &&
      !out.includes(SAMPLE_UUID) &&
      !out.includes("the referenced item"),
  },
  {
    key: "sentences",
    // The one pass in the window that DELETES a word boundary rather than
    // adding one: `vs.` loses its period. It is carried here because the
    // interesting direction for this item is the opposite one, and a pass
    // that moves boundaries at all has to be shown moving them.
    pass: "sentenceSplit's `vs.` rule — removes a boundary",
    preserveStructure: false,
    build: (o) =>
      `My read: ${o} vs.${o} is the comparison the board asked for, and the value gap is owner time. ${FILLER.repeat(4)}`,
    fired: (out) => /\bvs[A-Za-z]/.test(out) && !out.includes("vs."),
  },
  {
    key: "parens",
    pass: "stripDanglingTrimTail — truncates at an unbalanced open paren",
    preserveStructure: false,
    build: (o) =>
      `My read: the ${o} spend line is the outlier the board asked about, and the owner has not signed the renewal or answered the value question yet (the ${o} proof is pending and the case is unfunded, so the comparison is still open. ${FILLER.repeat(3)}`,
    fired: (out) => !out.includes("("),
  },
];

const CORPUS_ROWS =
  CARRIERS.length * BANNED_NAMES.length * ASCII_PRINTABLE.length ** 2;

describe("C-517 — the window after the shaper's single brand rewrite", () => {
  it("rewrites every banned name the regex declares", () => {
    for (const name of BANNED_NAMES) {
      const { text, issues } = shapeSharedAdvisorResponse({
        text: `My read: ${name} owns the renewal.`,
      });
      expect(text).toBe("My read: aVa owns the renewal.");
      expect(issues.map((issue) => issue.code)).not.toContain(
        "banned_brand_leak",
      );
    }
  });

  // This is what makes the deletion safe rather than merely green. The rewrite
  // has to run BEFORE compaction, because `aVa` is two characters shorter than
  // `Atlas` and the compactor's budget is measured in characters: an answer
  // that is over target with the name and under target without it must come
  // back whole. Move the rewrite after the compactor and this fails, which is
  // the position no count of applications can pin.
  it("runs the rewrite before the compactor, so the budget sees the rewritten text", () => {
    const body =
      "My read: the Atlas renewal is the outlier the board asked about, and the " +
      "Atlas owner has not signed it. Atlas spend is concentrated in three " +
      "contracts and the proof for each is a signed order form, so the Atlas value " +
      "gap is owner time rather than licence cost. The Atlas auto-renewal date lands " +
      "before the portfolio review, which is why the Atlas case is still unfunded.";
    const rewritten = body.replace(/Atlas/g, "aVa");
    // The budget is set to exactly the rewritten length, so the compactor's
    // answer differs on the two sides of the rewrite: the original is over
    // target and the rewritten text is exactly at it. No padding to a magic
    // number, and the gap is asserted rather than assumed.
    const targetChars = rewritten.length;
    expect(body.length).toBeGreaterThan(targetChars);

    const { text } = shapeSharedAdvisorResponse({ text: body, targetChars });
    expect(text).not.toContain("Atlas");
    // Whole: the compactor took its early return, because it measured the
    // rewritten text. Move the rewrite after the compactor and this comes back
    // rebuilt and bulleted instead — which is the position that no count of
    // applications can pin.
    expect(text).toBe(rewritten);
  });

  it("reaches the pass it exists for, in every carrier", () => {
    const missed: string[] = [];
    for (const carrier of CARRIERS) {
      const input = carrier.build("SuperAtlas");
      const { text } = shapeSharedAdvisorResponse({
        text: input,
        preserveStructure: carrier.preserveStructure,
      });
      if (!carrier.fired(text, input)) missed.push(`${carrier.key} (${carrier.pass})`);
    }
    expect(missed).toEqual([]);
  });

  it(
    "exposes no name to the answer, over every single-character adjacency in every carrier",
    () => {
      const leaks: string[] = [];
      const flagged: string[] = [];
      let rows = 0;
      let carriedBoundedName = 0;
      for (const carrier of CARRIERS) {
        for (const name of BANNED_NAMES) {
          for (const left of ASCII_PRINTABLE) {
            for (const right of ASCII_PRINTABLE) {
              rows += 1;
              const input = carrier.build(`${left}${name}${right}`);
              if (BOUNDED.test(input)) carriedBoundedName += 1;
              const result = shapeSharedAdvisorResponse({
                text: input,
                preserveStructure: carrier.preserveStructure,
              });
              if (BOUNDED.test(result.text) && leaks.length < 8) {
                leaks.push(
                  `${carrier.key}/${name}/L=${left.charCodeAt(0)}/R=${right.charCodeAt(0)}: ${JSON.stringify(result.text.slice(0, 120))}`,
                );
              }
              if (
                result.issues.some((issue) => issue.code === "banned_brand_leak") &&
                flagged.length < 8
              ) {
                flagged.push(`${carrier.key}/${name}/L=${left.charCodeAt(0)}/R=${right.charCodeAt(0)}`);
              }
            }
          }
        }
      }
      expect(rows).toBe(CORPUS_ROWS);
      // Asserted, not assumed: if this reached zero the sweep would be running
      // over text that never carried a name in the first place. 33,792 rows at
      // eleven carriers.
      expect(carriedBoundedName).toBe(
        CARRIERS.length * BANNED_NAMES.length * NON_WORD_PRINTABLE.length ** 2,
      );
      expect(leaks).toEqual([]);
      expect(flagged).toEqual([]);
    },
    180_000,
  );
});
