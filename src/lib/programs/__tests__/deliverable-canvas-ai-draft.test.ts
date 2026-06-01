import {
  MOVES_AI_DRAFT_LABEL,
  MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT,
  buildDeliverablesCanvasView,
} from "../deliverable-canvas-polish-view";
import type { ProgramDetailView } from "../programs-types";

describe("deliverable-canvas AI draft controls", () => {
  it("labels every Moves deliverable as an AI draft that requires edit before commit", () => {
    const view = {
      displayId: "APX-01",
      viewingPhase: 2,
      phasePanel: {
        deliverables: [
          { label: "Discovery brief", status: "done" },
          { label: "Next-step memo", status: "pending" },
        ],
        evidenceItems: [
          {
            confidence: "high",
            hasContradiction: false,
            citation: "sponsor interview",
          },
        ],
      },
    } as unknown as ProgramDetailView;

    const canvas = buildDeliverablesCanvasView(view);

    expect(canvas).not.toBeNull();
    expect(canvas?.items).toHaveLength(2);
    expect(
      canvas?.items.every((item) => item.aiDraftLabel === MOVES_AI_DRAFT_LABEL),
    ).toBe(true);
    expect(
      canvas?.items.every(
        (item) =>
          item.editBeforeCommitRequirement ===
          MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT,
      ),
    ).toBe(true);
    expect(canvas?.honestDisclaimer).toContain(
      MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT,
    );
  });
});
