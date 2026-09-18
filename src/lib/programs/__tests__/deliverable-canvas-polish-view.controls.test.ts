/**
 * Behavioral test for the `moves-deliverable-canvas-view` control declared in
 * docs/security/ai-surface-control-catalog.json:
 *
 *   ai-label    every deliverable card is marked as an AI draft
 *   citation    a deliverable's evidence trace names its sources
 *   confidence  each deliverable carries a readiness the reader can act on
 *
 * The checker proves the tokens appear in the module. It cannot prove any of
 * them survives into the built view — and this is a `.map` over deliverables,
 * so a conditional that set the label on some items and not others would keep
 * every token in the file and leave cards unmarked.
 *
 * Three of the assertions below are gaps stated rather than left implicit.
 * They pin current behavior so a fix has to change the test.
 */

import {
  buildDeliverablesCanvasView,
  MOVES_AI_DRAFT_LABEL,
} from "../deliverable-canvas-polish-view";
import type { EvidenceItem, ProgramDetailView } from "../programs-types";

function evidence(extra: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: "ev-1",
    citation: "Workshop 4 output · Apr 14 2026",
    source: "Workshop",
    excerpt: "Throughput target confirmed by the operating team.",
    confidence: "high",
    ...extra,
  };
}

function view(
  deliverables: Array<{ label: string; status: "done" | "pending" | "blocked" }>,
  evidenceItems: EvidenceItem[] = [],
): ProgramDetailView {
  return {
    programId: "prog-1",
    displayId: "PRG-001",
    name: "Claims throughput",
    tenant: "apex",
    currentPhase: 2,
    viewingPhase: 2,
    phases: [],
    gateStatus: "open",
    workbench: {},
    agentRail: [],
    phasePanel: { deliverables, evidenceItems },
    deterministicSeed: true,
  } as unknown as ProgramDetailView;
}

describe("moves deliverable canvas view · disclosure controls", () => {
  it("marks every deliverable as an AI draft, not just the first", () => {
    const built = buildDeliverablesCanvasView(
      view([
        { label: "Operating model", status: "done" },
        { label: "Runbook", status: "pending" },
        { label: "Cutover plan", status: "blocked" },
      ]),
    );

    expect(built).not.toBeNull();
    expect(built!.items).toHaveLength(3);
    for (const item of built!.items) {
      expect(item.aiDraftLabel).toBe(MOVES_AI_DRAFT_LABEL);
      expect(item.editBeforeCommitRequirement).toMatch(/human review required/i);
    }
  });

  it("gives every deliverable a readiness the reader can act on", () => {
    const built = buildDeliverablesCanvasView(
      view(
        [
          { label: "Operating model", status: "done" },
          { label: "Runbook", status: "pending" },
          { label: "Cutover plan", status: "blocked" },
        ],
        [evidence()],
      ),
    );

    const byLabel = new Map(built!.items.map((i) => [i.label, i]));
    // A done deliverable with usable evidence is trustworthy; a pending one
    // with the same evidence is only partial; blocked overrides both. If
    // readiness collapsed to one value the reader could not tell an
    // evidenced deliverable from an unevidenced one.
    expect(byLabel.get("Operating model")!.readiness).toBe("trustworthy");
    expect(byLabel.get("Runbook")!.readiness).toBe("partial");
    expect(byLabel.get("Cutover plan")!.readiness).toBe("blocked");
    for (const item of built!.items) {
      expect(item.readinessLabel.length).toBeGreaterThan(0);
      expect(item.nextAction.length).toBeGreaterThan(0);
    }
  });

  it("drops low-confidence and contradicted evidence from the trace", () => {
    const built = buildDeliverablesCanvasView(
      view(
        [{ label: "Operating model", status: "done" }],
        [
          evidence({ id: "ev-low", citation: "Hallway note", confidence: "low" }),
          evidence({
            id: "ev-contra",
            citation: "Disputed vendor claim",
            hasContradiction: true,
          }),
          evidence({ id: "ev-ok", citation: "Signed workshop output" }),
        ],
      ),
    );

    const trace = built!.items[0].evidenceCitations;
    // A citation pointing at contradicted or low-confidence evidence is worse
    // than no citation: it lends the deliverable a weight the evidence does
    // not carry.
    expect(trace).toContain("Signed workshop output");
    expect(trace).not.toContain("Hallway note");
    expect(trace).not.toContain("Disputed vendor claim");
  });

  it("documents a gap: the trace silently stops at two citations", () => {
    const built = buildDeliverablesCanvasView(
      view(
        [{ label: "Operating model", status: "done" }],
        ["a", "b", "c", "d", "e"].map((k) =>
          evidence({ id: `ev-${k}`, citation: `Source ${k}` }),
        ),
      ),
    );

    // Five usable sources, two shown, and nothing tells the reader the other
    // three exist. That is a truncation presented as a complete trace.
    expect(built!.items[0].evidenceCitations).toHaveLength(2);
  });

  it("documents a gap: readiness reads the phase's evidence, not the deliverable's", () => {
    const built = buildDeliverablesCanvasView(
      view(
        [
          { label: "Operating model", status: "pending" },
          { label: "Runbook", status: "pending" },
        ],
        [evidence()],
      ),
    );

    // One piece of evidence anywhere in the phase makes BOTH pending
    // deliverables read as "partial", including the one it has nothing to do
    // with. Evidence is not associated with a deliverable anywhere in this
    // model, so the readiness badge is a phase-level fact wearing a
    // deliverable-level label.
    for (const item of built!.items) {
      expect(item.readiness).toBe("partial");
    }
  });

  it("documents a gap: a pending deliverable shows no evidence even when it has some", () => {
    const built = buildDeliverablesCanvasView(
      view([{ label: "Runbook", status: "pending" }], [evidence()]),
    );

    // The trace is empty only because the status is not done — not because
    // no evidence exists. A reader cannot distinguish "nothing filed" from
    // "filed, withheld until done".
    expect(built!.items[0].evidenceCitations).toEqual([]);
    expect(built!.items[0].readiness).toBe("partial");
  });

  it("never enables approve or export from this view", () => {
    const built = buildDeliverablesCanvasView(
      view([{ label: "Operating model", status: "done" }], [evidence()]),
    );

    // Even a trustworthy, fully evidenced deliverable offers no way to commit
    // from here. The view is a read surface; the commit path is elsewhere and
    // carries its own approval gate.
    for (const action of built!.items[0].actions) {
      expect(action.enabled).toBe(false);
      expect(action.reason.length).toBeGreaterThan(0);
    }
  });
});
