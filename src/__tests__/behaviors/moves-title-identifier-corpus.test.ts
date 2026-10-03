import { demoSafeClientText } from "@/lib/client-config";

/**
 * U-553. The Moves board printed build and run identifiers in 5 of the 8 move
 * names rendered on the client surface, measured signed-in on two different
 * deployed SHAs (`44b50dcd3d`, then independently on `e085442776`; both
 * readings recorded in `docs/acceptance/signed-in-wave-acceptance-matrix.md`).
 *
 * The merge that set out to remove them (#8903) added ONE rule, fitted to one
 * example, and asserted it with one crafted string. That is the shape of
 * mistake this suite exists to make impossible: every assertion below is a
 * COUNT over an enumerated corpus, so a rule that cleans one shape and misses
 * another cannot read as green.
 *
 * Two properties are asserted, and they pull in opposite directions on purpose:
 *   1. no title in the corpus still carries an identifier after sanitizing;
 *   2. no title that legitimately contains digits, a date or the word
 *      "Evidence" is altered at all.
 * A rule broad enough to pass (1) by force fails (2).
 */

/**
 * The identifier detector is written from the observed stamp grammar, NOT from
 * the sanitizer's rules. If it shared expressions with the fix it would be
 * measuring the fix against itself, and a rule that is wrong in both places
 * would read as clean. Each pattern below describes a shape seen on the board
 * or produced by the sanitizer from one, and none of them mentions a client
 * name, which is what keeps the two properties independent.
 */
const IDENTIFIER_SHAPES: ReadonlyArray<readonly [string, RegExp]> = [
  // A run/build token. "E2E" is a test-harness word; it is in no client name,
  // no business function and no move vocabulary.
  ["run token", /\bE2E\b/i],
  // A full ISO-ish build vintage: 2026-09-11T05-13, 2026-09-11T05:13:07.
  ["iso build vintage", /\d{4}-\d{2}-\d{2}T\d{2}[-:]\d{2}/],
  // A compact run stamp: 20260923T222629Z.
  ["compact run stamp", /\d{8}T\d{6}Z?/],
  // The residue the merge's own rule leaves when it eats the leading year of
  // an ISO vintage: "Rich Evidence-09-11T05-13". This shape is not in the raw
  // corpus at all -- it is manufactured by sanitizing, which is why a detector
  // that only described raw input would have called the bug fixed.
  ["truncated build vintage", /\b\d{2}-\d{2}T\d{2}[-:]\d{2}\b/],
];

function identifierShapesIn(title: string): string[] {
  return IDENTIFIER_SHAPES.filter(([, pattern]) => pattern.test(title)).map(
    ([label]) => label,
  );
}

/**
 * Raw move titles. The first two are the exact strings captured from the live
 * board and are the only raw titles recoverable on disk:
 *   reports/moves-e2e-operating-smoke/20260923T222629Z/raw/live-phase-0-text.txt
 *   reports/moves-e2e-operating-smoke/20260923T222629Z/raw/live-files-evidence-loaded-text.txt
 *
 * The rest instantiate the two shapes the signed-in matrix recorded --
 * `<tenant> Synthetic Rich Evidence E2E <vintage>` (four rows) and
 * `Synthetic <tenant> E2E Smoke - <stamp>` (one row) -- across the tenants
 * whose names the sanitizer maps, because the acceptance asks for the shapes
 * present across tenants and the live database is not reachable from here.
 * That substitution is stated rather than hidden: the SHAPES are measured, the
 * tenant spread is enumerated.
 */
const IDENTIFIER_BEARING_TITLES: readonly string[] = [
  "Meridian Health Synthetic Rich Evidence E2E 2026-09-11T05-13",
  "Meridian Synthetic Rich Evidence E2E 2026-09-11T12-28",
  "Apex Retail Synthetic Rich Evidence E2E 2026-09-11T05-13",
  "Lakeshore Holdings Synthetic Rich Evidence E2E 2026-10-01T08-42",
  "SkyHarbor Synthetic Rich Evidence E2E 2026-09-30T23-05",
  "First Capital Synthetic Rich Evidence E2E 2026-09-12T11-59",
  "Synthetic Meridian Health E2E Smoke - 20260923T222629Z",
  "Synthetic SkyHarbor E2E Smoke - 20261002T044117Z",
  "Synthetic Lakeshore Holdings E2E Smoke - 20261001T190355Z",
  // No stamp at all: the token on its own is still a harness identifier, and
  // leaving it would mean the board reads "... E2E Smoke" to an executive.
  "Meridian Health Claims Platform E2E Smoke",
  // The bare trailing run id the merge was written for. It stays in the corpus
  // so a rewrite cannot regress the one shape that already worked.
  "Member Service Agent Assist Claude E2E 1002",
];

