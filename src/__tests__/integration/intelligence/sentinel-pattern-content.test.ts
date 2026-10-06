import * as nodeFs from 'fs';
import * as nodePath from 'path';

import {
  resolvePathStatus,
  SHARED_PATH_DISPOSITIONS,
} from '@/lib/qa/path-disposition';
// I4 · Authored Sentinel pattern content tests.

import {
  buildSentinelPatternAuthoredContent,
  SENTINEL_PATTERN_CONTENT_KEYS,
  type SentinelPatternAuthoredContent,
} from '@/lib/intelligence/sentinel-pattern-content';
import {
  SENTINEL_PATTERN_KEYS_IN_RANK_ORDER,
  type SentinelPatternHandoffTarget,
} from '@/lib/intelligence/sentinel-pattern-detections';

const ALL_HANDOFFS: SentinelPatternHandoffTarget[] = [
  'nexus',
  'atlas',
  'steward',
  'sentinel',
];

// ---------------------------------------------------------------------
// Determinism + key parity
// ---------------------------------------------------------------------

describe('buildSentinelPatternAuthoredContent · determinism', () => {
  it('returns deterministic content across repeated calls', () => {
    for (const k of SENTINEL_PATTERN_CONTENT_KEYS) {
      const a = buildSentinelPatternAuthoredContent(k);
      const b = buildSentinelPatternAuthoredContent(k);
      expect(a).not.toBeNull();
      expect(a).toEqual(b);
    }
  });

  it('returns null for unknown pattern keys', () => {
    expect(buildSentinelPatternAuthoredContent('not-a-real-pattern')).toBeNull();
    expect(buildSentinelPatternAuthoredContent('value_not_ready')).toBeNull();
    expect(buildSentinelPatternAuthoredContent('')).toBeNull();
  });

  it('SENTINEL_PATTERN_CONTENT_KEYS matches SENTINEL_PATTERN_KEYS_IN_RANK_ORDER', () => {
    expect(new Set(SENTINEL_PATTERN_CONTENT_KEYS)).toEqual(
      new Set(SENTINEL_PATTERN_KEYS_IN_RANK_ORDER),
    );
  });
});

// ---------------------------------------------------------------------
// Required field set per canonical pattern
// ---------------------------------------------------------------------

describe('every canonical pattern has the required content fields', () => {
  it.each(SENTINEL_PATTERN_KEYS_IN_RANK_ORDER.map((k) => [k]))(
    'pattern %s carries the full authored field set',
    (k) => {
      const c = buildSentinelPatternAuthoredContent(k as string);
      expect(c).not.toBeNull();
      const content = c as SentinelPatternAuthoredContent;
      expect(content.patternKey).toBe(k);
      expect(typeof content.patternName).toBe('string');
      expect(content.patternName.length).toBeGreaterThan(0);
      expect(content.definition.length).toBeGreaterThan(0);
      expect(content.howSentinelDetected.length).toBeGreaterThan(0);
      expect(content.whyItMatters.length).toBeGreaterThan(0);
      expect(content.failureModes.length).toBeGreaterThan(0);
      expect(content.interventions.length).toBeGreaterThan(0);
      expect(content.requiredEvidence.length).toBeGreaterThan(0);
      expect(content.handoffGuidance.length).toBeGreaterThan(0);
      expect(['partial', 'authored']).toContain(content.contentCompleteness);
      expect(content.authoredAt).toBe('deterministic_seed');
      for (const h of content.handoffGuidance) {
        expect(ALL_HANDOFFS).toContain(h.target);
        expect(h.guidance.length).toBeGreaterThan(0);
      }
      for (const fm of content.failureModes) {
        expect(typeof fm.id).toBe('string');
        expect(fm.title.length).toBeGreaterThan(0);
        expect(fm.description.length).toBeGreaterThan(0);
      }
      for (const iv of content.interventions) {
        expect(typeof iv.id).toBe('string');
        expect(iv.title.length).toBeGreaterThan(0);
        expect(iv.description.length).toBeGreaterThan(0);
      }
      for (const rel of content.relatedPatterns) {
        expect(SENTINEL_PATTERN_KEYS_IN_RANK_ORDER).toContain(rel.patternKey);
        expect(rel.reason.length).toBeGreaterThan(0);
        expect(rel.patternKey).not.toBe(content.patternKey); // no self-reference
      }
    },
  );
});

// ---------------------------------------------------------------------
// Honest source / fabrication invariants
// ---------------------------------------------------------------------

