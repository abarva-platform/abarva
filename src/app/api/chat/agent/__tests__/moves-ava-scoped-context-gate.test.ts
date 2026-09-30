/**
 * /api/chat/agent · Moves aVa scoped-context gate.
 *
 * A live P5 guidance smoke test found that a Move-scoped aVa answer could
 * blend in unrelated archetype evidence needs from broad tenant/program
 * context. Once the deterministic Moves grounding packet is present, the
 * model prompt must use that scoped packet plus Move-specific evidence/page
 * context, not generic tenant-wide broker blocks.
 */

import fs from "node:fs";
import path from "node:path";

function readRoute(): string {
  return fs.readFileSync(
    path.join(process.cwd(), "src/app/api/chat/agent/route.ts"),
    "utf8",
  );
}

describe("agent route · Moves aVa scoped-context gate", () => {
  const source = readRoute();

  it("suppresses generic context-bundle prompt input when Moves scoped grounding is present", () => {
    const derivation = source.slice(
      source.indexOf("const contextBundlePromptBlockForPrompt ="),
      source.indexOf("const contextBundlePromptBlockForPrompt =") + 420,
    );
    expect(derivation).toContain("movesAvaHardeningBlock.length > 0");
    expect(derivation).toContain("contextBundlePromptBlock");
  });

  it("suppresses the generic tenant broker block when Moves scoped grounding is present", () => {
    const derivation = source.slice(
      source.indexOf("const agentTenantContextBlockForPrompt ="),
      source.indexOf("const agentTenantContextBlockForPrompt =") + 460,
    );
    expect(derivation).toContain("movesAvaHardeningBlock.length > 0");
    expect(derivation).toContain("agentTenantContextBlock");
  });

  it("suppresses cross-program signals for a scoped Moves answer", () => {
    expect(source).toContain("const crossProgramSignalsBlockForPrompt =");
    const derivation = source.slice(
      source.indexOf("const crossProgramSignalsBlockForPrompt ="),
      source.indexOf("const crossProgramSignalsBlockForPrompt =") + 180,
    );
    expect(derivation).toContain("movesAvaHardeningBlock.length > 0");
    expect(derivation).toContain("crossProgramSignalsBlock");
  });

  it("counts visible Move context-extract evidence from surfaceContext before building the packet", () => {
    const resolverBlock = source.slice(
      source.indexOf("const surfaceContextEvidenceCount ="),
      source.indexOf("const visibleEvidenceCount =") + 420,
    );

    expect(resolverBlock).toContain(
      "surfaceContext.moveContextExtractEvidenceCount",
    );
    expect(resolverBlock).toContain("surfaceContext.moveEvidenceCount");
    expect(resolverBlock).toContain("surfaceContextEvidenceCount");
    expect(resolverBlock).toContain("resolveMovesAvaVisibleEvidenceCount");
  });

  it("loads only approved evidence scoped to the active phase for summaries and later-phase draft disclosures", () => {
    const modeStart = source.indexOf(
      'const mode = movesAvaMode ?? "phase_guidance";',
    );
    const evidenceLoadBlock = source.slice(
      modeStart,
      source.indexOf("const packet = buildMovesAvaChatPacket(", modeStart),
    );

    expect(modeStart).toBeGreaterThan(-1);
    expect(evidenceLoadBlock).toContain('mode === "evidence_summary"');
    expect(evidenceLoadBlock).toContain(
      'mode === "phase_input_draft" && promptPhase > 1',
    );
    expect(evidenceLoadBlock).toContain(
      "loadedEvidenceItems = await listProgramEvidenceForPrompt(",
    );
    expect(evidenceLoadBlock).toContain(
      "programId,\n                  promptPhase,",
    );
    expect(evidenceLoadBlock).toContain(
      "approvedEvidenceItems = loadedEvidenceItems.slice(0, 8)",
    );
    expect(source).toContain("approvedEvidenceCount: approvedEvidenceTotal");
    expect(source).toContain("approvedEvidenceUnavailable,");
    expect(source).toContain(
      "buildDeterministicMovesAvaStatusAnswer(packet, mode)",
    );
  });

  it("returns deterministic evidence summaries before Anthropic preflight", () => {
    const deterministicReturn = source.indexOf(
      "if (movesAvaDeterministicAnswer)",
    );
    const modelPreflight = source.indexOf(
      "const preflight = await preflightAnthropicDirectClient(",
    );

    expect(deterministicReturn).toBeGreaterThan(-1);
    expect(modelPreflight).toBeGreaterThan(deterministicReturn);
  });

  it("suppresses the generic tenant system block when Moves scoped grounding is present", () => {
    const derivation = source.slice(
      source.indexOf("const tenantSystemBlockForPrompt ="),
      source.indexOf("const tenantSystemBlockForPrompt =") + 460,
    );
    expect(derivation).toContain("movesAvaHardeningBlock.length > 0");
    expect(derivation).toContain("tenantSystemBlock");
  });

  it("injects only suppressible variants into the system prompt array", () => {
    const systemPromptArrayStart = source.indexOf("const systemPrompt = [");
    const systemPromptArrayEnd = source.indexOf(
      '.filter((s) => s !== "" && s !== undefined && s !== null)',
      systemPromptArrayStart,
    );
    expect(systemPromptArrayStart).toBeGreaterThan(-1);
    expect(systemPromptArrayEnd).toBeGreaterThan(systemPromptArrayStart);
    const arrayBody = source.slice(
      systemPromptArrayStart,
      systemPromptArrayEnd,
    );

    expect(arrayBody).toMatch(/\n\s*agentTenantContextBlockForPrompt,\n/);
    expect(arrayBody).toMatch(/\n\s*crossProgramSignalsBlockForPrompt,\n/);
    expect(arrayBody).toMatch(/\n\s*contextBundlePromptBlockForPrompt,\n/);
    expect(arrayBody).toMatch(/\n\s*tenantSystemBlockForPrompt,\n/);
    expect(arrayBody).not.toMatch(/\n\s*agentTenantContextBlock,\n/);
    expect(arrayBody).not.toMatch(/\n\s*crossProgramSignalsBlock,\n/);
    expect(arrayBody).not.toMatch(/\n\s*contextBundlePromptBlock,\n/);
    expect(arrayBody).not.toMatch(/\n\s*tenantSystemBlock,\n/);
  });
});
