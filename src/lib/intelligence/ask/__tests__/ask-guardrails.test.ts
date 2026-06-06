jest.mock('server-only', () => ({}));

import { atlasStakeholderConflictHandoff } from '../index';
import { retrieveSurfaceContextSources } from '../retrievers/surface-context';
import { applyPartialEvidencePolicy } from '../response-policy';
import {
  buildCxoQueryFocusChecklist,
  chunkAskText,
  chooseSynthesisTokenBudget,
  chooseSynthesisWordLimit,
  formatMandatorySurfaceEvidenceBlock,
  isEnumeratedCompletenessAsk,
  sanitizeAskSynthesis,
} from '../synthesizer';
import { buildDeterministicConciseFollowups } from '../followups';
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

  it('uses a tighter model budget only for explicit concise Ask requests', () => {
    expect(chooseSynthesisTokenBudget('Summarize the IBM dependency in one short executive paragraph.')).toBe(160);
    expect(chooseSynthesisTokenBudget('What evidence would change your view? Keep it concise.')).toBe(160);
    expect(chooseSynthesisTokenBudget('Build the full modernization case for the CTO, CFO, and COO.')).toBe(600);
  });

  it('gives enumerated CXO readiness questions enough room to complete every requested item', () => {
    const query = 'What are the six Kyriba rollout failure modes Lakeshore needs to de-risk?';

    expect(isEnumeratedCompletenessAsk(query)).toBe(true);
    expect(chooseSynthesisTokenBudget(query)).toBe(900);
    expect(chooseSynthesisWordLimit(query)).toBe(380);
  });

  it('keeps ordinary and explicit-concise Ask responses on the standard digest limits', () => {
    expect(isEnumeratedCompletenessAsk('What is your read on the Kyriba rollout?')).toBe(false);
    expect(chooseSynthesisWordLimit('What is your read on the Kyriba rollout?')).toBe(240);
    expect(chooseSynthesisWordLimit('Give me one short paragraph on Kyriba readiness.')).toBe(120);
  });

  it('uses deterministic followups only for explicit concise Ask requests', () => {
    expect(buildDeterministicConciseFollowups({
      query: 'Name one modernization risk SkyHarbor should watch. Keep it concise.',
      entities: ['IBM dependency'],
    })).toEqual([
      'Show the evidence behind IBM dependency',
      'What would change this recommendation?',
      'What should we do next?',
    ]);

    expect(buildDeterministicConciseFollowups({
      query: 'Build the full modernization case for the CTO, CFO, and COO.',
      entities: ['modernization'],
    })).toBeNull();
  });

  it('preserves whitespace across streamed synthesis chunks', () => {
    const text = 'Apex data and analytics current state includes Snowflake, Adobe Experience Platform, and Salesforce Marketing Cloud.';

    expect(chunkAskText(text).join('')).toBe(text);
  });

  it('preserves paragraph breaks when applying tenant partial-evidence policy', () => {
    const answer = [
      'My read: Meridian should advance the command-center pilot only with gates.',
      '',
      'Evidence: The loaded sources show Enterprise Context counts and Epic scope; the remaining field to confirm is exact report retirement count.',
      '',
      'Risk / gate: CFO and CIO approval should remain blocked until the funding authority row is cited.',
    ].join('\n');

    const rewritten = applyPartialEvidencePolicy(answer, [
      {
        id: 'surface-meridian',
        type: 'SURFACE',
        name: 'Meridian live Intelligence surface',
        detail: 'Enterprise Context counts are loaded.',
        confidence: 0.99,
      },
    ]);

    expect(rewritten).toContain('My read:');
    expect(rewritten).toContain('\n\nEvidence:');
    expect(rewritten).toContain('\n\nRisk / gate:');
  });

  // INT-VOICE.STRAT-2026-05-10b — Streaming whitespace regression.
  //
  // The 2026-05-10 Apex / Carlos re-test captured "ApexRetail" /
  // "demandsensing" / "upstreamconditions" word-fusion across every test on
  // every Sentinel surface. Carlos labeled it a frontend bug; root cause was
  // server-side: askIntelligence used to call sanitizeAskSynthesis(delta,
  // 500) on each streamed chunk, and that function's trim() stripped the
  // trailing whitespace from chunks produced by chunkAskText (which depend
  // on that whitespace as the inter-chunk separator). The client then
  // concatenated stripped chunks and produced fused words.
  //
  // Lock in: a long sentinel-shaped sentence must round-trip through the
  // chunk → (no trim) → join pipeline byte-for-byte.
  it('does not fuse words across streamed chunk boundaries (INT-VOICE.STRAT-2026-05-10b)', () => {
    // Build a sentence longer than the 80-char chunk regex cap so chunkAskText
    // is forced to produce multiple chunks split on inter-word whitespace.
    const sentence =
      'At multi-banner specialty retailers in your size class, four AI bets show up over and over: ' +
      'demand sensing and assortment optimization on the merchandising side, AI workforce scheduling ' +
      'and store-labor planning on ops, loyalty next-best-offer on customer, and supplier-collaboration ' +
      'AI on the supply side.';

    const chunks = chunkAskText(sentence);
    expect(chunks.length).toBeGreaterThan(1);

    // Pre-fix behaviour we are guarding against: trimming each chunk fuses
    // the last word of one chunk with the first word of the next, because
    // the regex `/.{1,80}(?:\s|$)/g` consumes the inter-chunk whitespace as
    // part of the previous chunk's trailing edge.
    const fusedFromTrimmedChunks = chunks
      .map((chunk) => chunk.trim())
      .join('');
    expect(fusedFromTrimmedChunks).toMatch(
      /show upover|show up overand|merchandisingside|side,AI|loyaltynext-best-offer/,
    );

    // Post-fix behaviour: passing chunks through unchanged reconstructs the
    // original sentence exactly, byte-for-byte. This is what
    // askIntelligence now does.
    expect(chunks.join('')).toBe(sentence);
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

    // INT-VOICE.STRAT-2026-05-10b — streaming whitespace regression guard.
    // sanitizeAskSynthesis(delta, …) inside the synthesizer-stream loop
    // strips trailing whitespace from chunks via trim(), which the
    // SentinelChat client then concatenates into fused words like
    // "ApexRetail" / "demandsensing". The fix: pass deltas through
    // unchanged. Guard against re-introduction of the per-chunk sanitize.
    it('does not re-sanitize each streamed delta (preserves chunk-boundary whitespace)', () => {
      expect(indexCode).not.toMatch(
        /for\s+await\s*\(\s*const\s+delta\s+of\s+synthesizeStream[\s\S]*?sanitizeAskSynthesis\s*\(\s*delta/,
      );
      expect(indexCode).toMatch(
        /for\s+await\s*\(\s*const\s+delta\s+of\s+synthesizeStream[\s\S]*?yield\s*\{\s*type:\s*['"]delta['"]\s*,\s*text:\s*delta\s*\}/,
      );
    });
  });

  it('keeps Ask tenant resolution strict so no-tenant sessions cannot fall back to a default client', () => {
    const routeCode = readFileSync(
      join(__dirname, '..', '..', '..', '..', 'app', 'api', 'intelligence', 'ask', 'route.ts'),
      'utf8',
    );

    expect(routeCode).toMatch(/resolveTenant\s*\(\s*\{[\s\S]*?allowFallback:\s*false/);
  });

  it('keeps healthcare modernization answers grounded in executive analytics terms', () => {
    const synthesizerCode = readFileSync(
      join(__dirname, '..', 'synthesizer.ts'),
      'utf8',
    );

    const requiredTerms = [
      'HEALTHCARE + MODERNIZATION GROUNDING',
      'HCUP',
      'readmissions',
      'length of stay',
      'Stars measures',
      'MLR',
      'data products',
      'reports',
      'metrics',
      'lift-and-shift',
      'on-prem exits',
      'metadata-driven ETL',
    ];

    for (const term of requiredTerms) {
      expect(synthesizerCode).toContain(term);
    }
  });

  it('keeps phase, artifact, approval, and no-go proof explicit in Ask prompt discipline', () => {
    const synthesizerCode = readFileSync(
      join(__dirname, '..', 'synthesizer.ts'),
      'utf8',
    );

    const requiredTerms = [
      'ARTIFACT + APPROVAL DISCIPLINE',
      'business case',
      'architecture artifact',
      'Source event',
      'board pack',
      'audit pack',
      'CFO',
      'CIO',
      'approval owner',
      'Phase 3 architecture proof',
      'partner / Source trigger',
      'no-go condition',
      'stored artifact + approval proof',
    ];

    for (const term of requiredTerms) {
      expect(synthesizerCode).toContain(term);
    }
  });

  it('builds a query-aware focus checklist for healthcare analytics questions', () => {
    const checklist = buildCxoQueryFocusChecklist(
      'What third-party datasets and provider KPIs do we need for population health?',
    );

    expect(checklist).toContain('QUESTION-SPECIFIC FOCUS CHECKLIST');
    expect(checklist).toContain('HCUP');
    expect(checklist).toContain('readmissions');
    expect(checklist).toContain('length of stay');
    expect(checklist).toContain('data products');
    expect(checklist).toContain('evidence');
  });

  it('builds a query-aware focus checklist for MLR baseline and forecast questions', () => {
    const checklist = buildCxoQueryFocusChecklist(
      'How should Meridian use MLR compression as a value spine without claiming realized savings?',
    );

    expect(checklist).toContain('MLR');
    expect(checklist).toContain('baseline');
    expect(checklist).toContain('forecast');
    expect(checklist).toContain('realized savings');
  });

  it('builds a query-aware focus checklist for modernization estate questions', () => {
    const checklist = buildCxoQueryFocusChecklist(
      'What is the risk of our AWS lift-and-shift and on-prem data center exit?',
    );

    expect(checklist).toContain('AWS');
    expect(checklist).toContain('lift-and-shift');
    expect(checklist).toContain('on-prem exit');
    expect(checklist).toContain('SLA');
    expect(checklist).toContain('cutover risk');
  });

  it('builds a query-aware focus checklist for AMS provider operating model questions', () => {
    const checklist = buildCxoQueryFocusChecklist(
      'What should Meridian require from a data analytics AMS provider so the lakehouse does not become a ticket factory?',
    );

    expect(checklist).toContain('AMS');
    expect(checklist).toContain('SLA');
    expect(checklist).toContain('operating model');
    expect(checklist).toContain('data quality');
    expect(checklist).toContain('governance');
  });

  it('builds a query-aware focus checklist for model risk and data quality questions', () => {
    const checklist = buildCxoQueryFocusChecklist(
      'What model risk, drift, monitoring, and data quality gates should block clinical safety sign-off?',
    );

    expect(checklist).toContain('drift');
    expect(checklist).toContain('data quality');
    expect(checklist).toContain('monitoring');
    expect(checklist).toContain('human-in-the-loop');
    expect(checklist).toContain('rollback');
  });

  it('builds a query-aware focus checklist for artifact, approval, and no-go questions', () => {
    const checklist = buildCxoQueryFocusChecklist(
      'What should block the board go/no-go if the Move artifact and Source partner trigger are not approved?',
    );

    expect(checklist).toContain('artifact');
    expect(checklist).toContain('business case');
    expect(checklist).toContain('approval owner');
    expect(checklist).toContain('CFO');
    expect(checklist).toContain('CIO');
    expect(checklist).toContain('Source partner trigger');
    expect(checklist).toContain('Move registration');
    expect(checklist).toContain('no-go condition');
    expect(checklist).toContain('decision fork');
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

  it('formats authenticated surface facts as mandatory synthesis evidence', () => {
    const block = formatMandatorySurfaceEvidenceBlock([
      {
        type: 'TENANT',
        name: 'Lakeshore Holdings 360 Intelligence substrate',
        id: 'lakeshore',
        detail: [
          'Tenant 360: Lakeshore Holdings.',
          'Move 0 de-risk gates include bank connectivity, ERP feed quality, entity hierarchy, historical cash reconstruction, adoption, and intercompany reconciliation.',
        ].join('\n- '),
        confidence: 0.96,
      },
      {
        type: 'SURFACE',
        name: 'Lakeshore live Intelligence surface',
        id: 'intelligence',
        detail: [
          'Active Intelligence surface: intelligence.',
          'Vector store truth: Lakeshore uses native Azure AI Search for vector retrieval, not Pinecone.',
        ].join('\n- '),
        confidence: 0.99,
      },
      {
        type: 'WORLDVIEW',
        name: 'General treasury doctrine',
        id: 'worldview',
        detail: 'This lower-priority block should not be copied into the mandatory surface evidence block.',
        confidence: 0.75,
      },
    ]);

    expect(block).toContain('CURRENT TENANT / SURFACE FACTS TO USE');
    expect(block).toContain('ERP feed quality');
    expect(block).toContain('Azure AI Search');
    expect(block).not.toContain('General treasury doctrine');
  });

  it('emits an error event instead of silently closing an empty Ask stream', () => {
    const routeCode = readFileSync(
      join(__dirname, '..', '..', '..', '..', 'app', 'api', 'intelligence', 'ask', 'route.ts'),
      'utf8',
    );

    expect(routeCode).toContain("error: 'ask_synthesis_empty'");
  });
});
