import {
  normalizeAbarvaAgentMarkup,
  normalizeMarkdownTables,
} from "@/lib/agent/markdownTokens";

describe("markdown table normalization", () => {
  it("removes separator rows that would otherwise render as executive table data", () => {
    const malformed = [
      "Moves phase plan",
      "",
      "| Phase | Focus | Key Artifact | Owner |",
      "| --- | --- | --- | --- |",
      "| --- | --- | --- | --- |",
      "| P0 Originate | Consolidate the portfolio thesis | Origination memo | CFO + CIO |",
      "| P1 Charter | Confirm sponsor and budget | Signed charter | CFO |",
    ].join("\n");

    const normalized = normalizeMarkdownTables(malformed);

    expect(normalized).toContain("| Phase | Focus | Key Artifact | Owner |");
    expect(normalized).toContain(
      "| P0 Originate | Consolidate the portfolio thesis | Origination memo | CFO + CIO |",
    );
    expect(normalized.match(/\| --- \| --- \| --- \| --- \|/g)).toHaveLength(1);
  });

  it("creates a valid GFM separator when Claude emits a pipe table without one", () => {
    const malformed = [
      "| Phase | Checkpoint | Owner |",
      "| P0 Originate | Confirm risk tier | CFO |",
      "| P1 Charter | Confirm HITL protocol | AI governance lead |",
    ].join("\n");

    expect(normalizeMarkdownTables(malformed)).toBe(
      [
        "| Phase | Checkpoint | Owner |",
        "| --- | --- | --- |",
        "| P0 Originate | Confirm risk tier | CFO |",
        "| P1 Charter | Confirm HITL protocol | AI governance lead |",
      ].join("\n"),
    );
  });

  it("applies table cleanup after AbarVa markup cleanup", () => {
    const normalized = normalizeAbarvaAgentMarkup(
      "<p>| Phase | Focus |</p><p>| --- | --- |</p><p>| --- | --- |</p><p>| P0 | Originate |</p>",
    );

    expect(normalized).toContain("| Phase | Focus |");
    expect(normalized).toContain("| P0 | Originate |");
    expect(normalized.match(/\| --- \| --- \|/g)).toHaveLength(1);
  });

  it("turns inline pipe tables into proper markdown blocks", () => {
    const malformed =
      'Build a named authority chain, not a generic "escalate up": | Priority | Role | Authority | | --- | --- | --- | | 1 | CFO Deputy | Sign cash holds | | 2 | Treasury Lead | Update forecast inputs |';

    const normalized = normalizeMarkdownTables(malformed);

    expect(normalized).toContain(
      'Build a named authority chain, not a generic "escalate up":\n\n| Priority | Role | Authority |',
    );
    expect(normalized).toContain("| 1 | CFO Deputy | Sign cash holds |");
    expect(normalized).toContain("| 2 | Treasury Lead | Update forecast inputs |");
    expect(normalized.match(/\| --- \| --- \| --- \|/g)).toHaveLength(1);
    expect(normalized).not.toContain("| | ---");
  });
});
