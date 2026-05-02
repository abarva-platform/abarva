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

import fs from 'node:fs';
import path from 'node:path';

function readRoute(): string {
  return fs.readFileSync(
    path.join(
      process.cwd(),
      'src/app/api/chat/agent/route.ts',
    ),
    'utf8',
  );
}

describe('agent route · CB-6 context-bundle wiring', () => {
  const source = readRoute();

  it('imports the context broker', () => {
    expect(source).toContain(
      'import { getContextBroker } from "@/lib/knowledge/context-broker"',
    );
  });

  it('imports the mode-inference helpers', () => {
    expect(source).toContain('inferModeForSurface');
    expect(source).toContain('isBrokerMode');
    expect(source).toContain('isModeValidForAuth');
    expect(source).toMatch(/from "@\/lib\/knowledge\/context-broker\/mode-inference"/);
  });

  it('imports clientKeyToInventorySubstrateKey for the broker tenant key', () => {
    expect(source).toContain('clientKeyToInventorySubstrateKey');
  });

  it('reads contextBundleMode off surfaceContext via readClientSuppliedMode', () => {
    expect(source).toContain('function readClientSuppliedMode(');
    expect(source).toContain("surfaceContext.contextBundleMode");
  });

  it('uses the viewed phase canvas for phase-pack prompting when present', () => {
    expect(source).toContain('function readPromptPhaseFromSurfaceContext(');
    expect(source).toContain('const viewedPhase = readPromptPhaseFromSurfaceContext(surfaceContext, stage)');
    expect(source).toContain('const promptPhase = viewedPhase ?? currentPhase');
    expect(source).toContain('Viewed phase canvas: P${viewedPhase}');
    expect(source).toContain('const pack = getPhasePack(promptPhase)');
  });

  it('falls back to inferModeForSurface when the client mode is invalid', () => {
    // The client-supplied mode wins ONLY if isModeValidForAuth(...) accepts it.
    expect(source).toMatch(
      /requestedMode && isModeValidForAuth\(requestedMode, brokerTenantKey\)\s*\?\s*requestedMode\s*:\s*inferModeForSurface\(/,
    );
  });

  it('assembles the bundle and serializes it as a context-bundle artifact', () => {
    expect(source).toContain('async function assembleContextBundleForTurn(');
    expect(source).toContain('await getContextBroker().assemble({');
    expect(source).toMatch(
      /\[\[artifact:context-bundle\]\]\$\{json\}\[\[\/artifact\]\]/,
    );
  });

  it('emits the artifact at the START of the response stream', () => {
    // The enqueue must precede `runToolUseLoop` inside the readable's start.
    const startIdx = source.indexOf('async start(controller)');
    const enqueueIdx = source.indexOf(
      'controller.enqueue(encoder.encode(contextBundleArtifact))',
    );
    const loopIdx = source.indexOf('await runToolUseLoop({');
    expect(startIdx).toBeGreaterThan(-1);
    expect(enqueueIdx).toBeGreaterThan(startIdx);
    expect(enqueueIdx).toBeLessThan(loopIdx);
  });

  it('uses the expanded program-surface token budget for Nexus program turns', () => {
    expect(source).toContain('const PROGRAM_AGENT_RESPONSE_MAX_TOKENS = 4096');
    expect(source).toContain('function getAgentResponseTokenBudget(surface: string): number');
    expect(source).toContain("surface === '/programs/new'");
    expect(source).toContain("surface.startsWith('/programs/')");
    expect(source).toContain('maxTokens: getAgentResponseTokenBudget(surface)');
  });

  it('forces explicit Programs deliverable save requests through the persistence tool', () => {
    expect(source).toContain('function selectInitialDeliverableToolChoice(');
    expect(source).toContain("toolNames.has('complete_deliverable')");
    expect(source).toContain("name: 'complete_deliverable'");
    expect(source).toContain('initialToolChoice,');
  });

  it('routes multi-deliverable phase packages through the batch persistence tool', () => {
    expect(source).toContain('completeDeliverables');
    expect(source).toContain('PROGRAM_MULTI_DELIVERABLE_RE');
    expect(source).toContain("toolNames.has('complete_deliverables')");
    expect(source).toContain("name: 'complete_deliverables'");
    expect(source).toContain('MULTI-ARTIFACT PACKAGE DISCIPLINE');
  });

  it('instructs Programs deliverables to preserve uploaded baseline values exactly', () => {
    expect(source).toContain('BASELINE FIDELITY DISCIPLINE');
    expect(source).toContain('preserve exact non-financial baseline values');
    expect(source).toContain('latest uploaded/signed evidence as controlling');
    expect(source).toContain('never invent operational metrics');
  });

  it('canonicalizes the active client key before Programs broker lookup', () => {
    expect(source).toContain('tenantKey: clientKeyToBrokerTenantKey(activeClient.key)');
  });

  it('instructs agents to keep new-program setup in the same canvas', () => {
    expect(source).toContain('CANVAS CONTINUITY');
    expect(source).toContain('do not navigate them to /programs/new');
    expect(source).toContain('use lookup_person/register_placeholder_person/commit_program when available');
  });

  it('locks the corrected P4-P6 lifecycle labels in the Nexus prompt', () => {
    expect(source).toContain('LIFECYCLE LABEL DISCIPLINE');
    expect(source).toContain("never call P4 'Build', P5 'Activate', or P6 'Operate'");
    expect(source).toContain('P4 Execution Roadmap');
    expect(source).toContain('P5 Approval & Mobilization');
    expect(source).toContain('P6 Tower Handoff');
    expect(source).toContain('completion is a lifecycle_state write');
  });

  it('short-circuits cross-tenant program writes before model/tool execution', () => {
    const guardIdx = source.indexOf('detectCrossTenantWriteIntent({');
    const refusalIdx = source.indexOf('formatCrossTenantWriteRefusal(crossTenantWriteIntent)');
    const loopIdx = source.indexOf('await runToolUseLoop({');
    expect(guardIdx).toBeGreaterThan(-1);
    expect(refusalIdx).toBeGreaterThan(guardIdx);
    expect(refusalIdx).toBeLessThan(loopIdx);
    expect(source).toContain('activeClientKey: activeClient?.key ?? null');
    expect(source).toContain('activeClientName: activeClientDisplayName');
  });

  it('instructs Programs origination to ask one question and report record status clearly', () => {
    expect(source).toContain('PROGRAM ORIGINATION STYLE');
    expect(source).toContain('Ask at most ONE question per reply');
    expect(source).toContain("include 'type your own'");
    expect(source).toContain('Created record: <program name>');
    expect(source).toContain('Phase 0 unlocks after tenant-admin approval');
  });

  it('catches assembly errors so the stream still proceeds', () => {
    expect(source).toContain('context_bundle_assembly_failed');
  });

  it('injects a private-plane broker receipt into the prompt and suppresses legacy tenant block for private tenants', () => {
    expect(source).toContain('PRIVATE DATA PLANE CONTEXT:');
    expect(source).toContain('CONTEXT BROKER RECEIPT:');
    expect(source).toContain('Private client facts:');
    expect(source).toContain('Shared AbarVa corpus/worldview chunks:');
    expect(source).toMatch(/const tenantSystemBlock =\s*privateDataPlane\s*\?/);
    expect(source).toContain('isNexusProgramsSurface && activeClient?.key && !privateDataPlane');
  });

  it('injects user access policy and restricted financial output discipline', () => {
    expect(source).toContain('loadUserProgramAccessPolicy');
    expect(source).toContain('formatUserProgramAccessPolicyForPrompt');
    expect(source).toContain('formatRestrictedOutputPolicyForPrompt');
    expect(source).toContain('sanitizeRestrictedFinancialText');
    expect(source).toContain('summarizeFinancialValueForPrompt');
    expect(source).toContain('ACCESS DISCIPLINE');
    expect(source).toContain('exact financial details');
  });

  // CB-10 · graceful broker-throw fallback. Prior to CB-10 the route
  // returned `null` and silently skipped emitting the artifact, so the
  // panel could not distinguish "no retrieval needed" from "retrieval
  // errored." Now we always emit a placeholder generic bundle with the
  // failure as a warning.
  it('on broker throw, emits a placeholder generic bundle with a failure warning (CB-10)', () => {
    // assembleContextBundleForTurn returns a fallback bundle (no nullable union).
    expect(source).toMatch(
      /async function assembleContextBundleForTurn\([\s\S]*?\): Promise<import\("@\/lib\/knowledge\/context-broker"\)\.ContextBundle>/,
    );
    // Catch branch builds a placeholder bundle with mode 'generic'.
    expect(source).toContain("mode: 'generic' as const");
    // The placeholder warning copy explains the failure.
    expect(source).toContain('Context assembly failed:');
    expect(source).toContain('Answering without retrieved context.');
    // The placeholder is serialized through the shared artifact helper.
    expect(source).toContain('function serializeContextBundleArtifact(');
    expect(source).toMatch(
      /\[\[artifact:context-bundle\]\]\$\{json\}\[\[\/artifact\]\]/,
    );
  });
});
