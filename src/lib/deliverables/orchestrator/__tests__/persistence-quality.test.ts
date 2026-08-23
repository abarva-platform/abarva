// WIRE proof: the Deliverable Quality Contract is a blocking step in
// persistDeliverable. A failing artifact is NOT saved client-ready — it is
// quarantined as an internal draft. Tenant-agnostic; same path for every client.
import { persistDeliverable } from "../persistence";
import type { OrchestrationResult } from "../orchestrator";
import { getArtifactBrief } from "../artifact-brief-registry";
import { amsRfpRequest, goodDocument } from "../__fixtures__/ams-rfp";
import type { GeneratedArtifactRecord } from "@/lib/artifacts/repository";
import type { TenantAiPolicy } from "@/lib/integrations/ai-egress";
import { FIRST_CAPITAL_ARCHITECTURE } from "@/lib/visual-system/__fixtures__/first-capital-architecture";

const tenantPolicy = {} as TenantAiPolicy;

// An architecture deliverable requires rendered exhibits; the prose fixture has
// none that match — so the contract resolves blocked_missing_exhibits.
function archResult(): OrchestrationResult {
  const req = amsRfpRequest();
  const brief = {
    ...getArtifactBrief(req),
    deliverableType: "target_architecture",
  };
  return {
    ok: true,
    brief,
    document: goodDocument(),
    quality: { pass: true, blockers: [], warnings: [], metrics: {} as never },
    passTrace: [],
  } as OrchestrationResult;
}

async function persistWith(
  opts: Record<string, unknown>,
  result: OrchestrationResult = archResult(),
) {
  let rendered: Record<string, unknown> | undefined;
  const save = (async (_i: unknown, r: unknown) => {
    rendered = r as Record<string, unknown>;
    return {
      id: "a",
      clientId: "c1",
      metadata: {},
    } as unknown as GeneratedArtifactRecord;
  }) as never;
  await persistDeliverable(
    result,
    {
      clientId: "c1",
      renderedBy: "u1",
      sourceArtifactRef: "evt",
      tenantPolicy,
      ...opts,
    },
    { save },
  );
  return rendered!;
}

describe("persistDeliverable — quality contract enforcement", () => {
  it("quarantines a failing artifact as internal draft when enforcement is on", async () => {
    const rendered = await persistWith({ enforceQualityContract: true });
    expect(rendered.quarantined).toBe(true);
    // Architecture artifacts now fail the story-led/visual gate when the prose
    // path emits no current-state/story/visual signals — any blocked_* reason.
    expect(String(rendered.quarantineReason)).toMatch(/^blocked_/);
  });

  it("still quarantines visual-required architecture when observe-only would otherwise allow prose", async () => {
    const rendered = await persistWith({ enforceQualityContract: false });
    expect(rendered.quarantined).toBe(true);
    expect(String(rendered.quarantineReason)).toMatch(/^blocked_/);
  });

  it("renders the architecture exhibit when renderViaProfile + a model is supplied", async () => {
    const rendered = await persistWith({
      renderViaProfile: true,
      structuredModels: { architectureModel: FIRST_CAPITAL_ARCHITECTURE },
    });
    expect(rendered.outputFormat).toBe("pptx");
    expect(String(rendered.html)).toContain("Target state (to-be)");
    expect(String(rendered.html)).toContain(
      'data-exhibit="target_conceptual_architecture"',
    );
    expect(
      (String(rendered.html).match(/<svg\b/g) ?? []).length,
    ).toBeGreaterThanOrEqual(13);
  });

  it("preserves architecture visuals when the decision-storytelling deck flag is also on", async () => {
    const rendered = await persistWith({
      structuredModels: { architectureModel: FIRST_CAPITAL_ARCHITECTURE },
      renderViaProfile: true,
      renderAsDeck: true,
    });
    expect(String(rendered.html)).toContain(
      'data-exhibit="target_physical_deployment"',
    );
    expect(String(rendered.html)).toContain("Architecture thesis");
    expect(String(rendered.html)).not.toContain(
      "Use ← → to move through the deck",
    );
  });

  it("does not credit a structured model when the final HTML is prose-only", async () => {
    const rendered = await persistWith({
      enforceQualityContract: true,
      structuredModels: { architectureModel: FIRST_CAPITAL_ARCHITECTURE },
    });
    expect(rendered.quarantined).toBe(true);
    expect(String(rendered.html)).not.toContain(
      'data-exhibit="target_conceptual_architecture"',
    );
    expect(String(rendered.quarantineReason)).toMatch(/^blocked_/);
  });

  it("keeps Solution Design on its own five-view renderer instead of replacing it with Target Architecture", async () => {
    const solutionResult = archResult();
    solutionResult.brief = {
      ...solutionResult.brief,
      deliverableType: "solution_design",
    };
    solutionResult.document = {
      ...goodDocument(),
      exhibits: [
        "experience_flow",
        "agent_workflow",
        "exception_handling",
        "control_points",
        "data_flow",
      ].map((key) => ({
        key,
        title: key.replaceAll("_", " "),
        kind: "flow" as const,
        description: `Governed ${key.replaceAll("_", " ")} view.`,
        targetFormat: "html" as const,
      })),
    };

    const rendered = await persistWith(
      {
        deliverableTypeKey: "solution_design",
        renderViaProfile: true,
        structuredModels: { architectureModel: FIRST_CAPITAL_ARCHITECTURE },
      },
      solutionResult,
    );

    expect(String(rendered.html)).toContain("<strong>experience flow</strong>");
    expect(String(rendered.html)).toContain("<strong>data flow</strong>");
    expect(String(rendered.html).match(/<svg\b/g) ?? []).toHaveLength(5);
    expect(String(rendered.html)).not.toContain(
      'data-exhibit="target_conceptual_architecture"',
    );
  });
});
