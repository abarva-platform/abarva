import { buildMovesChatAvaAnswerPacket } from "../moves-chat-answer-packet";
import type { PhaseTallyRow } from "../phase-explorer-tallies";
import type { NextPhaseReadinessPack } from "../phase-templates/next-phase-readiness-pack";

const PHASE_TALLIES: PhaseTallyRow[] = [
  { phase: 0, label: "P0", met: 3, total: 3, state: "done" },
  { phase: 1, label: "P1", met: 2, total: 2, state: "done" },
  { phase: 2, label: "P2", met: 5, total: 5, state: "done" },
  { phase: 3, label: "P3", met: 2, total: 2, state: "done" },
  { phase: 4, label: "P4", met: 5, total: 5, state: "done" },
  { phase: 5, label: "P5", met: 4, total: 4, state: "done" },
];

const READINESS_PACK_WITH_OPEN_NEED: NextPhaseReadinessPack = {
  nextPhaseLabel: "Tower handoff",
  isTerminalHandoff: true,
  openNeeds: [
    {
      evidenceSlot: "Measurement owner and cadence",
      priority: "required",
      status: "missing",
      acceptedFormats: ["workshop_notes"],
      exampleTemplate: "Tower measurement handoff",
      whyItMatters: "Tower needs an owner for value tracking.",
      nextAction: "Confirm the receiving Tower owner.",
    },
  ],
  suggestedSessions: [],
  suggestedTemplates: [],
  isFullyReady: false,
  carriesForwardContent: [],
};

describe("buildMovesChatAvaAnswerPacket", () => {
  it("does not render next-phase preparation blockers after terminal P5 handoff", () => {
    const answer = buildMovesChatAvaAnswerPacket({
      move: {
        displayCode: "SYN-MOVE",
        name: "Synthetic Move",
        terminalComplete: true,
        tenant: {
          id: "synthetic-tenant",
          name: "Synthetic Tenant",
          industryCode: null,
        },
      },
      phase: { phase: 5, code: "P5", title: "Mobilize" },
      question: "What should the client team do next?",
      visibleText:
        "The Move is handed off. Track remaining caveats in Tower without reopening the P5 gate.",
      phaseTallies: PHASE_TALLIES,
      readinessPack: READINESS_PACK_WITH_OPEN_NEED,
    });

    expect(answer).not.toBeNull();
    expect(answer?.tables?.map((table) => table.id)).not.toContain(
      "moves_next_phase_evidence_needs",
    );
    expect(answer?.metricsUsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "moves_next_phase_open_needs",
          value: 0,
        }),
      ]),
    );
    expect(answer?.nextSteps).toEqual([]);
    expect(answer?.businessImplication).toMatch(/Post-handoff caveats/i);
    expect(answer?.recommendation).toMatch(/Tower/i);
  });
});
