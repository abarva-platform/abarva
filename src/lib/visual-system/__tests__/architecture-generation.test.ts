import {
  generateArchitectureModel,
  buildArchitectureUserMessage,
  ARCHITECTURE_TOOL,
  type GovernedToolCall,
} from "../architecture-generation";
import { buildGroundedArchitectureFallback } from "../architecture-fallback";
import { validateArchitectureModel } from "../architecture-model";
import {
  deriveArchitectureContractSignals,
  renderArchitectureHtml,
} from "../architecture-html-renderer";
import { FIRST_CAPITAL_ARCHITECTURE } from "../__fixtures__/first-capital-architecture";

describe("architecture generation pass (governed, tenant-agnostic)", () => {
  it("validates and returns a well-formed generated model", async () => {
    const call: GovernedToolCall = async () => ({
      toolInput: FIRST_CAPITAL_ARCHITECTURE,
      modelId: "claude-opus-4-8",
    });
    const out = await generateArchitectureModel(
      {
        engagement: "X",
        client: "Y",
        contextText: "grounding…",
      },
      call,
    );
    expect(out.model.target.nodes.length).toBeGreaterThan(0);
    expect(out.issues.some((i) => i.level === "error")).toBe(false);
    expect(out.modelId).toBe("claude-opus-4-8");
  });

  it("rejects a model that fails referential validation (no silent pass)", async () => {
    const broken = {
      ...FIRST_CAPITAL_ARCHITECTURE,
      target: {
        ...FIRST_CAPITAL_ARCHITECTURE.target,
        flows: [
          { id: "x", from: "ghost", to: "alsoghost", kind: "data" as const },
        ],
      },
    };
    const call: GovernedToolCall = async () => ({
      toolInput: broken,
      modelId: "m",
    });
    await expect(
      generateArchitectureModel(
        { engagement: "X", client: "Y", contextText: "c" },
        call,
      ),
    ).rejects.toThrow(/failed validation/i);
  });

  it("declares missing generated agent bindings as target agent nodes before validation", async () => {
    const generated = {
      ...FIRST_CAPITAL_ARCHITECTURE,
      agentic: [
        ...(FIRST_CAPITAL_ARCHITECTURE.agentic ?? []),
        {
          agentId: "agt-consolidator",
          role: "Consolidates disrupted-event context for human review",
          callsTools: ["t_vec"],
          grounding: ["t_lake"],
          guardrails: ["t_mrisk"],
          humanInLoop: "Operations lead approves every recommendation",
        },
      ],
    };
    const call: GovernedToolCall = async () => ({
      toolInput: generated,
      modelId: "m",
    });

    const out = await generateArchitectureModel(
      { engagement: "X", client: "Y", contextText: "c" },
      call,
    );

    expect(
      out.model.target.nodes.find((node) => node.id === "agt-consolidator"),
    ).toMatchObject({
      kind: "agent",
      layer: "agentic",
      status: "new",
    });
    expect(out.issues.some((issue) => issue.level === "error")).toBe(false);
  });

  it("throws when the model returns no structured output", async () => {
    const call: GovernedToolCall = async () => ({
      toolInput: null,
      modelId: "m",
    });
    await expect(
      generateArchitectureModel(
        { engagement: "X", client: "Y", contextText: "c" },
        call,
      ),
    ).rejects.toThrow(/no structured model/i);
  });

  it("turns malformed partial output into validation errors, not a TypeError", async () => {
    const call: GovernedToolCall = async () => ({
      toolInput: {
        engagement: "IROPS",
        client: "SkyHarbor Air",
        decisionHeadline: "Approve recovery command architecture",
        current: { title: "Current", thesis: "Manual", flows: [] },
      },
      modelId: "m",
    });
    await expect(
      generateArchitectureModel(
        { engagement: "IROPS", client: "SkyHarbor Air", contextText: "c" },
        call,
      ),
    ).rejects.toThrow(
      /Current architecture state has no nodes|Missing target architecture state/i,
    );
  });

  it("passes the tool + system contract to the governed call (forced output)", async () => {
    let seen: { tool?: unknown; system?: string; maxTokens?: number } = {};
    const call: GovernedToolCall = async (p) => {
      seen = { tool: p.tool, system: p.system, maxTokens: p.maxTokens };
      return { toolInput: FIRST_CAPITAL_ARCHITECTURE, modelId: "m" };
    };
    await generateArchitectureModel(
      { engagement: "IROPS", client: "SkyHarbor Air", contextText: "ctx" },
      call,
    );
    expect(seen.tool).toBe(ARCHITECTURE_TOOL);
    expect(seen.system).toMatch(/never a generic default/i);
    expect(seen.maxTokens).toBe(32_000);
  });

  it("reports output truncation explicitly instead of misclassifying partial architecture", async () => {
    const call: GovernedToolCall = async () => ({
      toolInput: {
        engagement: "Commercial Lending Agent Assist",
        client: "First Capital Financial",
        currentStateFlow: [{ id: "s1", label: "Intake" }],
      },
      modelId: "m",
      stopReason: "max_tokens",
      outputTokens: 8_000,
    });

    await expect(
      generateArchitectureModel(
        {
          engagement: "Commercial Lending Agent Assist",
          client: "First Capital Financial",
          contextText: "grounded context",
        },
        call,
      ),
    ).rejects.toThrow(
      /truncated.*32,?000-token output limit.*8000 output tokens/i,
    );
  });

  it("builds a grounded user message", () => {
    const msg = buildArchitectureUserMessage({
      engagement: "IROPS Agentic Response",
      client: "SkyHarbor Air",
      contextText: "fleet of 240 aircraft…",
    });
    expect(msg).toContain("SkyHarbor Air");
    expect(msg).toContain("fleet of 240 aircraft");
  });

  it("builds a client-marked visual fallback that satisfies the architecture contract", () => {
    const model = buildGroundedArchitectureFallback({
      engagement: "IROPS Agentic Response",
      client: "SkyHarbor Air",
      contextText: "Current recovery decisions are fragmented.",
      failureReason: "Missing current architecture state.",
    });
    const issues = validateArchitectureModel(model);
    const html = renderArchitectureHtml(model);
    const signals = deriveArchitectureContractSignals(model, html);

    expect(issues.some((i) => i.level === "error")).toBe(false);
    expect(signals.hasStorySpine).toBe(true);
    expect(signals.currentStateVisualPresent).toBe(true);
    expect(signals.gapToTargetBridgePresent).toBe(true);
    expect(signals.conceptualArchPresent).toBe(true);
    expect(signals.logicalArchPresent).toBe(true);
    expect(signals.physicalArchPresent).toBe(true);
    expect(signals.exhibitsRenderedAsVisual).toBe(true);
    expect(model.openInputs?.join(" ")).toMatch(/confirm|validation/i);
    expect(html).toContain(
      '<tspan x="132" dy="0">Operational event</tspan><tspan x="132" dy="14">detected</tspan>',
    );
  });

  it("removes machinery vocabulary from plan-derived fallback text", () => {
    const model = buildGroundedArchitectureFallback({
      engagement: "IROPS Agentic Response",
      client: "SkyHarbor Air",
      contextText: "Current recovery decisions are fragmented.",
      plan: {
        artifactType: "target_state_architecture",
        audience: "cio",
        decisionPurpose: "Approve the architecture substrate.",
        storyline: "The current substrate must become governed.",
        currentStateInterpretation: "The source register is fragmented.",
        majorGaps: [
          {
            id: "g1",
            observation: "Context rows are scattered.",
            gap: "The substrate is not governed.",
            designImplication: "Build a safer substrate.",
          },
        ],
        targetStateHypothesis: "The target substrate supports decisions.",
        requiredDecisions: [],
        requiredExhibits: [],
        narrativeSequence: [],
        evidenceNeeded: [],
        missingInputs: ["Client to complete integration protocol."],
        assumptions: [],
        risks: [],
        readerTakeaway: "The reader understands the substrate.",
      },
    });
    const html = renderArchitectureHtml(model).toLowerCase();

    expect(html).not.toContain("substrate");
    expect(html).not.toContain("source register");
    expect(html).not.toContain("client to complete");
  });

  it("keeps the deterministic fallback industry-neutral for financial-services work", () => {
    const model = buildGroundedArchitectureFallback({
      engagement: "Commercial Lending Agent Assist",
      client: "First Capital Financial",
      contextText:
        "Bankers coordinate onboarding across CRM, loan origination, document, KYC, and core banking systems.",
      failureReason: "Structured generation unavailable.",
    });
    const html = renderArchitectureHtml(model).toLowerCase();

    expect(
      validateArchitectureModel(model).some((i) => i.level === "error"),
    ).toBe(false);
    expect(html).not.toMatch(
      /flight|crew|passenger|airport|disruption recovery/,
    );
    expect(html).toContain("system of engagement");
    expect(html).toContain("transaction system of record");
    expect(html).toContain("policy and knowledge");
    expect(html).toContain("open input");
  });
});
