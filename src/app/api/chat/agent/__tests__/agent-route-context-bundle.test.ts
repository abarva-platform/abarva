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

  it('catches assembly errors so the stream still proceeds (returns null on error)', () => {
    expect(source).toContain('context_bundle_assembly_failed');
    expect(source).toMatch(/return null;\s*}\s*}/);
  });
});
