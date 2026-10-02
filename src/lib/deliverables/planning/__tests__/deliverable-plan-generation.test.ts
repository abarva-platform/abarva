import type { GovernedToolCall } from "@/lib/visual-system/architecture-generation";
import type { DeliverablePlan } from "../deliverable-plan";
import {
  DELIVERABLE_PLAN_MAX_TOKENS,
  DELIVERABLE_PLAN_RETRY_MAX_TOKENS,
  DELIVERABLE_PLAN_TOOL,
  buildDeliverablePlanUserMessage,
  generateDeliverablePlan,
  missingPlanFields,
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

  it("turns malformed partial output into validation errors, not a TypeError", async () => {
    const call: GovernedToolCall = async () => ({
      toolInput: {
        artifactType: "target_state_architecture",
        audience: "cio",
        majorGaps: [{ id: "g1", observation: "Fragmented operations." }],
      },
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
    ).rejects.toThrow(/ended early twice without required fields/i);
  });

  it("repairs a missing reader takeaway from the target hypothesis", async () => {
    const partial: Partial<DeliverablePlan> = { ...VALID_PLAN };
    delete partial.readerTakeaway;
    const call: GovernedToolCall = async () => ({
      toolInput: partial,
      modelId: "m",
    });

    const out = await generateDeliverablePlan(
      {
        artifactType: "target_state_architecture",
        audience: "cio",
        decisionPurpose: "Align.",
        client: "SkyHarbor Air",
        initiative: "IROPS Agentic Response",
        contextText: "ctx",
        requireGapChain: true,
      },
      call,
    );

    expect(out.plan.readerTakeaway).toBe(VALID_PLAN.targetStateHypothesis);
    expect(out.issues.some((i) => i.level === "error")).toBe(false);
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

  // A plan cut off at the output limit arrives as a well-formed object with
  // its LATER fields missing. Validated as complete, that reads as a verdict on
  // the plan's reasoning. These pin that the cut-off is recognised for what it
  // is, retried with room to finish, and reported honestly if it still fails.
  describe("output cut off at the token limit", () => {
    const REQUEST = {
      artifactType: "target_state_architecture",
      audience: "cio",
      decisionPurpose: "Align on architecture.",
      client: "Client",
      initiative: "Initiative",
      contextText: "Context.",
      requireGapChain: true,
    };
    // What the streaming client hands back when the model stops mid-object:
    // everything up to the cut, nothing after.
    const TRUNCATED: Partial<DeliverablePlan> = {
      artifactType: VALID_PLAN.artifactType,
      audience: VALID_PLAN.audience,
      decisionPurpose: VALID_PLAN.decisionPurpose,
      storyline: VALID_PLAN.storyline,
      currentStateInterpretation: VALID_PLAN.currentStateInterpretation,
      majorGaps: VALID_PLAN.majorGaps,
      targetStateHypothesis: VALID_PLAN.targetStateHypothesis,
      requiredDecisions: VALID_PLAN.requiredDecisions,
    };

    it("retries once with a larger budget and returns the completed plan", async () => {
      const budgets: number[] = [];
      const call: GovernedToolCall = async ({ maxTokens }) => {
        budgets.push(maxTokens);
        return budgets.length === 1
          ? { toolInput: TRUNCATED, modelId: "m", stopReason: "max_tokens" }
          : { toolInput: VALID_PLAN, modelId: "m", stopReason: "tool_use" };
      };

      const out = await generateDeliverablePlan(REQUEST, call);

      expect(budgets).toEqual([
        DELIVERABLE_PLAN_MAX_TOKENS,
        DELIVERABLE_PLAN_RETRY_MAX_TOKENS,
      ]);
      expect(out.plan.narrativeSequence).toHaveLength(3);
    });

    it("reports the cut-off, not a reasoning failure, when the retry is also cut off", async () => {
      const call: GovernedToolCall = async () => ({
        toolInput: TRUNCATED,
        modelId: "m",
        stopReason: "max_tokens",
      });

      const failure = generateDeliverablePlan(REQUEST, call);
      await expect(failure).rejects.toThrow(
        /cut off at the \d+-token output limit/,
      );
      await expect(failure).rejects.not.toThrow(/Story spine|planned exhibits/);
    });

    it("does not retry a response with every field present, even an invalid one", async () => {
      let calls = 0;
      const call: GovernedToolCall = async () => {
        calls += 1;
        return {
          toolInput: {
            ...VALID_PLAN,
            narrativeSequence: [VALID_PLAN.narrativeSequence[0]],
          },
          modelId: "m",
          stopReason: "tool_use",
          outputTokens: 900,
        };
      };

      await expect(generateDeliverablePlan(REQUEST, call)).rejects.toThrow(
        /Story spine has fewer than 3 beats\. \(stop reason: tool_use, 900 output tokens\)/,
      );
      expect(calls).toBe(1);
    });

    it("gives the plan more room than the budget that was being exhausted", () => {
      expect(DELIVERABLE_PLAN_MAX_TOKENS).toBeGreaterThan(5000);
      expect(DELIVERABLE_PLAN_RETRY_MAX_TOKENS).toBeGreaterThan(
        DELIVERABLE_PLAN_MAX_TOKENS,
      );
    });

    it("scales the retry from a caller-supplied budget", async () => {
      const budgets: number[] = [];
      const call: GovernedToolCall = async ({ maxTokens }) => {
        budgets.push(maxTokens);
        return budgets.length === 1
          ? { toolInput: TRUNCATED, modelId: "m", stopReason: "max_tokens" }
          : { toolInput: VALID_PLAN, modelId: "m", stopReason: "tool_use" };
      };
      await generateDeliverablePlan({ ...REQUEST, maxTokens: 20_000 }, call);
      expect(budgets).toEqual([20_000, 40_000]);
    });
  });
  // Observed on a deployed build: the plan came back with its first fields
  // and nothing after them, and the stop reason was not `max_tokens`. The
  // streaming client returns the partial object as if it were whole, so it
  // was validated and reported as a plan with no target state, no decisions
  // and no exhibits. An earlier test here pinned "do not retry" for exactly
  // this input; that was the wrong behaviour to pin.
  describe("output that ends early for a reason other than the token limit", () => {
    const REQUEST = {
      artifactType: "target_state_architecture",
      audience: "cio",
      decisionPurpose: "Align on architecture.",
      client: "Client",
      initiative: "Initiative",
      contextText: "Context.",
      requireGapChain: true,
    };
    const ENDED_EARLY: Partial<DeliverablePlan> = {
      artifactType: VALID_PLAN.artifactType,
      audience: VALID_PLAN.audience,
      decisionPurpose: VALID_PLAN.decisionPurpose,
      storyline: VALID_PLAN.storyline,
      currentStateInterpretation: VALID_PLAN.currentStateInterpretation,
    };

    it("names the structural fields that were never emitted", () => {
      expect(missingPlanFields(ENDED_EARLY)).toEqual([
        "majorGaps",
        "targetStateHypothesis",
        "requiredDecisions",
        "requiredExhibits",
        "narrativeSequence",
      ]);
      expect(missingPlanFields(VALID_PLAN)).toEqual([]);
      expect(missingPlanFields(null)).toHaveLength(7);
      // Present but empty is weak, not missing.
      expect(
        missingPlanFields({ ...VALID_PLAN, requiredExhibits: [] }),
      ).toEqual([]);
    });

    it("retries once at the same budget, telling the model what was missing", async () => {
      const seen: Array<{ maxTokens: number; userMessage: string }> = [];
      const call: GovernedToolCall = async ({ maxTokens, userMessage }) => {
        seen.push({ maxTokens, userMessage });
        return seen.length === 1
          ? { toolInput: ENDED_EARLY, modelId: "m", stopReason: "end_turn" }
          : { toolInput: VALID_PLAN, modelId: "m", stopReason: "tool_use" };
      };

      const out = await generateDeliverablePlan(REQUEST, call);

      expect(seen.map((c) => c.maxTokens)).toEqual([
        DELIVERABLE_PLAN_MAX_TOKENS,
        DELIVERABLE_PLAN_MAX_TOKENS,
      ]);
      expect(seen[0].userMessage).not.toContain("previous attempt");
      expect(seen[1].userMessage).toContain(
        "ended before these required fields were emitted: majorGaps, targetStateHypothesis, requiredDecisions, requiredExhibits, narrativeSequence",
      );
      expect(out.plan.requiredExhibits).toHaveLength(1);
    });

    it("reports both stop reasons, not a reasoning failure, when the retry also ends early", async () => {
      let calls = 0;
      const call: GovernedToolCall = async () => {
        calls += 1;
        return {
          toolInput: ENDED_EARLY,
          modelId: "m",
          stopReason: calls === 1 ? "refusal" : null,
          outputTokens: calls === 1 ? 412 : undefined,
        };
      };

      const failure = generateDeliverablePlan(REQUEST, call);
      await expect(failure).rejects.toThrow(
        /ended early twice without required fields \(majorGaps, targetStateHypothesis, requiredDecisions, requiredExhibits, narrativeSequence\); first attempt stop reason: refusal, 412 output tokens; second attempt stop reason: not reported\./,
      );
      await expect(failure).rejects.not.toThrow(
        /No target-state hypothesis|Story spine/,
      );
      expect(calls).toBe(2);
    });

    it("reports the policy category and explanation the provider gave for a refusal", async () => {
      const call: GovernedToolCall = async () => ({
        toolInput: ENDED_EARLY,
        modelId: "m",
        stopReason: "refusal",
        outputTokens: 3832,
        stopDetails: { category: "cyber", explanation: "Flagged by policy." },
      });

      await expect(generateDeliverablePlan(REQUEST, call)).rejects.toThrow(
        /first attempt stop reason: refusal, 3832 output tokens, policy category: cyber, provider explanation: Flagged by policy\.;/,
      );
    });

    it("says so when a refusal names no category", async () => {
      const call: GovernedToolCall = async () => ({
        toolInput: ENDED_EARLY,
        modelId: "m",
        stopReason: "refusal",
        stopDetails: { category: null, explanation: null },
      });

      await expect(generateDeliverablePlan(REQUEST, call)).rejects.toThrow(
        /stop reason: refusal, policy category: not named;/,
      );
    });

    it("validates the retried plan like any other", async () => {
      let calls = 0;
      const call: GovernedToolCall = async () => {
        calls += 1;
        return calls === 1
          ? { toolInput: ENDED_EARLY, modelId: "m", stopReason: "end_turn" }
          : {
              toolInput: { ...VALID_PLAN, requiredDecisions: [] },
              modelId: "m",
              stopReason: "tool_use",
            };
      };

      await expect(generateDeliverablePlan(REQUEST, call)).rejects.toThrow(
        /failed validation: No required decisions/,
      );
      expect(calls).toBe(2);
    });
  });
});
