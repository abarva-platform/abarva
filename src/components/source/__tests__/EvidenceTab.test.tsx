/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { EvidenceTab } from "../canvas/workspace-tabs/EvidenceTab";
import type { SourceEventEvidence } from "@/lib/source/canvas-substrate";

function evidenceRow(
  overrides: Partial<SourceEventEvidence> = {},
): SourceEventEvidence {
  return {
    id: "evidence-state-1",
    sourceEventId: "source-event-1",
    tenantKey: "apexretail",
    requirementId: "EVID-SRC-STR-INCUMBENT",
    stage: "strategy",
    currentState: "Not Requested",
    sourceArtifactId: null,
    notes: null,
    lastSyncedAt: null,
    createdAt: "2026-06-02T12:00:00.000Z",
    updatedAt: "2026-06-02T12:00:00.000Z",
    ...overrides,
  };
}

describe("EvidenceTab", () => {
  it("shows a request CTA for evidence that has not been requested", () => {
    render(<EvidenceTab stage="strategy" states={[evidenceRow()]} />);

    const request = screen.getByRole("link", { name: /request evidence/i });
    expect(request).toHaveAttribute("href", expect.stringContaining("mailto:"));
    expect(request).toHaveAttribute(
      "href",
      expect.stringContaining("Source%20evidence%20request"),
    );
  });

  it("does not show the request CTA once evidence is in progress", () => {
    render(
      <EvidenceTab
        stage="strategy"
        states={[evidenceRow({ currentState: "Loaded" })]}
      />,
    );

    expect(
      screen.queryByRole("link", { name: /request evidence/i }),
    ).not.toBeInTheDocument();
  });
});
