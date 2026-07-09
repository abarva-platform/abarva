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
    expect(normalized).toContain(
      "| 2 | Treasury Lead | Update forecast inputs |",
    );
    expect(normalized.match(/\| --- \| --- \| --- \|/g)).toHaveLength(1);
    expect(normalized).not.toContain("| | ---");
  });

  it("turns tab-separated table output into a proper markdown table", () => {
    const malformed = [
      "Suppression Event Layer\tTreasurer-Facing Alert\tEscalation\tHome\tIntelligence",
      "---\t---\t\t\t",
      "Circuit breaker trip\tNamed banner\tCFO owner\tPublish evidence\tFrame breach",
      "Data quality warning\tDigest alert\tData owner\tShow source freshness\tExplain caveat",
    ].join("\n");

    const normalized = normalizeMarkdownTables(malformed);

    expect(normalized).toContain(
      "| Suppression Event Layer | Treasurer-Facing Alert | Escalation | Home | Intelligence |",
    );
    expect(normalized).toContain("| --- | --- | --- | --- | --- |");
    expect(normalized).toContain(
      "| Circuit breaker trip | Named banner | CFO owner | Publish evidence | Frame breach |",
    );
    expect(normalized).not.toContain("---\t---");
    expect(
      normalized.match(/\| --- \| --- \| --- \| --- \| --- \|/g),
    ).toHaveLength(1);
  });

  it("adds table boundaries when a tab-separated table follows prose", () => {
    const malformed = [
      "A retrained model pushed to production without HITL sign-off is a governance breach.",
      "Decision Protocol by Drift Type",
      "Drift Classification\tTrigger\tResponse",
      "---\t---\t---",
      "Statistical noise\tMAPE 10-15%\tAttempt in-window retraining if gates pass",
      "Structural shift\tMAPE >15%\tAutomatic rollback; long retraining cycle",
    ].join("\n");

    const normalized = normalizeMarkdownTables(malformed);

    expect(normalized).toContain(
      "Decision Protocol by Drift Type\n\n| Drift Classification | Trigger | Response |",
    );
    expect(normalized).toContain("| --- | --- | --- |");
    expect(normalized).toContain(
      "| Structural shift | MAPE >15% | Automatic rollback; long retraining cycle |",
    );
    expect(normalized).not.toContain("\n---\t---\t---\n");
  });
});
