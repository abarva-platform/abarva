/**
 * Smoke test for STRESS-P0-002..005 multi-layer tenant resolution.
 *
 * Background
 * ----------
 * The 2026-05-24 full-module stress test on Meridian Health found that
 * aVa response to a Meridian-authenticated CDIO asserted "you're
 * Apex Retail Group". PR #2341 fixed the hardcoded tenant pin in the
 * synthesizer system prompt, but the leak persisted because three layers
 * ABOVE the synthesizer hardcoded 'apexretail' / 'Apex Retail Group':
 *
 *   1. src/app/intelligence/ask/page.tsx — topBarProps.tenantName and
 *      <AvaReasoningCards initialClient="apexretail" /> both hardcoded
 *   2. src/app/(maestro)/intelligence/ask/AvaReasoningCards.tsx —
 *      surfaceContext.activeClient: 'Apex Retail Group' hardcoded in the
 *      request body, and default initialClient prop = 'apexretail'
 *   3. The route already had Codex's PR #2343 fallback fix
 *
 * This smoke test verifies the source files no longer contain the
 * hardcoded strings. It does NOT exercise the live UI (covered separately
 * by the Playwright crawl in audit-artifacts/).
 */

import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..');

function read(relPath: string): string {
  return readFileSync(join(REPO_ROOT, relPath), 'utf8');
}

describe('STRESS-P0-002..005 — multi-layer tenant resolution', () => {
  describe('src/app/intelligence/ask/page.tsx', () => {
    const src = read('src/app/intelligence/ask/page.tsx');

    it('does NOT hardcode tenantName: \'Apex Retail Group\' in topBarProps', () => {
      expect(src).not.toMatch(/tenantName:\s*['"]Apex Retail Group['"]/);
    });

    it('does NOT hardcode initialClient="apexretail" on AvaReasoningCards', () => {
      expect(src).not.toMatch(/initialClient=['"]apexretail['"]/);
    });

    it('resolves the active tenant from getActiveClientRow', () => {
      expect(src).toMatch(/getActiveClientRow/);
    });

    it('passes the resolved active tenant to AppShell topBarProps.tenantName', () => {
      expect(src).toMatch(/tenantName:\s*activeClientDisplayName/);
    });

    it('passes the resolved active tenant to AvaReasoningCards initialClient', () => {
      expect(src).toMatch(/initialClient=\{activeClientKey\}/);
    });
  });

  describe('src/app/(maestro)/intelligence/ask/AvaReasoningCards.tsx', () => {
    const src = read('src/app/(maestro)/intelligence/ask/AvaReasoningCards.tsx');

    it('does NOT hardcode activeClient: \'Apex Retail Group\' in surfaceContext', () => {
      expect(src).not.toMatch(/activeClient:\s*['"]Apex Retail Group['"]/);
    });

    it('does NOT default initialClient to \'apexretail\'', () => {
      expect(src).not.toMatch(/initialClient\s*=\s*['"]apexretail['"]/);
    });

    it('uses initialClientDisplayName for activeClient in surfaceContext', () => {
      expect(src).toMatch(/activeClient:\s*initialClientDisplayName/);
    });

    it('requires initialClient and initialClientDisplayName as props', () => {
      expect(src).toMatch(/initialClient:\s*string;/);
      expect(src).toMatch(/initialClientDisplayName:\s*string;/);
    });

    it('does NOT have an Apex-flavored default question assigned to DEFAULT_QUESTION', () => {
      // Validate the literal assignment, not narrative comments that mention
      // the prior string for documentation purposes.
      expect(src).not.toMatch(/const DEFAULT_QUESTION\s*=\s*['"]As Apex CTO/);
    });
  });
});
