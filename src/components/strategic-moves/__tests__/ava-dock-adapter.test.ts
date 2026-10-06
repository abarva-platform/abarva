import {
  avaThreadToDockMessages,
  avaSuggestedActions,
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
