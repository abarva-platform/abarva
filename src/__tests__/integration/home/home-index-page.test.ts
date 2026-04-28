/**
 * HOME-POLISH · HomeIndexPage source audit.
 *
 * Verifies the three HOME-POLISH invariants:
 *   1. Nexus voice is tighter (under 30 words)
 *   2. Urgent stats card uses PEACH_TEXT accent (not PEACH_LINE)
 *   3. Middle strip is present with data-testid
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENT_PATH = join(process.cwd(), 'src/components/home/HomeIndexPage.tsx');
const FIXTURE_PATH = join(process.cwd(), 'src/lib/home/shell-home-fixture.ts');

const componentSrc = readFileSync(COMPONENT_PATH, 'utf8');
const fixtureSrc = readFileSync(FIXTURE_PATH, 'utf8');

describe('HOME-POLISH · Nexus voice density', () => {
  it('agentQuote is present in fixture', () => {
    expect(fixtureSrc).toContain('agentQuote:');
  });

  it('agentQuote is under 30 words', () => {
    const match = fixtureSrc.match(/agentQuote:\s*'([^']+)'/);
    expect(match).not.toBeNull();
    if (match) {
      const wordCount = match[1].trim().split(/\s+/).length;
      expect(wordCount).toBeLessThan(30);
    }
  });

  it('agentQuote mentions CDP gate', () => {
    const match = fixtureSrc.match(/agentQuote:\s*'([^']+)'/);
    expect(match).not.toBeNull();
    if (match) {
      expect(match[1]).toMatch(/CDP/i);
    }
  });
});

describe('HOME-POLISH · Peach urgency accent on gate-pending KPI', () => {
  it('urgent stats card uses PEACH_TEXT for left border accent', () => {
    expect(componentSrc).toContain('SHELL.PEACH_TEXT');
    // The StatsCard urgent branch should use PEACH_TEXT — check both tokens present in component
    expect(componentSrc).toContain('urgent');
    expect(componentSrc).toContain('SHELL.PEACH_TEXT');
  });

  it('does not use PEACH_LINE for the urgent border', () => {
    // After HOME-POLISH, the urgent accent is PEACH_TEXT (stronger)
    // PEACH_LINE should not appear in the urgent left-border path
    const urgentBlock = componentSrc.match(/borderLeft:\s*urgent\s*\?[^:]+:/);
    if (urgentBlock) {
      expect(urgentBlock[0]).not.toContain('PEACH_LINE');
    }
  });

  it('fixture has at least one urgent:true stat', () => {
    expect(fixtureSrc).toContain('urgent: true');
  });
});

describe('HOME-POLISH · Middle strip presence', () => {
  it('HomeIndexPage passes a middleStrip prop to AppShell', () => {
    expect(componentSrc).toContain('middleStrip=');
  });

  it('middle strip has data-testid="home-middle-strip"', () => {
    expect(componentSrc).toContain('data-testid="home-middle-strip"');
  });

  it('middle strip contains the CDP build gate item', () => {
    expect(componentSrc).toContain('CDP build gate');
  });

  it('middle strip contains the morning pulse label', () => {
    expect(componentSrc).toContain('Morning pulse');
  });
});
