import {
  formatRequiredSectionsForPrompt,
  getRequiredSectionsForArtifact,
  normalizeRequiredSectionHeadings,
  verifyArtifactSections,
} from "../section-conformance";

describe("Source artifact section conformance", () => {
  it("marks a draft incomplete when a required section is missing", () => {
    const result = verifyArtifactSections(
      "d01_strategy_memo",
      [
        "# Sourcing Strategy Memo",
        "## §1 · Why now",
        "Contracts expire soon and the operating model needs attention.",
        "## §2 · Recommended approach",
        "Run a competitive RFP for the managed-services estate.",
        "## §3 · What we know",
        "The current estate spans critical applications and infrastructure.",
        "## §4 · What remains open",
        "Ticket volume and application tiers still need confirmation.",
        "## §5 · Value hypothesis",
        "The value hypothesis is directional pending finance validation.",
        "## §6 · Next gate",
        "Proceed only after the sponsor confirms the scope.",
      ].join("\n\n"),
      "2026-06-16T00:00:00.000Z",
    );

    expect(result).toMatchObject({
      status: "incomplete",
      missingSections: ["Decision requested"],
      checkedAt: "2026-06-16T00:00:00.000Z",
    });
  });

  it("marks a complete draft verified", () => {
    const result = verifyArtifactSections(
      "d05_scope_memo",
      [
        "# Scope Memo",
        "## Executive summary",
        "This memo summarizes the business context, boundary decision, value urgency, and owner commitment.",
        "## §1 · In scope",
        "- Application support\n- Infrastructure operations\n- Service desk coverage",
        "## §2 · Out of scope",
        "- Cybersecurity SOC\n- Business-owned SaaS administration",
        "## §3 · Boundary clarifications",
        "Interfaces, escalation handoffs, and blackout windows require closure before issuance.",
        "## §4 · Scope owner + approval",
        "Tomas Singh owns the scope lock and sponsor approval path.",
      ].join("\n\n"),
    );

    expect(result?.status).toBe("verified");
    expect(result?.missingSections).toEqual([]);
  });

  it("matches plain and numbered section heading styles", () => {
    const sectionStyleA = verifyArtifactSections(
      "d01_strategy_memo",
      completeD01Body("## §1 · Decision requested"),
    );
    const sectionStyleB = verifyArtifactSections(
      "d01_strategy_memo",
      completeD01Body("## Decision requested"),
    );

    expect(sectionStyleA?.status).toBe("verified");
    expect(sectionStyleB?.status).toBe("verified");
  });

  it("normalizes exact required section labels emitted as plain text", () => {
    const body = [
      "# Sourcing Strategy Memo",
      "Decision requested",
      "| Dimension | Signal |",
      "| --- | --- |",
      "| Business context | Consolidated managed-services event. |",
      "## §1 · Why now",
      "Contracts expire soon and accountability must be consolidated.",
      "## §2 · Recommended approach",
      "Run a competitive RFP for the managed-services estate.",
      "## §3 · What we know",
      "The event covers managed services towers and operational support.",
      "## §4 · What remains open",
      "Ticket volume and application tiers still need confirmation.",
      "## §5 · Value hypothesis",
      "The value range is directional and pending finance validation.",
      "## §6 · Next gate",
      "Proceed after sponsor confirmation and evidence closure.",
    ].join("\n\n");

    const normalized = normalizeRequiredSectionHeadings(
      "d01_strategy_memo",
      body,
    );

    expect(normalized).toContain("## Decision requested");
    expect(
      verifyArtifactSections("d01_strategy_memo", normalized)?.status,
    ).toBe("verified");
  });

  it("does not duplicate existing required markdown headings", () => {
    const body = completeD01Body("## Decision requested");
    const normalized = normalizeRequiredSectionHeadings(
      "d01_strategy_memo",
      body,
    );

    expect(normalized.match(/^## Decision requested$/gm)).toHaveLength(1);
  });

  it("treats heading-only sections as missing", () => {
    const result = verifyArtifactSections(
      "d05_scope_memo",
      [
        "# Scope Memo",
        "## Executive summary",
        "This memo summarizes the business context and the boundary decision.",
        "## §1 · In scope",
        "## §2 · Out of scope",
        "- Cybersecurity SOC remains outside the event.",
        "## §3 · Boundary clarifications",
        "Transition, integration, and blackout boundaries remain explicit closure items.",
        "## §4 · Scope owner + approval",
        "Tomas Singh owns the final sponsor lock.",
      ].join("\n\n"),
    );

    expect(result).toMatchObject({
      status: "incomplete",
      missingSections: ["In scope"],
    });
  });

  it("renders required sections for prompts from the same source as verification", () => {
    expect(getRequiredSectionsForArtifact("d01_strategy_memo")).toContain(
      "Decision requested",
    );
    expect(formatRequiredSectionsForPrompt("d05_scope_memo")).toContain(
      "## §1 · In scope",
    );
  });
});

function completeD01Body(decisionRequestedHeading: string): string {
  return [
    "# Strategy Memo",
    decisionRequestedHeading,
    "Recommendation: approve the sourcing event and authorize scope preparation.",
    "## §1 · Why now",
    "Contracts expire soon and accountability must be consolidated.",
    "## §2 · Recommended approach",
    "Run a competitive RFP for the managed-services estate.",
    "## §3 · What we know",
    "The event covers managed services towers and operational support.",
    "## §4 · What remains open",
    "Ticket volume and application tiers still need confirmation.",
    "## §5 · Value hypothesis",
    "The value range is directional and pending finance validation.",
    "## §6 · Next gate",
    "Proceed after sponsor confirmation and evidence closure.",
  ].join("\n\n");
}
