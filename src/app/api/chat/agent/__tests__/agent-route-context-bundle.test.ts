/**
 * /api/chat/agent · context-bundle wiring · CB-6
 *
 * The route is large and depends on Anthropic SDK + many tools, so a
 * full-stack POST integration test would be heavy and brittle. This
 * test pins the load-bearing wiring decisions:
 *
 *   1. The route IMPORTS the broker, mode-inference helpers, and
 *      `clientKeyToInventorySubstrateKey`.
 *   2. The route DEFINES `assembleContextBundleForTurn` and
 *      `readClientSuppliedMode`.
 *   3. The route EMITS the artifact via the `[[artifact:context-bundle]]`
 *      sentinel grammar before `runToolUseLoop`.
 *   4. The route prefers a client-supplied mode when valid; falls back
 *      to `inferModeForSurface` otherwise.
 *
 * Mode-inference itself is unit-tested in
 * `src/lib/knowledge/context-broker/__tests__/mode-inference.test.ts`.
 */

import fs from "node:fs";
import path from "node:path";

function readRoute(): string {
  return fs.readFileSync(
    path.join(process.cwd(), "src/app/api/chat/agent/route.ts"),
    "utf8",
  );
}

function compactSource(source: string): string {
  return source.replace(/\s+/g, " ");
}

