/**
 * /api/chat/agent · Source aVa polish gate — Gap 1 wiring regression.
 *
 * The route is large and depends on the Anthropic SDK + many tools, so a
 * full-stack POST integration test would be heavy and brittle (see the
 * existing `agent-route-context-bundle.test.ts` / `source-l7-discipline.test.ts`
 * pattern this file follows). This test pins the load-bearing wiring for the
 * Gap 1 fix directly against the route source:
 *
 *   Live-found bug: "What evidence is missing?" asked on the RFP stage of a
 *   real Source event was answered with an unrelated cross-module risk item
 *   (a generic SOX/payment-approval control flag) instead of Source-event
 *   evidence readiness. Root-caused (not guessed, verified with a live
 *   classifier call — see answer-mode.test.ts's "Gap 1" describe block) to:
 *   the question classifies correctly to `evidence_readiness` and its
 *   Source-scoped grounding builds correctly, but the route ALSO
 *   unconditionally assembles a generic, tenant-wide `ContextBundle`
 *   (`getContextBroker().assemble` with mode 'full') via a keyword search
 *   independent of the active Source event, and injects it into the SAME
 *   system prompt as the correctly-scoped grounding — with nothing telling
 *   the model the generic block was off-topic. That generic content is the
 *   demonstrated leak vector for unrelated risk/compliance chunks.
 *
 *   Fix: once a grounded, non-passthrough Source answer mode has fired for
 *   this turn (`shouldSuppressGenericContextBundleForSourceMode`), the
 *   route drops the generic context-broker receipt from the PROMPT (the
 *   `context-bundle` artifact used by the reactive panel is untouched —
 *   this only affects what the model reads, not what the transparency
 *   panel shows).
 */

import fs from "node:fs";
import path from "node:path";

function readRoute(): string {
  return fs.readFileSync(
    path.join(process.cwd(), "src/app/api/chat/agent/route.ts"),
    "utf8",
  );
}

describe("agent route · Source aVa polish gate — Gap 1 (off-topic context-bundle leak)", () => {
  const source = readRoute();

  it("imports shouldSuppressGenericContextBundleForSourceMode from answer-mode", () => {
    expect(source).toContain("shouldSuppressGenericContextBundleForSourceMode");
    expect(source).toMatch(/from "@\/lib\/source\/ava\/answer-mode"/);
  });

  it("derives contextBundlePromptBlockForPrompt from the suppression predicate", () => {
    expect(source).toContain("const contextBundlePromptBlockForPrompt =");
    expect(source).toContain(
      "shouldSuppressGenericContextBundleForSourceMode(sourceAvaAnswerMode)",
    );
  });

  it("injects the SUPPRESSED variant (not the raw generic bundle) into the system prompt array", () => {
    // The raw `contextBundlePromptBlock` must still exist (it feeds the
    // reactive-panel artifact — see contextBundleArtifact below) but the
    // systemPrompt array must reference the derived, suppressible variant.
    expect(source).toContain("contextBundlePromptBlockForPrompt,");
  });

  it("still serializes the FULL (unsuppressed) bundle into the context-bundle artifact for the panel", () => {
    // The suppression is a prompt-only change: the reactive "Context
    // Assembled" panel must keep showing what the broker actually
    // retrieved, since that's diagnostic transparency, not model input.
    expect(source).toContain(
      "const contextBundleArtifact = serializeContextBundleArtifact(",
    );
    expect(source).toContain("contextBundleForOutput");
  });
});

describe("agent route · Source aVa contract optimization authority", () => {
  const source = readRoute();

  it("keeps single-contract grounding authoritative over the older event optimization block", () => {
    expect(source).toContain(
      "const contractGroundingIsAuthoritativeForMode =",
    );
    expect(source).toContain("hasSourceContractGrounding");
    expect(source).toContain(
      'modeClassification.mode === "contract_optimization"',
    );

    const groundingAppendStart = source.indexOf("if (");
    const authorityCheck = source.indexOf(
      "!contractGroundingIsAuthoritativeForMode",
      groundingAppendStart,
    );
    expect(authorityCheck).toBeGreaterThan(-1);
  });

  it("passes the single-contract block to the quality gate when it suppresses the event block", () => {
    expect(source).toContain(
      "contractGroundingIsAuthoritativeForMode\n            ? sourceContractGroundingBlock\n            : modeGrounding.block",
    );
  });
});

describe("agent route · Source aVa vendor-response grounding — Gap 2", () => {
  const source = readRoute();

  it("honors the top-level stage when the request omits surfaceContext.viewStage", () => {
    expect(source).toContain("const viewStageFromContext =");
    expect(source).toContain(
      'typeof surfaceContext.viewStage === "string" &&',
    );
    expect(source).toContain('typeof stage === "string" && stage.trim()');
    expect(source.indexOf('typeof stage === "string" && stage.trim()')).toBeGreaterThan(
      source.indexOf("surfaceContext.viewStage"),
    );
  });

  it("uses event-visible response profiles for unsupported-claim asks even after the event leaves Responses", () => {
    const visibleProfileStart = source.indexOf(
      "const visibleResponseProfileSet =",
    );
    const visibleProfileEnd = source.indexOf(
      "const hasVisibleResponseProfiles =",
      visibleProfileStart,
    );
    const visibleProfileBlock = source.slice(
      visibleProfileStart,
      visibleProfileEnd,
    );

    expect(visibleProfileStart).toBeGreaterThan(-1);
    expect(visibleProfileBlock).toContain(
      'modeClassification.mode === "vendor_comparison"',
    );
    expect(visibleProfileBlock).toContain(
      "looksLikeUnsupportedVendorResponseClaimQuestion(message)",
    );
    expect(visibleProfileBlock).toContain("buildVendorResponseMveProfiles");
    expect(visibleProfileBlock).not.toContain(
      'modeStageKey === "responses"',
    );
  });
});
