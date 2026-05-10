jest.mock('server-only', () => ({}));

import { atlasStakeholderConflictHandoff } from '../index';
import { retrieveSurfaceContextSources } from '../retrievers/surface-context';
import { chunkAskText, sanitizeAskSynthesis } from '../synthesizer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Ask Intelligence guardrails', () => {
  it('routes advice requests about executive contradictions to Atlas', () => {
    const handoff = atlasStakeholderConflictHandoff('What should I do about the CMO-vs-CFO contradiction?');

    expect(handoff).toContain('Atlas should own that call');
    expect(handoff).toContain('Sentinel should not prescribe');
    expect(handoff).not.toContain('concrete playbook');
  });

  it('does not route ordinary synthesis questions to Atlas', () => {
    expect(atlasStakeholderConflictHandoff('Why is Apex CDP at risk right now?')).toBeNull();
  });

  it('strips hollow openers from synthesized answers', () => {
    expect(sanitizeAskSynthesis('Good question, Anand. Let me give you an honest read here. Apex has a sourcing risk.'))
      .toBe('Apex has a sourcing risk.');
  });

  it('caps Ask Intelligence answers to the surface word limit', () => {
    const long = Array.from({ length: 150 }, (_, i) => `word${i}`).join(' ');
    const capped = sanitizeAskSynthesis(long, 120);

    expect(capped.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(120);
  });

  it('preserves whitespace across streamed synthesis chunks', () => {
    const text = 'Apex data and analytics current state includes Snowflake, Adobe Experience Platform, and Salesforce Marketing Cloud.';

    expect(chunkAskText(text).join('')).toBe(text);
  });

  // INT-VOICE.STRAT-2026-05-10 — Lock in the no-canned-refusal contract for
  // the Ask flow. The previous version short-circuited with retrieval-mechanics
  // framings ("We don't have indexed data...", "That topic isn't yet
  // synthesized...", "Limited indexed data — confidence is moderate.") whenever
  // sources were empty or low-confidence, bypassing the synthesizer's senior-
  // advisor prompt. This test guards against any reintroduction.
  describe('No canned-refusal short-circuit (INT-VOICE.STRAT-2026-05-10)', () => {
    const rawIndexSource = readFileSync(
      join(__dirname, '..', 'index.ts'),
      'utf8',
    );

    // Strip `//` line comments and `/* */` block comments before substring-
    // matching so the doctrine comment that explains why these phrases were
    // removed is not itself flagged.
    const indexCode = rawIndexSource
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

    it('does not contain the legacy emptyStateMessage helper', () => {
      expect(indexCode).not.toMatch(/function\s+emptyStateMessage\s*\(/);
    });

    it('does not emit any of the legacy retrieval-mechanics canned refusals', () => {
      const bannedSubstrings = [
        "We don't have indexed data that answers that directly",
        "We don't have indexed vendor data that matches that comparison",
        "That topic isn't yet synthesized in the knowledge layer",
        'Limited indexed data — confidence is moderate.',
        'No matching Genome pattern is indexed yet',
        'No insight matches that query yet',
      ];
      for (const phrase of bannedSubstrings) {
        expect(indexCode).not.toContain(phrase);
      }
    });

    it('routes empty-source queries through the synthesizer', () => {
      expect(indexCode).toMatch(/for\s+await\s*\(\s*const\s+delta\s+of\s+synthesizeStream\s*\(/);
      expect(indexCode).not.toMatch(
        /if\s*\(\s*sources\.length\s*===\s*0\s*\)\s*\{\s*const\s+msg\s*=\s*emptyStateMessage/,
      );
    });
  });

  it('promotes live surface facts as high-confidence Intelligence evidence', () => {
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: 'vendors',
        activeClient: 'Apex Retail Group',
        clientKey: 'apexretail',
        stageFacts: ['Vendors tab: $107.4M spend across 21 active vendors.'],
        pageFacts: ['This is the live Apex Retail Intelligence substrate, not a healthcare fixture.'],
      },
      'current state of data analytics landscape',
    );

    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({
      type: 'SURFACE',
      name: 'Apex Retail Group live Intelligence surface',
      id: 'vendors',
      confidence: 0.99,
    });
    expect(sources[0].detail).toContain('Vendors tab: $107.4M spend');
    expect(sources[0].detail).toContain('not a healthcare fixture');
  });

  it('promotes tenant and graph context for Apex current-state questions', () => {
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: 'vendors',
        activeClient: 'Apex Retail Group',
        clientKey: 'apexretail',
        stageFacts: ['Vendors tab: $107.4M spend across 21 active vendors.'],
        tenantFacts: [
          'Tenant 360: Apex Retail is the active retail demo tenant. Do not use Meridian Healthcare, Epic EHR, IDN, CMIO, HIPAA, or clinical AI facts.',
        ],
        vendorFacts: [
          'Data and analytics landscape: Adobe Experience Platform $8.8M - CDP; Snowflake $3.8M - analytics foundation.',
        ],
        graphFacts: [
          'Graph edge: Adobe Experience Platform, Salesforce Commerce + Marketing Cloud, and Accenture Retail all claim integration-hub adjacency to the same customer data layer.',
        ],
      },
      'Can you give me a perspective of current state of data analytics landscape?',
    );

    expect(sources.map((source) => source.type)).toEqual(['SURFACE', 'TENANT', 'GRAPH']);
    expect(sources[1]).toMatchObject({
      type: 'TENANT',
      name: 'Apex Retail Group 360 Intelligence substrate',
      id: 'apexretail',
      confidence: 0.96,
    });
    expect(sources[1].detail).toContain('Adobe Experience Platform $8.8M');
    expect(sources[1].detail).toContain('Do not use Meridian Healthcare');
    expect(sources[2]).toMatchObject({
      type: 'GRAPH',
      name: 'Apex Retail Group Intelligence graph',
      id: 'apexretail',
    });
    expect(sources[2].detail).toContain('integration-hub adjacency');
  });
});
