import fs from "node:fs";
import path from "node:path";

/**
 * Two screens told a buyer eleven different ways that the product had not
 * established something, and twice contradicted themselves doing it.
 *
 * The discipline underneath is right — this product refuses to invent a savings
 * number. The defect was that the discipline had become the copy, so a reader
 * concluded the product knew nothing. These assertions hold the two
 * self-contradictions closed and keep the builder vocabulary off the client
 * surface.
 *
 * Read against the source rather than a render, because the strings sit on
 * branches a single fixture cannot reach at once: a load badge has three
 * states, and a decision row either has timing or does not.
 */

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

/** The file with its own explanatory comments removed. */
const withoutComments = (source: string) =>
  source
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
    })
    .join("\n");

const shellRaw = read(
  "src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx",
);
const shell = withoutComments(shellRaw);
const viewModel = withoutComments(
  read("src/app/(maestro)/source/preview/workspace/buildViewModel.ts"),
);

describe("the contract page does not call its evidence both ready and partial", () => {
  it("names the load state as a load state", () => {
    expect(shell).toContain('"Loading evidence"');
    expect(shell).toContain('"Evidence loaded"');
    expect(shell).toContain('"Evidence failed to load"');
  });

  // The contradiction: the badge said "ready" while the body said "Partial"
  // and "5 of 8 required evidence families", on one screen, at one moment.
  it("never describes depth as ready, which the body contradicts", () => {
    expect(shell).not.toContain("Evidence depth ready");
  });

  // Control: the comments that explain this fix DO still quote the old string,
  // so the assertion above is measuring rendered code and not an empty file.
  it("is measuring the code, not the comment that explains it", () => {
    expect(shellRaw).toContain("Evidence depth ready");
    expect(shell).toContain("ImpactLoadBadge");
  });
});

describe("a decision row does not badge the product's own pipeline state", () => {
  // The portfolio headline declares that notice timing is the constraint, and
  // every queue row then carried "Timing gate not loaded" — the screen arguing
  // with itself five rows at a time.
  it("says nothing where timing is absent, rather than naming the loader", () => {
    expect(shell).not.toContain("Timing gate not loaded");
  });

  it("returns an absent timing as null so a caller can omit it", () => {
    expect(shell).toContain("): string | null {");
    expect(shell).toContain('?? "Not recorded"');
  });

  it("renders the queue row's timing only when there is one", () => {
    expect(shell).toContain(
      "decisionDueLabel(row, portfolio.asOfDateIso) ? (",
    );
    expect(shell).toContain("{dueLabel ? <small>{dueLabel}</small> : null}");
  });
});

describe("the product stops narrating itself to the buyer", () => {
  it("does not tell the reader its own claims are hidden", () => {
    expect(shell).not.toContain("unsupported dashboard claims are hidden");
    // Control: the subhead it was removed from still reports the real counts.
    expect(shell).toContain("contracts · ${portfolio.vendors.length} vendors");
  });

  it("does not explain its own projection pipeline on a contract page", () => {
    expect(shell).not.toContain("Source will not expand this into");
    expect(viewModel).not.toContain("it does not create a savings claim");
  });

  // "Not sized" was stated four ways on one screen. One honest line is
  // credible; four reads as an apology. The remaining statements are the
  // action posture and the executive read — both of which a buyer acts on.
  it("says an opportunity is unsized without apologising for it", () => {
    expect(viewModel).not.toContain(
      "Opportunity rows are not sized; Source should ask for evidence",
    );
  });
});
