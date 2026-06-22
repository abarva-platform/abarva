import type { GovernedToolCall } from "@/lib/visual-system/architecture-generation";
import type { DeliverablePlan } from "../deliverable-plan";
import {
  DELIVERABLE_PLAN_TOOL,
  buildDeliverablePlanUserMessage,
  generateDeliverablePlan,
} from "../deliverable-plan-generation";

const VALID_PLAN: DeliverablePlan = {
  artifactType: "target_state_architecture",
  audience: "cio",
  decisionPurpose: "Align on future-state architecture.",
  storyline:
    "Current fragmentation becomes a governed AI-assisted decision system.",
  currentStateInterpretation:
    "The current state spreads decisions across teams, systems, and manual handoffs.",
  majorGaps: [
    {
      id: "g1",
      observation: "Operational recovery decisions are fragmented.",
      gap: "Shared context and decision telemetry are missing.",
      designImplication:
        "Create a governed context and decision layer before automating actions.",
    },
  ],
  targetStateHypothesis:
    "The target state gives teams a governed recommendation, approval, and action loop.",
  requiredDecisions: ["Approve the pilot decision boundary."],
  requiredExhibits: [
    {
      exhibit: "current_state_architecture",
      purpose: "Show current-state fragmentation.",
      soWhat:
        "The architecture must fix the decision loop, not only add a model.",
    },
  ],
  narrativeSequence: [
    { id: "b1", point: "Current decisions are fragmented." },
    { id: "b2", point: "The gap is missing context and telemetry." },
    { id: "b3", point: "The target state creates a governed decision system." },
  ],
  evidenceNeeded: [],
  missingInputs: [],
  assumptions: [],
  risks: [],
  readerTakeaway: "The reader can explain the current-to-target chain.",
};

describe("deliverable plan generation pass", () => {
  it("validates and returns a well-formed plan", async () => {
    const call: GovernedToolCall = async () => ({
      toolInput: VALID_PLAN,
      modelId: "claude-opus-4-8",
    });

    const out = await generateDeliverablePlan(
      {
        artifactType: "target_state_architecture",
        audience: "cio",
        decisionPurpose: "Align on architecture.",
        client: "SkyHarbor Air",
        initiative: "IROPS Agentic Response",
        contextText: "Current recovery decisions are fragmented.",
        requireGapChain: true,
      },
      call,
    );

    expect(out.plan.storyline).toMatch(/governed/i);
    expect(out.issues.some((i) => i.level === "error")).toBe(false);
  });

  it("rejects a broken gap chain", async () => {
    const broken = {
      ...VALID_PLAN,
      majorGaps: [
        {
          id: "g1",
          observation: "Fragmented today.",
          gap: "",
          designImplication: "",
        },
      ],
    };
    const call: GovernedToolCall = async () => ({
      toolInput: broken,
      modelId: "m",
    });

    await expect(
      generateDeliverablePlan(
        {
          artifactType: "target_state_architecture",
          audience: "cio",
          decisionPurpose: "Align.",
          client: "Client",
          initiative: "Move",
          contextText: "ctx",
          requireGapChain: true,
        },
        call,
      ),
    ).rejects.toThrow(/failed validation/i);
  });

  it("passes the forced plan tool to the governed call", async () => {
    let seenTool: unknown;
    const call: GovernedToolCall = async (params) => {
      seenTool = params.tool;
      return { toolInput: VALID_PLAN, modelId: "m" };
    };

    await generateDeliverablePlan(
      {
        artifactType: "target_state_architecture",
        audience: "cio",
        decisionPurpose: "Align.",
        client: "Client",
        initiative: "Move",
        contextText: "ctx",
      },
      call,
    );

    expect(seenTool).toBe(DELIVERABLE_PLAN_TOOL);
  });

  it("builds a grounded user message", () => {
    const msg = buildDeliverablePlanUserMessage({
      artifactType: "target_state_architecture",
      audience: "cio",
      decisionPurpose: "Align.",
      client: "SkyHarbor Air",
      initiative: "IROPS Agentic Response",
      contextText: "fleet ops context",
    });
    expect(msg).toContain("SkyHarbor Air");
    expect(msg).toContain("fleet ops context");
  });
});
