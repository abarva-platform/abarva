/**
 * Sentinel surface smoke test · PR-INT-F.
 *
 * The bug class this guards against: Surface 2 PR-G ("the
 * advance_phase tool was silently filtered off /programs/<id>
 * because the surface key arrived as 'programs-detail' instead of
 * '/programs/:id'"). With four Sentinel tools shipping in PR-INT-C
 * and PR-INT-E, the same bug class would mute all of Sentinel on
 * /intelligence — none of the artifact emissions would reach the
 * reactive panel because the agent would have no tools to call.
 *
 * This smoke confirms the seam holds end-to-end:
 *   1. The four Sentinel tool modules side-effect-register on import.
 *   2. canonicalizeFromBody('intelligence') → '/intelligence'
 *      (per PR-I + PR-INT-B).
 *   3. getRelevantTools('/intelligence') returns all four Sentinel
 *      tools (and only those — no Programs leakage).
 *
 * Live browser walk steps live in
 * docs/build/INTELLIGENCE_WALK_RUNBOOK.md.
 */

import { canonicalizeFromBody } from '@/lib/agent/surface';
import { getRelevantTools } from '@/lib/agent/tools/registry';

// Side-effect imports — same imports the chat agent route does. If
// any tool file regresses on registerTool(), this test fails noisily.
import '@/lib/agent/tools/intelligence/searchPatterns';
import '@/lib/agent/tools/intelligence/patternNeighborhood';
import '@/lib/agent/tools/intelligence/evidenceLookup';
import '@/lib/agent/tools/intelligence/validateSynthesis';

describe('Sentinel /intelligence surface · smoke', () => {
  it("canonicalizes semantic 'intelligence' to URL-shaped '/intelligence'", () => {
    expect(canonicalizeFromBody({ surface: 'intelligence' }).surface).toBe('/intelligence');
  });

  it('exposes all four Sentinel tools to /intelligence', () => {
    const names = getRelevantTools('/intelligence')
      .map((tool) => tool.name)
      .sort();
    expect(names).toEqual(
      [
        'evidence_lookup',
        'pattern_neighborhood',
        'search_patterns',
        'validate_synthesis',
      ].sort(),
    );
  });

  it('does not leak Sentinel tools to /programs/<id>', () => {
    const names = getRelevantTools('/programs/apx-cdp-2026').map((tool) => tool.name);
    expect(names).not.toContain('search_patterns');
    expect(names).not.toContain('pattern_neighborhood');
    expect(names).not.toContain('evidence_lookup');
    expect(names).not.toContain('validate_synthesis');
  });

  it('does not leak Sentinel tools to /programs/new', () => {
    const names = getRelevantTools('/programs/new').map((tool) => tool.name);
    expect(names).not.toContain('search_patterns');
    expect(names).not.toContain('pattern_neighborhood');
    expect(names).not.toContain('evidence_lookup');
    expect(names).not.toContain('validate_synthesis');
  });
});
