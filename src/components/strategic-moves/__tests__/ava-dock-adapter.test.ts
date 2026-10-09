import {
  avaThreadToDockMessages,
  avaSuggestedActions,
  avaPhaseInputDraftAvailability,
  avaPhaseInputDraftLeadingActions,
  AVA_PHASE_INPUT_DRAFT_ACTION_ID,
  AVA_PHASE_INPUT_DRAFT_FIRST_PHASE,
  AVA_PHASE_INPUT_DRAFT_LAST_PHASE,
  type AvaThreadTurn,
} from "../ava-dock-adapter";

describe("ava-dock-adapter", () => {
  it("maps the aVa thread to AgentDock messages (role + body + structured answer)", () => {
    const turns: AvaThreadTurn[] = [
      { id: "t1", role: "user", text: "What's in scope?" },
      {
        id: "t2",
        role: "assistant",
        text: "In: member-services voice.",
        agentAnswer: { kind: "answer" } as never,
      },
    ];
    const messages = avaThreadToDockMessages(turns);
    expect(messages).toEqual([
      { id: "t1", role: "user", body: "What's in scope?" },
      {
        id: "t2",
        role: "agent",
        body: "In: member-services voice.",
        agentAnswer: { kind: "answer" },
      },
    ]);
  });

  it("omits agentAnswer when absent or null", () => {
    const [m] = avaThreadToDockMessages([
      { id: "x", role: "assistant", text: "hi", agentAnswer: null },
    ]);
    expect(m).not.toHaveProperty("agentAnswer");
    expect(m.role).toBe("agent");
  });

  it("builds at most three suggested actions, leading actions first", () => {
    const actions = avaSuggestedActions(
      ["What is in and out of scope?", "Which success metric is weakest?", "q3", "q4"],
      [{ id: "draft", label: "Draft proposed inputs", body: "", onClick: () => {} }],
    );
    expect(actions).toHaveLength(3);
    expect(actions[0].id).toBe("draft");
    expect(actions[1]).toMatchObject({
      label: "What is in and out of scope?",
      body: "What is in and out of scope?",
    });
    // the 4th question is dropped (cap of 3)
    expect(actions.map((a) => a.label)).not.toContain("q4");
  });

  it("works with no leading actions", () => {
    const actions = avaSuggestedActions(["a", "b"]);
    expect(actions).toHaveLength(2);
    expect(actions[0].id).toBe("ava-q-0");
  });
});

/**
 * aVa's "Draft proposed inputs" offer is phase-conditional. Drafting carries an
 * EARLIER approved capture forward with a citation, so P0 Originate has nothing
 * upstream to cite and the drafting endpoint accepts phases 1-5 only.
 *
 * The capture-flow dock renders every leading action it is handed as an enabled
 * button, so these cases pin the EMPTY list as the contract for a phase that
 * cannot be drafted — an action there is a dead control, and a dead control on
 * P0 is a dead control on the walk's first step.
 */
describe("aVa phase-input drafting availability", () => {
  it("offers drafting on every phase the drafting endpoint accepts", () => {
    for (const phase of [1, 2, 3, 4, 5]) {
      const availability = avaPhaseInputDraftAvailability(phase);
      expect(availability.available).toBe(true);
      expect(availability.unavailableReason).toBeNull();
    }
  });

  it("refuses P0 Originate and says why, naming the phase drafting starts at", () => {
    const availability = avaPhaseInputDraftAvailability(0);
    expect(availability.available).toBe(false);
    expect(availability.unavailableReason).toContain("P0 Originate");
    expect(availability.unavailableReason).toContain(
      "nothing upstream to cite",
    );
    expect(availability.unavailableReason).toContain("P1 Charter");
  });

  it("gives a phase above the window its own reason, not P0's first-phase claim", () => {
    // Not reachable from the standalone phase surface, whose route parser 404s
    // anything outside [0,5]; asserted so the out-of-window arm cannot answer
    // with a sentence that would be false there.
    const availability = avaPhaseInputDraftAvailability(6);
    expect(availability.available).toBe(false);
    expect(availability.unavailableReason).not.toContain("first phase");
    expect(availability.unavailableReason).toContain("P1 Charter through P5");
  });

  it("treats a non-integer phase as not draftable", () => {
    expect(avaPhaseInputDraftAvailability(1.5).available).toBe(false);
    expect(avaPhaseInputDraftAvailability(Number.NaN).available).toBe(false);
  });

  it("declares the window as the drafting endpoint does", () => {
    expect(AVA_PHASE_INPUT_DRAFT_FIRST_PHASE).toBe(1);
    expect(AVA_PHASE_INPUT_DRAFT_LAST_PHASE).toBe(5);
  });

  it("builds ONE drafting action for a draftable phase, wired to the handler", () => {
    const onDraft = jest.fn();
    const actions = avaPhaseInputDraftLeadingActions(1, onDraft);
    expect(actions).toHaveLength(1);
    expect(actions[0].id).toBe(AVA_PHASE_INPUT_DRAFT_ACTION_ID);
    expect(actions[0].label).toBe("Draft proposed inputs");
    actions[0].onClick?.();
    expect(onDraft).toHaveBeenCalledTimes(1);
  });

  it("builds NO leading action for P0, and never calls the handler", () => {
    const onDraft = jest.fn();
    expect(avaPhaseInputDraftLeadingActions(0, onDraft)).toEqual([]);
    expect(onDraft).not.toHaveBeenCalled();
  });

  it("keeps P0's dock free of the drafting action once composed", () => {
    // `avaSuggestedActions` places leading actions FIRST and keeps three, so an
    // action handed in is always rendered; the only way P0 shows none is for the
    // leading list to be empty.
    const composed = avaSuggestedActions(
      ["Which trigger made this urgent?", "Who owns the outcome?"],
      avaPhaseInputDraftLeadingActions(0, () => {}),
    );
    expect(composed.map((action) => action.id)).not.toContain(
      AVA_PHASE_INPUT_DRAFT_ACTION_ID,
    );
    expect(composed).toHaveLength(2);
  });

  it("keeps the drafting action first in a draftable phase's dock", () => {
    const composed = avaSuggestedActions(
      ["Which trigger made this urgent?", "Who owns the outcome?", "q3", "q4"],
      avaPhaseInputDraftLeadingActions(2, () => {}),
    );
    expect(composed[0].id).toBe(AVA_PHASE_INPUT_DRAFT_ACTION_ID);
    expect(composed).toHaveLength(3);
  });
});
