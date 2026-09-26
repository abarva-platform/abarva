import {
  DARK_DIRECTORY_BASELINE_PATH,
  NO_DRIFT_MESSAGE,
  diffDarkDirectories,
  formatDarkDirectoryDrift,
} from "@/lib/qa/dark-directory-ratchet";

/**
 * T-491 — the dark test directory ratchet has to name what moved.
 *
 * `product-directory-ci-coverage.test.ts` asserted
 * `darkProductDirectories.length` against a committed integer. The equality
 * was right; the resolution was not. `Expected: 172 / Received: 170` is the
 * same failure whether two directories were wired into CI (correct, record
 * it) or two were wired while two others went dark in the same change (a
 * regression the count cancels out).
 *
 * The cancelling case is the one this file exists for, because it is the one
 * a count provably cannot see and the one a reviewer would wave through. A
 * mutation that wires two and darkens two must go red, and must go red
 * NAMING the two that went dark — the diagnosis has to be in the failure
 * text, not in a maintainer's head.
 */

const BASELINE = [
  "src/app/api/alpha/__tests__",
  "src/app/api/bravo/__tests__",
  "src/lib/charlie/__tests__",
  "src/lib/delta/__tests__",
];

describe("T-491 dark directory ratchet reports a set difference", () => {
  it("is quiet, and says so in one line, when the observed set matches the baseline", () => {
    const drift = diffDarkDirectories(BASELINE, [...BASELINE].reverse());

    expect(drift.entered).toEqual([]);
    expect(drift.left).toEqual([]);
    expect(drift.inAgreement).toBe(true);
    expect(formatDarkDirectoryDrift(drift)).toBe(NO_DRIFT_MESSAGE);
  });

  it("names a directory that ENTERED the dark set, separately from anything that left", () => {
    const drift = diffDarkDirectories(BASELINE, [
      ...BASELINE,
      "src/app/api/echo/__tests__",
    ]);

    expect(drift.entered).toEqual(["src/app/api/echo/__tests__"]);
    expect(drift.left).toEqual([]);
    expect(drift.inAgreement).toBe(false);
  });

  it("names a directory that LEFT the dark set, separately from anything that entered", () => {
    const drift = diffDarkDirectories(
      BASELINE,
      BASELINE.filter((d) => d !== "src/lib/delta/__tests__"),
    );

    expect(drift.entered).toEqual([]);
    expect(drift.left).toEqual(["src/lib/delta/__tests__"]);
    expect(drift.inAgreement).toBe(false);
  });

  /**
   * The cancelling direction. THIS is the case the integer could not see.
   */
  it("FAILS when two directories are wired and two others go dark in the same change", () => {
    const observed = [
      // the two that were wired, removed:
      "src/lib/charlie/__tests__",
      "src/lib/delta/__tests__",
      // the two that went dark, added:
      "src/app/api/foxtrot/__tests__",
      "src/lib/golf/__tests__",
    ];

    expect(observed).toHaveLength(BASELINE.length); // the count cancels out
    expect(observed.length === BASELINE.length).toBe(true);

    const drift = diffDarkDirectories(BASELINE, observed);

    expect(drift.inAgreement).toBe(false);
    expect(drift.entered).toEqual([
      "src/app/api/foxtrot/__tests__",
      "src/lib/golf/__tests__",
    ]);
    expect(drift.left).toEqual([
      "src/app/api/alpha/__tests__",
      "src/app/api/bravo/__tests__",
    ]);
  });

  it("puts the names of BOTH cancelling sides in the failure message itself", () => {
    const message = formatDarkDirectoryDrift(
      diffDarkDirectories(BASELINE, [
        "src/lib/charlie/__tests__",
        "src/lib/delta/__tests__",
        "src/app/api/foxtrot/__tests__",
        "src/lib/golf/__tests__",
      ]),
    );

    // The regression, named.
    expect(message).toContain("src/app/api/foxtrot/__tests__");
    expect(message).toContain("src/lib/golf/__tests__");
    // The wiring, named, and not confusable with the regression.
    expect(message).toContain("src/app/api/alpha/__tests__");
    expect(message).toContain("src/app/api/bravo/__tests__");
    expect(message).toContain("ENTERED");
    expect(message).toContain("LEFT");
    // Both sections are present even though the net count did not move, so a
    // reader sees two events rather than a silence.
    expect(message.indexOf("ENTERED")).toBeLessThan(message.indexOf("LEFT"));
    // And the baseline to edit is named, so the correct action is cheaper
    // than the guess.
    expect(message).toContain(DARK_DIRECTORY_BASELINE_PATH);
  });

  it("prints both sections when only one side moved, so an empty side is stated rather than implied", () => {
    const message = formatDarkDirectoryDrift(
      diffDarkDirectories(BASELINE, [...BASELINE, "src/lib/hotel/__tests__"]),
    );

    expect(message).toContain("ENTERED");
    expect(message).toContain("LEFT");
    expect(message).toContain("src/lib/hotel/__tests__");
  });

  it("is an equality and not a ceiling: a pure decrease is still drift", () => {
    const drift = diffDarkDirectories(BASELINE, BASELINE.slice(0, 2));

    expect(drift.inAgreement).toBe(false);
    expect(drift.left).toHaveLength(2);
  });

  it("does not silently absorb duplicates or unsorted input on either side", () => {
    expect(() =>
      diffDarkDirectories(
        ["src/lib/alpha/__tests__", "src/lib/alpha/__tests__"],
        [],
      ),
    ).toThrow(/duplicate/i);
  });
});
