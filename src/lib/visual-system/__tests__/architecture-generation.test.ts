import {
  generateArchitectureModel,
  buildArchitectureUserMessage,
  ARCHITECTURE_TOOL,
  type GovernedToolCall,
} from "../architecture-generation";
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

  it("throws when the model returns no structured output", async () => {
    const call: GovernedToolCall = async () => ({ toolInput: null, modelId: "m" });
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
    ).rejects.toThrow(/Current architecture state has no nodes|Missing target architecture state/i);
  });

  it("passes the tool + system contract to the governed call (forced output)", async () => {
    let seen: { tool?: unknown; system?: string } = {};
    const call: GovernedToolCall = async (p) => {
      seen = { tool: p.tool, system: p.system };
      return { toolInput: FIRST_CAPITAL_ARCHITECTURE, modelId: "m" };
    };
    await generateArchitectureModel(
      { engagement: "IROPS", client: "SkyHarbor Air", contextText: "ctx" },
      call,
    );
    expect(seen.tool).toBe(ARCHITECTURE_TOOL);
    expect(seen.system).toMatch(/never a generic default/i);
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
});
