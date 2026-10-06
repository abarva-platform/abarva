import {
  blankComments,
  collectSkips,
  commentAbove,
  statesNoReason,
} from "../../../scripts/audit/skipped-test-inventory.mjs";

/**
 * A skipped suite that nobody named is indistinguishable from a suite that
 * does not exist. Wiring a directory into CI proves a command runs; it does
 * not prove the assertions inside it execute, and a run reporting
 * `1 skipped` names nothing.
 *
 * So the inventory names them, and these cases hold it to the two ways it
 * would quietly stop working: counting prose about a skip as a skip, and
 * calling a documented skip unreasoned.
 */

describe("every skipped test is named and says why", () => {
  it("finds the skips that exist, and reports both kinds apart", () => {
    const { unconditional, conditional } = collectSkips();

    // Unconditional: somebody turned these off, and the reason can expire.
    expect(unconditional.length).toBe(5);

    // Conditional: these run somewhere, and where they do not, CI reports
    // the suite as passing while it asserted nothing. A different hazard,
    // so a separate list.
    expect(conditional.length).toBe(2);
    expect(conditional.every((s) => s.condition.length > 0)).toBe(true);
  });

  it("holds every skip to stating a reason", () => {
    const { unconditional } = collectSkips();

    const unreasoned = unconditional.filter((s) =>
      statesNoReason(s.title, s.precedingComment),
    );

    expect(unreasoned.map((s) => `${s.file}:${s.line}`)).toEqual([]);
  });

  it("does not count a skip that somebody wrote about", () => {
    // This happened within minutes of the inventory existing: removing a
    // skip and explaining the removal in a comment that quoted its title
    // left the inventory still reporting it. A scanner that cannot tell
    // code from prose about code reports the prose.
    const source = [
      "// This block held it.skip('the old assertion (enable after fix C)').",
      "/* it.skip('another one in a block comment') */",
      "it('a real test', () => {});",
    ].join("\n");

    const { unconditional } = collectSkips([], () => source, ["virtual.test.ts"]);
    expect(unconditional).toEqual([]);
  });

  it("keeps line numbers right while blanking comments", () => {
    // The blanking preserves length and newlines so a reported line still
    // points at the skip. Without that the inventory names the wrong line,
    // which is worse than naming none.
    const source = "// a comment\n/* two\n   lines */\nit.skip('off until Tuesday', () => {});\n";
    const blanked = blankComments(source);

    expect(blanked.split("\n").length).toBe(source.split("\n").length);
    expect(blanked.length).toBe(source.length);
    expect(blanked).toContain("it.skip('off until Tuesday'");
    expect(blanked).not.toContain("a comment");

    const { unconditional } = collectSkips([], () => source, ["virtual.test.ts"]);
    expect(unconditional).toHaveLength(1);
    expect(unconditional[0].line).toBe(4);
  });

  it("reads a reason from the comment above, not only the title", () => {
    // A reason stated above the skip is a better reason than most titles
    // carry. Flagging it would teach people the check is noise.
    const source = [
      "// Re-enable when Jest gets a disposable Postgres fixture.",
      "describe.skip('integration scenarios', () => {});",
    ].join("\n");

    const { unconditional } = collectSkips([], () => source, ["virtual.test.ts"]);
    expect(unconditional).toHaveLength(1);
    expect(commentAbove(source, source.indexOf("describe.skip"))).toContain(
      "Postgres fixture",
    );
    expect(
      statesNoReason(unconditional[0].title, unconditional[0].precedingComment),
    ).toBe(false);
  });

  it("flags a skip that says nothing anywhere", () => {
    // The control for the case above: the reason-reading must still be able
    // to come back empty, or "every skip states a reason" is vacuous.
    const source = "it.skip('does the thing', () => {});";

    const { unconditional } = collectSkips([], () => source, ["virtual.test.ts"]);
    expect(
      statesNoReason(unconditional[0].title, unconditional[0].precedingComment),
    ).toBe(true);
  });
});
