// Intelligence legacy-route redirect tests.
//
// The "sunset legacy surfaces" change deleted the entire legacy
// `src/app/intelligence/*` leaf-route tree (quality, patterns, signals,
// solutions, map, topics, brief, author, synthesize, context-demo,
// failure-modes) while `/intelligence` was reshaped into the canonical
// advisory-board surface (`src/app/(maestro)/intelligence/page.tsx`).
//
// No redirects were added for the deleted leaf paths, so every bookmarked
// `/intelligence/<leaf>` URL 404s — and the knowledge Quality lens in
// particular rendered a BLANK main-content zone in stale deployments
// (the two-panel AgentColumn layout stacked vertically and pushed the
// content ~3200px below the fold). We reconcile this at the config level
// by redirecting the dead leaf routes onto the working advisory surface.
//
// Pure file-shape check — reads next.config.ts as text and asserts the
// redirect entries are present. No Next.js runtime, no server, no auth.
//
// Compatibility guard: `/intelligence/ask` used to be a parallel Intelligence
// page route, but the canonical page is now `/intelligence` while the shared
// ask engine remains `/api/intelligence/ask`. Old links and post-deploy crawl
// probes must redirect to the working advisory surface instead of 404ing.

import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const NEXT_CONFIG_PATH = path.join(REPO_ROOT, 'next.config.ts');

function readConfig(): string {
  return fs.readFileSync(NEXT_CONFIG_PATH, 'utf8');
}

// Leaf paths deleted by the sunset that MUST land on /intelligence.
const REDIRECTED_LEAVES = [
  '/intelligence/quality',
  '/intelligence/patterns',
  '/intelligence/signals',
  '/intelligence/solutions',
  '/intelligence/map',
  '/intelligence/topics',
  '/intelligence/brief',
  '/intelligence/author',
  '/intelligence/synthesize',
  '/intelligence/context-demo',
];

describe('Intelligence legacy-route redirects (next.config.ts)', () => {
  const config = readConfig();

  it('exists and defines an async redirects() function', () => {
    expect(config).toContain('async redirects()');
  });

  it.each(REDIRECTED_LEAVES)(
    'redirects sunset leaf %s to the canonical /intelligence advisory surface',
    (leaf) => {
      // Assert a redirect entry with this exact source landing on /intelligence.
      const entry = new RegExp(
        `source:\\s*'${leaf.replace(/[/]/g, '\\/')}'\\s*,\\s*destination:\\s*'/intelligence'`,
      );
      expect(config).toMatch(entry);
    },
  );

  it('redirects the blank-content Quality lens specifically', () => {
    // The reported live symptom: /intelligence/quality showed a blank
    // main-content zone. It must now resolve to the working surface.
    expect(config).toMatch(
      /source:\s*'\/intelligence\/quality'\s*,\s*destination:\s*'\/intelligence'/,
    );
    // ...including any deeper sub-path under the retired quality lens.
    expect(config).toMatch(
      /source:\s*'\/intelligence\/quality\/:path\*'\s*,\s*destination:\s*'\/intelligence'/,
    );
  });

  it('redirects /intelligence/ask compatibility URLs to the canonical surface', () => {
    expect(config).toMatch(
      /source:\s*'\/intelligence\/ask'\s*,\s*destination:\s*'\/intelligence'/,
    );
    expect(config).toMatch(
      /source:\s*'\/intelligence\/ask\/:path\*'\s*,\s*destination:\s*'\/intelligence'/,
    );
  });

  it('does NOT add a catch-all /intelligence/:path* redirect (would shadow ask + future sub-routes)', () => {
    expect(config).not.toMatch(
      /source:\s*'\/intelligence\/:path\*'/,
    );
  });
});
