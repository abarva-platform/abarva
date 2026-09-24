import { buildMovesAvaChatPacket } from "../packet";
import { formatMovesAvaChatPacketForPrompt } from "../system-prompt";
import {
  classifyMovesAvaQuestion,
  shouldBuildMovesAvaPacketForMode,
} from "../answer-modes";
import {
  buildDeterministicMovesAvaStatusAnswer,
  buildDeterministicPhaseInputDraftAnswer,
} from "../deterministic-answer";

const BASE_INPUT = {
  tenant: "lakeshore",
  moveId: "908c9bf8-e745-45dc-9ad8-3d493a2a1c8a",
  moveTitle: "Legal and Vendor Contract Obligation Control",
  currentPhase: 2,
  currentPhaseClientLabel: "P2 Discover & Diagnose",
};

describe("buildMovesAvaChatPacket — no blank-prompt chat", () => {
  it("records every unloaded optional field in missingInputs with a matching caveat", () => {
    const packet = buildMovesAvaChatPacket(
      BASE_INPUT,
      "What should I do next?",
    );
    expect(packet.missingInputs.length).toBeGreaterThan(0);
    expect(packet.caveats.length).toBe(packet.missingInputs.length);
    expect(packet.caveats[0]).toMatch(/needs confirmation, do not guess/);
  });

  it("does not record fields as missing once they are supplied", () => {
    const packet = buildMovesAvaChatPacket(
      {
        ...BASE_INPUT,
        checklistStatus: {
          evidenceDone: false,
          evidenceLabel: "2 of 4 in",
          gateDone: false,
          gateLabel: "2 of 5 met",
          canAdvance: false,
          nextPhaseLabel: "P3 Design Future State",
        },
        gateCriteria: [
          { label: "Baseline confirmed", met: false, severity: "hard" },
        ],
      },
      "What should I do next?",
    );
    expect(packet.missingInputs).not.toContain("phase checklist status");
    expect(packet.missingInputs).not.toContain("gate criteria");
    expect(packet.checklistStatus?.evidenceLabel).toBe("2 of 4 in");
  });

  it("always carries the fixed allowed/disallowed action lists", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "Can we advance?");
    expect(packet.allowedActions.length).toBeGreaterThan(0);
    expect(packet.disallowedActions).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/approve a phase or advance a gate/i),
      ]),
    );
  });

  it("detects Source implication from the question text and attaches it to the packet", () => {
    const packet = buildMovesAvaChatPacket(
      BASE_INPUT,
      "How does this affect Source given the vendor renewal?",
    );
    expect(packet.sourceImplication.relevant).toBe(true);
  });

  it("detects Tower implication from the question text and attaches it to the packet", () => {
    const packet = buildMovesAvaChatPacket(
      BASE_INPUT,
      "What should Tower measure for adoption?",
    );
    expect(packet.towerMeasurement.relevant).toBe(true);
  });

  it("leaves both awareness flags false when the question is unrelated to either", () => {
    const packet = buildMovesAvaChatPacket(
      BASE_INPUT,
      "What should I do next in this phase?",
    );
    expect(packet.sourceImplication.relevant).toBe(false);
    expect(packet.towerMeasurement.relevant).toBe(false);
  });

  it("renders live Moves gate state as authoritative over generic phase-pack criteria", () => {
    const packet = buildMovesAvaChatPacket(
      {
        ...BASE_INPUT,
        checklistStatus: {
          evidenceDone: false,
          evidenceLabel: "0 evidence items visible",
          gateDone: false,
          gateLabel: "1 hard gate open",
          canAdvance: false,
          nextPhaseLabel: "P2",
        },
        gateCriteria: [
          {
            label: "Sponsor committed and decision rights named",
            met: true,
            severity: "hard",
          },
          {
            label: "Charter signed off by sponsor",
            met: false,
            severity: "hard",
          },
          {
            label: "Initial value range and success metrics ratified",
            met: false,
            severity: "soft",
          },
        ],
      },
      "What is the current gate status?",
    );

    const prompt = formatMovesAvaChatPacketForPrompt(packet, "gate_blocker");

    expect(prompt).toContain("AUTHORITATIVE LIVE MOVES STATE");
    expect(prompt).toContain(
      "Live gate tally: 1 of 2 blocking hard gate criteria met; 1 open.",
    );
    expect(prompt).toContain(
      "Checklist: evidence not done (0 evidence items visible); gate not met (1 hard gate open); can advance: no",
    );
  });

  it("classifies current gate status as a gate blocker so it can bypass generic phase-pack guidance", () => {
    expect(
      classifyMovesAvaQuestion("What is the current gate status?").mode,
    ).toBe("gate_blocker");
    expect(
      classifyMovesAvaQuestion(
        "Quote the exact live gate tally and checklist status.",
      ).mode,
    ).toBe("gate_blocker");
  });

  it("classifies phase-input draft requests and instructs capture-field artifacts with citations", () => {
    const mode = classifyMovesAvaQuestion("Draft proposed inputs for P1").mode;
    expect(mode).toBe("phase_input_draft");
    expect(
      shouldBuildMovesAvaPacketForMode({
        hardeningEnabled: false,
        mode,
      }),
    ).toBe(true);
    expect(
      shouldBuildMovesAvaPacketForMode({
        hardeningEnabled: false,
        mode: "gate_blocker",
      }),
    ).toBe(false);

    const packet = buildMovesAvaChatPacket(
      {
        ...BASE_INPUT,
        currentPhase: 1,
        currentPhaseClientLabel: "P1 Charter",
      },
      "Draft proposed inputs for P1",
    );
    const prompt = formatMovesAvaChatPacketForPrompt(packet, mode);

    expect(prompt).toContain("Phase-input drafting mode");
    expect(prompt).toContain("[[artifact:capture-field]]");
    expect(prompt).toContain("citations");
    expect(prompt).toContain("Do not render uncited field drafts");
    expect(prompt).toContain("the user must insert the draft and save");
  });

  it("builds deterministic capture-field artifacts for cited phase-input proposals", () => {
    const packet = buildMovesAvaChatPacket(
      {
        ...BASE_INPUT,
        currentPhase: 1,
        currentPhaseClientLabel: "P1 Charter",
      },
      "Draft proposed inputs for P1",
    );

    const answer = buildDeterministicPhaseInputDraftAnswer({
      packet,
      phase: 1,
      proposals: [
        {
          fieldKey: "scope_boundary",
          currentValue: null,
          proposedValue: "In scope: Airport turnaround operations",
          rationale: "Drafted from approved P0 scope.",
          evidenceRefs: ["P0 · Affected function / process"],
          sourceClasses: ["approved_phase_input"],
          confidence: "high",
          materiality: "governed_material",
          unresolvedGaps: [],
        },
      ],
    });

    expect(answer).toContain("They are not saved");
    expect(answer).toContain("[[artifact:capture-field]]");
    expect(answer).toContain('"phase":1');
    expect(answer).toContain('"key":"scope_boundary"');
    expect(answer).toContain(
      '"citations":["P0 · Affected function / process"]',
    );
  });

  it("builds a deterministic live-status answer without substituting old phase-pack gate counts", () => {
    const packet = buildMovesAvaChatPacket(
      {
        ...BASE_INPUT,
        moveTitle: "Meridian Member Experience AI Assist",
        currentPhase: 1,
        currentPhaseClientLabel: "P1 Charter",
        checklistStatus: {
          evidenceDone: false,
          evidenceLabel: "0 evidence items visible",
          gateDone: false,
          gateLabel: "1 hard gate open",
          canAdvance: false,
          nextPhaseLabel: "P2",
        },
        evidenceNeedPackets: [
          "HARD: Sponsor confirmation - missing. Next: Upload sponsor review notes.",
        ],
        gateCriteria: [
          { label: "GC-P1-1 Sponsor engaged", met: false, severity: "hard" },
          {
            label: "GC-P1-2 Primary success metric",
            met: false,
            severity: "hard",
          },
          { label: "GC-P1-3 Value range locked", met: false, severity: "hard" },
          {
            label: "GC-P1-4 Scope boundary confirmed",
            met: false,
            severity: "hard",
          },
        ],
      },
      "What is the current gate status?",
    );

    const answer = buildDeterministicMovesAvaStatusAnswer(
      packet,
      "gate_blocker",
    );

    expect(answer).toContain(
      "0 evidence items visible; 1 hard gate open; can advance: no",
    );
    expect(answer).toContain("The live Move page is the source of truth");
    expect(answer).not.toMatch(/all four|four hard|all seven|seven criteria/i);
  });

  it("suppresses evidence-need packets after terminal P5 completion", () => {
    const packet = buildMovesAvaChatPacket(
      {
        ...BASE_INPUT,
        currentPhase: 5,
        currentPhaseClientLabel: "P5 Mobilize",
        terminalHandoffComplete: true,
        checklistStatus: {
          evidenceDone: true,
          evidenceLabel: "12 evidence items visible",
          gateDone: true,
          gateLabel: "0 hard gates open",
          canAdvance: true,
          nextPhaseLabel: "Tower",
        },
        evidenceNeedPackets: [
          "REQUIRED: Measurement owner and cadence - missing. Next: confirm Tower owner.",
        ],
        gateCriteria: [
          { label: "Tower handoff accepted", met: true, severity: "hard" },
        ],
      },
      "What should the client team do next?",
    );

    expect(packet.evidenceNeedPackets).toEqual([]);

    const prompt = formatMovesAvaChatPacketForPrompt(
      packet,
      "tower_measurement",
    );

    expect(prompt).toContain("Terminal handoff state");
    expect(prompt).toContain("Terminal P5 answer rule");
    expect(prompt).toMatch(/do not ask the user to capture Tower acceptance/i);
    expect(prompt).toMatch(/start after handoff/i);
    expect(prompt).not.toContain("Measurement owner and cadence");
    expect(prompt).not.toContain("Post-handoff caveats/follow-up candidates");
    expect(prompt).not.toContain("Evidence needs:");
    expect(prompt).not.toMatch(/required-before-acceptance/i);
  });

  it("answers terminal P5 next-step prompts with execution handoff guidance, not only status", () => {
    const packet = buildMovesAvaChatPacket(
      {
        ...BASE_INPUT,
        moveTitle: "Synthetic healthcare execution handoff",
        currentPhase: 5,
        currentPhaseClientLabel: "P5 Mobilize",
        terminalHandoffComplete: true,
        checklistStatus: {
          evidenceDone: true,
          evidenceLabel: "8 evidence items visible",
          gateDone: true,
          gateLabel: "0 hard gates open",
          canAdvance: true,
          nextPhaseLabel: "Tower",
        },
        gateCriteria: [
          { label: "Tower handoff accepted", met: true, severity: "hard" },
          { label: "Execution owner named", met: true, severity: "hard" },
        ],
      },
      "What should the client team do next? Name workshops, evidence to collect, blockers, and Tower metrics.",
    );

    const answer = buildDeterministicMovesAvaStatusAnswer(
      packet,
      "evidence_gap",
    );

    expect(answer).toContain("8 evidence items visible");
    expect(answer).toContain("0 hard gates open");
    expect(answer).toContain("Execution readiness answer");
    expect(answer).toContain("Tower kickoff");
    expect(answer).toContain("Metric baseline lock");
    expect(answer).toContain("Caveat burn-down");
    expect(answer).toContain("Metrics to carry into Tower");
    expect(answer).toContain("do not reopen P5 for new collection");
    expect(answer).not.toContain("Evidence still needed");
    expect(answer).not.toMatch(/blocked before Tower/i);
  });
});