describe("agent route · CB-6 context-bundle wiring", () => {
  const source = readRoute();
  const compact = compactSource(source);

  it("imports the context broker", () => {
    expect(source).toContain(
      'import { getContextBroker } from "@/lib/knowledge/context-broker"',
    );
  });

  it("imports the mode-inference helpers", () => {
    expect(source).toContain("inferModeForSurface");
    expect(source).toContain("isBrokerMode");
    expect(source).toContain("isModeValidForAuth");
    expect(source).toMatch(
      /from "@\/lib\/knowledge\/context-broker\/mode-inference"/,
    );
  });

  it("imports clientKeyToInventorySubstrateKey for the broker tenant key", () => {
    expect(source).toContain("clientKeyToInventorySubstrateKey");
  });

  it("reads contextBundleMode off surfaceContext via readClientSuppliedMode", () => {
    expect(source).toContain("function readClientSuppliedMode(");
    expect(source).toContain("surfaceContext.contextBundleMode");
  });

  it("uses the viewed phase canvas for phase-pack prompting when present", () => {
    expect(source).toContain("function readPromptPhaseFromSurfaceContext(");
    expect(source).toMatch(
      /const viewedPhase\s*=\s*readPromptPhaseFromSurfaceContext\(\s*surfaceContext,\s*stage,?\s*\)/,
    );
    expect(source).toMatch(
      /const promptPhase\s*=\s*viewedPhase\s*\?\?\s*currentPhase/,
    );
    expect(source).toContain("Viewed phase canvas: P${viewedPhase}");
    expect(source).toContain("const pack = getPhasePack(promptPhase)");
  });

  it("falls back to inferModeForSurface when the client mode is invalid", () => {
    // The client-supplied mode wins ONLY if isModeValidForAuth(...) accepts it.
    expect(source).toMatch(
      /requestedMode && isModeValidForAuth\(requestedMode, brokerTenantKey\)\s*\?\s*requestedMode\s*:\s*inferModeForSurface\(/,
    );
  });

  it("assembles the bundle and serializes it as a context-bundle artifact", () => {
    expect(source).toContain("async function assembleContextBundleForTurn(");
    expect(source).toContain("await getContextBroker().assemble({");
    expect(source).toMatch(
      /\[\[artifact:context-bundle\]\]\$\{json\}\[\[\/artifact\]\]/,
    );
  });

  it("emits the artifact at the START of the response stream", () => {
    // The enqueue must precede `runToolUseLoop` inside the readable's start.
    const startIdx = source.indexOf("async start(controller)");
    const enqueueIdx = source.indexOf(
      "controller.enqueue(\n          encoder.encode(demoSafeClientText(contextBundleArtifact)),\n        )",
    );
    const loopIdx = source.indexOf("await runToolUseLoop({");
    expect(startIdx).toBeGreaterThan(-1);
    expect(enqueueIdx).toBeGreaterThan(startIdx);
    expect(enqueueIdx).toBeLessThan(loopIdx);
  });

  it("uses the expanded program-surface token budget for Nexus program turns", () => {
    expect(source).toContain("const PROGRAM_AGENT_RESPONSE_MAX_TOKENS = 4096");
    expect(source).toContain(
      "function getAgentResponseTokenBudget(surface: string): number",
    );
    expect(source).toMatch(/surface === ["']\/programs\/new["']/);
    expect(source).toMatch(/surface\.startsWith\(["']\/programs\/["']\)/);
    expect(source).toContain("maxTokens: getAgentResponseTokenBudget(surface)");
  });

  it("uses the expanded Source token budget for deep sourcing answers", () => {
    expect(source).toContain("const SOURCE_AGENT_RESPONSE_MAX_TOKENS = 4096");
    expect(source).toMatch(/surface === ["']\/source["']/);
    expect(source).toMatch(/surface\.startsWith\(["']\/source\/["']\)/);
    expect(source).toContain("return SOURCE_AGENT_RESPONSE_MAX_TOKENS");
  });

  it("forces explicit Programs deliverable save requests through the persistence tool", () => {
    expect(source).toContain("function selectInitialDeliverableToolChoice(");
    expect(source).toMatch(/toolNames\.has\(["']complete_deliverable["']\)/);
    expect(source).toMatch(/name:\s*["']complete_deliverable["']/);
    expect(source).toContain("initialToolChoice,");
  });

  it("routes multi-deliverable phase packages through the batch persistence tool", () => {
    expect(source).toContain("completeDeliverables");
    expect(source).toContain("PROGRAM_MULTI_DELIVERABLE_RE");
    expect(source).toMatch(/toolNames\.has\(["']complete_deliverables["']\)/);
    expect(source).toMatch(/name:\s*["']complete_deliverables["']/);
    expect(source).toContain("MULTI-ARTIFACT PACKAGE DISCIPLINE");
  });

  it("instructs Programs deliverables to preserve uploaded baseline values exactly", () => {
    expect(source).toContain("BASELINE FIDELITY DISCIPLINE");
    expect(source).toContain("preserve exact non-financial baseline values");
    expect(source).toContain("latest uploaded/signed evidence as controlling");
    expect(source).toContain("never invent operational metrics");
  });

  it("canonicalizes the active client key before Programs broker lookup", () => {
    expect(source).toContain(
      "tenantKey: clientKeyToBrokerTenantKey(activeClientKey)",
    );
  });

  it("instructs agents to keep new-program setup in the same canvas", () => {
    expect(source).toContain("CANVAS CONTINUITY");
    expect(source).toContain("do not navigate them to /programs/new");
    expect(source).toContain(
      "use lookup_person/register_placeholder_person/commit_program when available",
    );
  });

  it("hydrates eligible AgentDock small PDFs into native Claude document blocks", () => {
    expect(source).toContain("function extractAgentNativePdfRefs(");
    expect(source).toContain("surfaceContext.agentAttachments");
    expect(source).toContain(
      "async function buildAgentNativePdfContentBlocks(",
    );
    expect(source).toContain("getObjectStorageAdapter().download(");
    expect(source).toContain("AGENT_ATTACHMENT_BUCKET");
    expect(source).toContain('type: "document"');
    expect(source).toContain('media_type: "application/pdf"');
    expect(source).toContain('data: bytes.toString("base64")');
  });

  it("hydrates explicitly acknowledged raw-mode PDFs into native Claude document blocks", () => {
    expect(source).toContain("raw_mode_escape");
    expect(source).toContain("raw_mode_requested");
    expect(source).toContain("function readAgentRawModeRequested(");
    expect(source).toContain("function isRawModeNativePdfAllowed(");
    expect(source).toContain("AGENT_RAW_MODE_NATIVE_PDF_MAX_BYTES");
    expect(source).toContain("acknowledgement.acknowledged_at.length > 0");
    expect(source).toContain("acknowledgement.estimated_tokens_per_turn ===");
    expect(source).toContain(
      "acknowledgement.parser_bug_ticket_id === rawMode.parser_bug_ticket_id",
    );
  });

  it("fails the native-PDF route closed unless tenant, MIME, route, and byte checks pass", () => {
    expect(source).toContain('ref.mime !== "application/pdf"');
    expect(source).toContain("!smallDocAllowed && !rawModeAllowed");
    expect(source).toContain("ref.bytes >= maxBytes");
    expect(source).toContain(
      "ref.storage_path.startsWith(`${input.activeClientId}/`)",
    );
    expect(compact).toContain(
      "bytes.byteLength !== ref.bytes || bytes.byteLength >= maxBytes",
    );
  });

  it("passes native PDF blocks in the user message before the model loop", () => {
    const buildIdx = source.indexOf(
      "const nativePdfContentBlocks = await buildAgentNativePdfContentBlocks({",
    );
    const userMessageIdx = source.indexOf("const userMessage: MessageParam =");
    const loopIdx = source.indexOf("await runToolUseLoop({");
    expect(buildIdx).toBeGreaterThan(-1);
    expect(userMessageIdx).toBeGreaterThan(buildIdx);
    expect(userMessageIdx).toBeLessThan(loopIdx);
    expect(source).toContain("...nativePdfContentBlocks");
    expect(source).toContain(
      "messages: [...conversationHistory.slice(-10), userMessage]",
    );
  });

  it("locks the corrected P4-P6 lifecycle labels in the Nexus prompt", () => {
    expect(source).toContain("LIFECYCLE LABEL DISCIPLINE");
    expect(source).toContain(
      "never call P4 'Build', P5 'Activate', or P6 'Operate'",
    );
    expect(source).toContain("P4 Execution Roadmap");
    expect(source).toContain("P5 Approval & Mobilization");
    expect(source).toContain("P6 Tower Handoff");
    expect(source).toContain("completion is a lifecycle_state write");
  });

  it("short-circuits cross-tenant program writes before model/tool execution", () => {
    const guardIdx = source.indexOf("detectCrossTenantWriteIntent({");
    const alertIdx = source.indexOf("recordTenantBleedAlert({");
    const refusalIdx = source.indexOf(
      "formatCrossTenantWriteRefusal(crossTenantWriteIntent)",
    );
    const loopIdx = source.indexOf("await runToolUseLoop({");
    expect(guardIdx).toBeGreaterThan(-1);
    expect(alertIdx).toBeGreaterThan(guardIdx);
    expect(alertIdx).toBeLessThan(refusalIdx);
    expect(refusalIdx).toBeGreaterThan(guardIdx);
    expect(refusalIdx).toBeLessThan(loopIdx);
    expect(compact).toMatch(/activeClientKey:\s*activeClientKey\s*\?\?\s*null/);
    expect(source).toContain("activeClientName: activeClientDisplayName");
    expect(source).toMatch(/route:\s*["']\/api\/chat\/agent["']/);
  });

  it("instructs Programs origination to ask one question and report record status clearly", () => {
    expect(source).toContain("PROGRAM ORIGINATION STYLE");
    expect(source).toContain("Ask at most ONE question per reply");
    expect(source).toContain("include 'type your own'");
    expect(source).toContain("Submitted for approval: <program name>");
    expect(source).toContain("Phase 0 unlocks after Setup approval");
  });

  it("catches assembly errors so the stream still proceeds", () => {
    expect(source).toContain("context_bundle_assembly_failed");
  });

  it("has a guarded L9 provider-overload drill path with graceful fallback copy", () => {
    expect(source).toMatch(
      /const L9_PROVIDER_OVERLOAD_DRILL_HEADER\s*=\s*["']x-abarva-l9-provider-drill-token["']/,
    );
    expect(source).toContain(
      "export function shouldRunProviderOverloadDrill(request: Request): boolean",
    );
    expect(source).toContain("AZURE_CONNECTIVITY_HEALTH_TOKEN");
    expect(source).toContain("throw new AgentProviderOverloadDrillError()");
    expect(source).toContain("isProviderOverloadLike(err)");
    expect(source).toContain("formatProviderOverloadFallback({");
    expect(source).toContain(
      "temporarily capacity-limited by the model provider",
    );
    expect(source).toContain("I have not changed tenant data");
    expect(source).toContain("[stream error: ${errMessage}]");
  });

  it("injects private-plane posture while preserving Nexus current-state grounding", () => {
    expect(source).toContain("PRIVATE DATA PLANE CONTEXT:");
    expect(source).toContain("CONTEXT BROKER RECEIPT:");
    expect(source).toContain("Private client facts:");
    expect(source).toContain("Shared AbarVa corpus/worldview chunks:");
    // Cross-Source-event leak guard (3rd attempt / #4602-#4605 follow-up)
    // threads a resolved event-scope guard into this call so
    // `enterprise_context_chunks` rows naming a DIFFERENT Source event never
    // reach the prompt — see source-ava-cross-event-leak-gate.test.ts.
    expect(source).toContain(
      "await buildTenantContextBlock(tenantInventoryKey, sourceEventScopeGuard)",
    );
    expect(source).toContain(
      "if (isTenantCurrentStateSurface && activeClientKey)",
    );
    expect(source).toContain(
      "await buildProgramsContextBundleAsync(brokerRequest)",
    );
    expect(source).not.toContain(
      "isNexusProgramsSurface && activeClient?.key && !privateDataPlane",
    );
  });

  it("keeps a server-resolved client key even when the database row is missing", () => {
    expect(source).toContain("const earlyActiveClientKey =");
    expect(compact).toMatch(
      /earlyActiveClient\?\.key\s*\?\?\s*\(?await getActiveClientKey\(\)\.catch\(\(\)\s*=>\s*null\)\)?/,
    );
    expect(source).toContain("const activeClientKey = earlyActiveClientKey");
    expect(compact).toMatch(
      /const effectiveClientKey\s*=\s*sourceClientKey\s*\?\?\s*activeClientKey\s*\?\?\s*null/,
    );
  });

  it("treats tenant current state as shared grounding for every canonical agent", () => {
    expect(source).toContain("let agentTenantContextBlock");
    expect(source).toContain("const isTenantCurrentStateSurface");
    expect(compact).toMatch(
      /const enterpriseAgentName\s*=\s*normalizeEnterpriseAgentName\(agentName\)/,
    );
    expect(source).toContain("agentName: enterpriseAgentName");
    expect(source).toContain("isStrategicMovesSurface(surface)");
    expect(compact).toMatch(
      /surface\.startsWith\(["']\/programs["']\)\s*\|\|\s*isStrategicMoveSurface\s*\|\|\s*surface\.startsWith\(["']\/moves["']\)/,
    );
    expect(source).toMatch(/["']system_landscape["']/);
    expect(source).toMatch(/["']financials["']/);
    expect(source).toMatch(/["']evidence_provenance["']/);
    expect(source).toContain(
      "If a persisted program/Move row, page context, broker block, or context-bundle receipt conflicts with demo context",
    );
  });

  it("injects user access policy and restricted financial output discipline", () => {
    expect(source).toContain("loadUserProgramAccessPolicy");
    expect(source).toContain("formatUserProgramAccessPolicyForPrompt");
    expect(source).toContain("formatRestrictedOutputPolicyForPrompt");
    expect(source).toContain("sanitizeRestrictedFinancialText");
    expect(source).toContain("summarizeFinancialValueForPrompt");
    expect(source).toContain("ACCESS DISCIPLINE");
    expect(source).toContain("exact financial details");
  });

  // CB-10 · graceful broker-throw fallback. Prior to CB-10 the route
  // returned `null` and silently skipped emitting the artifact, so the
  // panel could not distinguish "no retrieval needed" from "retrieval
  // errored." Now we always emit a placeholder generic bundle with the
  // failure as a warning.
  it("on broker throw, emits a placeholder generic bundle with a failure warning (CB-10)", () => {
    // assembleContextBundleForTurn returns a fallback bundle (no nullable union).
    expect(source).toMatch(
      /async function assembleContextBundleForTurn\([\s\S]*?\): Promise<import\("@\/lib\/knowledge\/context-broker"\)\.ContextBundle>/,
    );
    // Catch branch builds a placeholder bundle with mode 'generic'.
    expect(source).toMatch(/mode:\s*["']generic["']\s+as const/);
    // The placeholder warning copy explains the failure.
    expect(source).toContain("Context assembly failed:");
    expect(source).toContain("Answering without retrieved context.");
    // The placeholder is serialized through the shared artifact helper.
    expect(source).toContain("function serializeContextBundleArtifact(");
    expect(source).toMatch(
      /\[\[artifact:context-bundle\]\]\$\{json\}\[\[\/artifact\]\]/,
    );
  });
});