describe('honest source invariants', () => {
  it('content does not invent a dollar amount in any string field', () => {
    const dollarPattern = /\$\s?\d[\d,]*(\.\d+)?/;
    for (const k of SENTINEL_PATTERN_CONTENT_KEYS) {
      const c = buildSentinelPatternAuthoredContent(k);
      expect(c).not.toBeNull();
      const content = c as SentinelPatternAuthoredContent;
      const fields: string[] = [
        content.patternName,
        content.definition,
        content.whyItMatters,
        ...content.howSentinelDetected,
        ...content.requiredEvidence,
        ...content.failureModes.map((fm) => fm.title),
        ...content.failureModes.map((fm) => fm.description),
        ...content.interventions.map((iv) => iv.title),
        ...content.interventions.map((iv) => iv.description),
        ...content.relatedPatterns.map((rel) => rel.reason),
        ...content.handoffGuidance.map((h) => h.guidance),
      ];
      for (const f of fields) {
        expect(f).not.toMatch(dollarPattern);
      }
    }
  });

  it('content does not claim a live runtime', () => {
    for (const k of SENTINEL_PATTERN_CONTENT_KEYS) {
      const c = buildSentinelPatternAuthoredContent(k);
      const content = c as SentinelPatternAuthoredContent;
      expect(content.authoredAt).toBe('deterministic_seed');
      // No "live retrieval" / "live runtime" claim in any string field.
      const json = JSON.stringify(content).toLowerCase();
      expect(json).not.toContain('live retrieval enabled');
      expect(json).not.toContain('live model invocation');
    }
  });

  it('howSentinelDetected only references canonical S9e signal types', () => {
    const allowed = new Set([
      'gate_missing_inputs',
      'evidence_not_ready',
      'value_not_ready',
      'deliverable_coverage_gap',
      'context_insufficient',
      'executive_decision_needed',
    ]);
    for (const k of SENTINEL_PATTERN_CONTENT_KEYS) {
      const c = buildSentinelPatternAuthoredContent(k);
      const content = c as SentinelPatternAuthoredContent;
      for (const sig of content.howSentinelDetected) {
        expect(allowed.has(sig)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · sentinel-pattern-content.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/intelligence/sentinel-pattern-content.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('imports only from the I1 detection module for type narrowing', () => {
    expect(codeOnly).toMatch(/from '@\/lib\/intelligence\/sentinel-pattern-detections'/);
  });

  it('does not import Sentinel runtime, Atlas, Nexus, or agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI or legacy /programs', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
  });

  it('does not import auth, supabase, or call models', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });

  it('does not call Date.now / Math.random / new Date', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · component
// ---------------------------------------------------------------------

// Retired · SentinelPatternContentPanel.tsx
//
// A describe block here read src/components/intelligence/SentinelPatternContentPanel.tsx with
// fs.readFileSync in its body. The legacy surface sunset at 0c6a86c51 deleted
// that file, so the read threw during COLLECTION -- and a throw there takes
// the whole file with it. Every block above this point stopped running too,
// and jest reported "0 tests", which does not read as a failure the way a red
// count does.
//
// Recorded as retired rather than deleted, and checked against the register,
// so what the sunset cost stays visible and the claim cannot rot unnoticed.
describe('retired · SentinelPatternContentPanel.tsx (module hygiene · SentinelPatternContentPanel.tsx)', () => {
  const REGISTER_NAME = 'SHARED_PATH_DISPOSITIONS in src/lib/qa/path-disposition.ts';
  const RETIRED_PATH = 'src/components/intelligence/SentinelPatternContentPanel.tsx';

  it('is absent, and the register names the commit that removed it', () => {
    const abs = nodePath.resolve(__dirname, '../../../../', RETIRED_PATH);
    expect(nodeFs.existsSync(abs)).toBe(false);

    const resolved = resolvePathStatus(
      RETIRED_PATH,
      false,
      SHARED_PATH_DISPOSITIONS,
      REGISTER_NAME,
    );
    expect(resolved.status).toBe('removed');
    expect(resolved.detail).toContain('0c6a86c51');
  });

  it('does not accept an absence nobody declared', () => {
    const resolved = resolvePathStatus(
      'src/components/intelligence/NeverExisted.tsx',
      false,
      SHARED_PATH_DISPOSITIONS,
      REGISTER_NAME,
    );
    expect(resolved.status).toBe('fail');
  });
});
// ---------------------------------------------------------------------
// Detail page integration · static-source check
// ---------------------------------------------------------------------

// Retired · SentinelPatternDetail.tsx
//
// A describe block here read src/components/intelligence/SentinelPatternDetail.tsx with
// fs.readFileSync in its body. The legacy surface sunset at 0c6a86c51 deleted
// that file, so the read threw during COLLECTION -- and a throw there takes
// the whole file with it. Every block above this point stopped running too,
// and jest reported "0 tests", which does not read as a failure the way a red
// count does.
//
// Recorded as retired rather than deleted, and checked against the register,
// so what the sunset cost stays visible and the claim cannot rot unnoticed.
describe('retired · SentinelPatternDetail.tsx (SentinelPatternDetail.tsx integrates SentinelPatternContentPanel)', () => {
  const REGISTER_NAME = 'SHARED_PATH_DISPOSITIONS in src/lib/qa/path-disposition.ts';
  const RETIRED_PATH = 'src/components/intelligence/SentinelPatternDetail.tsx';

  it('is absent, and the register names the commit that removed it', () => {
    const abs = nodePath.resolve(__dirname, '../../../../', RETIRED_PATH);
    expect(nodeFs.existsSync(abs)).toBe(false);

    const resolved = resolvePathStatus(
      RETIRED_PATH,
      false,
      SHARED_PATH_DISPOSITIONS,
      REGISTER_NAME,
    );
    expect(resolved.status).toBe('removed');
    expect(resolved.detail).toContain('0c6a86c51');
  });

  it('does not accept an absence nobody declared', () => {
    const resolved = resolvePathStatus(
      'src/components/intelligence/NeverExisted.tsx',
      false,
      SHARED_PATH_DISPOSITIONS,
      REGISTER_NAME,
    );
    expect(resolved.status).toBe('fail');
  });
});
function stripComments(src: string): string {
  const lineStripped = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, '');
}
