/**
 * /api/chat/agent · context-bundle wiring · CB-6
 *
 * The route is large and depends on Anthropic SDK + many tools, so a
 * full-stack POST integration test would be heavy and brittle. This
 * test pins the load-bearing wiring decisions:
 *
 *   1. The route IMPORTS the broker, mode-inference helpers, and
 *      `clientKeyToInventorySubstrateKey`.
 *   2. The route DEFINES `assembleContextBundleArtifact` and
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
    expect(source).toContain('async function assembleContextBundleArtifact(');
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

  it('canonicalizes the active client key before Programs broker lookup', () => {
    expect(source).toContain('tenantKey: clientKeyToBrokerTenantKey(activeClient.key)');
  });

  it('instructs agents to keep new-program setup in the same canvas', () => {
    expect(source).toContain('CANVAS CONTINUITY');
    expect(source).toContain('do not navigate them to /programs/new');
    expect(source).toContain('use lookup_person/register_placeholder_person/commit_program when available');
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

  // CB-10 · graceful broker-throw fallback. Prior to CB-10 the route
  // returned `null` and silently skipped emitting the artifact, so the
  // panel could not distinguish "no retrieval needed" from "retrieval
  // errored." Now we always emit a placeholder generic bundle with the
  // failure as a warning.
  it('on broker throw, emits a placeholder generic bundle with a failure warning (CB-10)', () => {
    // assembleContextBundleArtifact returns Promise<string> (no nullable union).
    expect(source).toMatch(
      /async function assembleContextBundleArtifact\([\s\S]*?\): Promise<string>/,
    );
    // Catch branch builds a placeholder bundle with mode 'generic'.
    expect(source).toContain("mode: 'generic' as const");
    // The placeholder warning copy explains the failure.
    expect(source).toContain('Context assembly failed:');
    expect(source).toContain('Answering without retrieved context.');
    // The placeholder is also serialized via the same artifact envelope.
    expect(source).toMatch(
      /\[\[artifact:context-bundle\]\]\$\{JSON\.stringify\(fallback\)\}\[\[\/artifact\]\]/,
    );
  });
});