/**
 * Titles that must come through untouched. Three of them carry a four-digit
 * year, two carry the word "Evidence" and one carries a quarter-and-digit
 * reference, because those are exactly the features a rule written to catch a
 * build stamp is most likely to eat.
 */
const LEGITIMATE_TITLES: readonly string[] = [
  "Member Service Agent Assist",
  "2026 Claims Evidence Modernization",
  "Evidence Management Platform Consolidation",
  "Q3 2027 Treasury Modernization",
  "Baggage Disruption Recovery Control Tower",
  "Revenue Integrity Program 2028",
];

describe("Moves client surface carries no build or run identifier", () => {
  it("every title in the corpus is identifier-bearing before sanitizing, so the count below measures something", () => {
    const clean = IDENTIFIER_BEARING_TITLES.filter(
      (title) => identifierShapesIn(title).length === 0,
    );
    expect(clean).toEqual([]);
  });

  it("the enumerated corpus covers every shape the detector knows", () => {
    const covered = new Set(
      IDENTIFIER_BEARING_TITLES.flatMap((title) => identifierShapesIn(title)),
    );
    const expected = IDENTIFIER_SHAPES.map(([label]) => label);
    expect([...covered].sort()).toEqual([...expected].sort());
  });

  it("leaves zero identifier-bearing titles after sanitizing, counted over the whole corpus", () => {
    const survivors = IDENTIFIER_BEARING_TITLES.map((title) => ({
      title,
      rendered: demoSafeClientText(title),
    }))
      .map(({ title, rendered }) => ({
        title,
        rendered,
        shapes: identifierShapesIn(rendered),
      }))
      .filter(({ shapes }) => shapes.length > 0);

    expect(survivors).toEqual([]);
    expect(survivors).toHaveLength(0);
  });

  it("the sanitizer does not leave a dangling separator or doubled space where a stamp was", () => {
    const malformed = IDENTIFIER_BEARING_TITLES.map((title) =>
      demoSafeClientText(title),
    ).filter((rendered) => /\s{2}|[-–—:]\s*$|^\s|\s$/.test(rendered));
    expect(malformed).toEqual([]);
  });

  it("every sanitized title still says something to a reader", () => {
    const empty = IDENTIFIER_BEARING_TITLES.map((title) => ({
      title,
      rendered: demoSafeClientText(title),
    })).filter(({ rendered }) => rendered.trim().length < 4);
    expect(empty).toEqual([]);
  });

  it("alters no title that legitimately carries digits, a date or the word Evidence", () => {
    const altered = LEGITIMATE_TITLES.map((title) => ({
      title,
      rendered: demoSafeClientText(title),
    })).filter(({ title, rendered }) => rendered !== title);
    expect(altered).toEqual([]);
  });

  /**
   * The count above is the acceptance, and it is deliberately blind to one
   * thing: a bare trailing run integer is the same SHAPE as a trailing year, so
   * no corpus-level detector can separate "… Claude E2E 1002" from
   * "Revenue Integrity Program 2028" without eating the second. Discovered by
   * mutation, not by reading -- deleting the `\d+` alternative left the count
   * assertion green. The table below therefore proves necessity per shape:
   * removing any one rule from the sanitizer fails a named row here.
   */
  it.each([
    [
      "Meridian Health Synthetic Rich Evidence E2E 2026-09-11T05-13",
      "Meridian Health Synthetic Rich Evidence",
    ],
    [
      "Synthetic Meridian Health E2E Smoke - 20260923T222629Z",
      "Synthetic Meridian Health",
    ],
    [
      "Meridian Health Claims Platform E2E Smoke",
      "Meridian Health Claims Platform",
    ],
    [
      "Member Service Agent Assist Claude E2E 1002",
      "Member Service Agent Assist",
    ],
    ["Treasury E2E 42 modernization", "Treasury modernization"],
  ])("renders %s without its identifier", (raw, expected) => {
    expect(demoSafeClientText(raw)).toBe(expected);
  });

  it("still maps a real client name to its cover name", () => {
    expect(demoSafeClientText("Apex Retail Synthetic Rich Evidence")).toBe(
      "Retail Demo Synthetic Rich Evidence",
    );
  });
});
