/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { PhaseDocumentsPanel } from "../PhaseDocumentsPanel";
import { GeneratePhasePackage } from "../GeneratePhasePackage";
import { AI_DECISION_SUPPORT_WATERMARK } from "@/lib/ai-liability/human-decision-controls";
import { azureRead } from "@/lib/data-plane/azureRead";
import {
  MOVES_AI_DRAFT_LABEL,
  MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT,
} from "@/lib/programs/deliverable-canvas-polish-view";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    query: jest.fn(async () => []),
  },
}));

jest.mock("@/lib/programs/attachments", () => ({
  listAttachmentsForProgram: async () => [],
}));

describe("Strategic Moves visible AI liability controls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("labels phase generation controls as AI drafts requiring human edit before commit", () => {
    render(
      <GeneratePhasePackage
        programId="5f5d7993-18ba-4eb6-84a3-72373aab042b"
        phaseNum={1}
        phaseLabel="P1 Charter"
      />,
    );

    expect(screen.getAllByText(MOVES_AI_DRAFT_LABEL).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(AI_DECISION_SUPPORT_WATERMARK)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Generate all P1 Charter AI Draft documents/i,
      }),
    ).toBeInTheDocument();
  });

  it("labels the production documents tab rows with AI Draft and edit-before-commit controls", async () => {
    const moveId = "5f5d7993-18ba-4eb6-84a3-72373aab042b";

    render(
      await PhaseDocumentsPanel({
        moveId,
        currentPhase: 1,
        compact: true,
      }),
    );

    expect(azureRead.query).toHaveBeenCalledWith(
      expect.stringContaining("LEFT JOIN LATERAL"),
      [moveId],
    );
    expect(screen.getAllByText(MOVES_AI_DRAFT_LABEL).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(AI_DECISION_SUPPORT_WATERMARK)).toBeInTheDocument();
  });
});
