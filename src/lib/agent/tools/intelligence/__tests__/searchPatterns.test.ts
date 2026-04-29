/**
 * search_patterns · sanitizeSummaryForArtifact regression tests
 *
 * Production walk caught Sentinel emitting `[[artifact:pattern-match
 * parse-failed]]` markers when the search_patterns tool ran on
 * /intelligence. Diagnosis: pattern bodies passed through to the
 * artifact `summary` field could include literal `[[/artifact]]`
 * substrings (since pattern bodies discuss the corpus in prose,
 * occasionally referencing the artifact-channel grammar verbatim) —
 * the close sentinel inside the JSON closed the tuple early and
 * corrupted JSON.parse downstream.
 *
 * The sanitizer scrubs the close sentinel, collapses whitespace, and
 * caps card-length so artifacts always parse cleanly.
 */

import { extractArtifacts } from '../../../artifacts';
import { sanitizeSummaryForArtifact } from '../searchPatterns';

describe('sanitizeSummaryForArtifact', () => {
  it('passes through clean short input unchanged (modulo whitespace collapse)', () => {
    expect(sanitizeSummaryForArtifact('Customer data platform programme.')).toBe(
      'Customer data platform programme.',
    );
  });

  it('collapses internal whitespace to single spaces', () => {
    expect(sanitizeSummaryForArtifact('  multi   line\n\n  summary\t.  ')).toBe(
      'multi line summary .',
    );
  });

  it('caps at 240 chars with an ellipsis', () => {
    const long = 'x'.repeat(500);
    const out = sanitizeSummaryForArtifact(long);
    expect(out.length).toBeLessThanOrEqual(240);
    expect(out.endsWith('…')).toBe(true);
  });

  it('replaces literal [[/artifact]] sequences (the production bug)', () => {
    const malicious =
      'Pattern body discussing the [[/artifact]] grammar in prose, with a [[/artifact]] example.';
    const cleaned = sanitizeSummaryForArtifact(malicious);
    expect(cleaned).not.toContain('[[/artifact]]');
    expect(cleaned).toContain('[[ /artifact ]]');
  });

  it('cleaned summary survives the artifact channel round-trip', () => {
    // Reproduce the production failure mode end-to-end.
    const malicious = 'Pattern body with [[/artifact]] embedded.';
    const cleaned = sanitizeSummaryForArtifact(malicious);
    const payload = {
      patternId: 'PAT-FOO-001',
      name: 'Foo',
      summary: cleaned,
    };
    const wireFormat = `[[artifact:pattern-match]]${JSON.stringify(payload)}[[/artifact]]`;
    const parsed = extractArtifacts(wireFormat);
    expect(parsed.artifacts).toHaveLength(1);
    expect(parsed.artifacts[0]).toMatchObject({
      type: 'pattern-match',
      patternId: 'PAT-FOO-001',
      name: 'Foo',
    });
    expect(parsed.visibleText).not.toContain('parse-failed');
  });

  it('demonstrates the original bug — without sanitizer, the close sentinel breaks parsing', () => {
    // This guards against regression: if someone removes the sanitizer,
    // this test will start passing the parse-failed check and we'll see
    // it red.
    const malicious = 'Pattern body with [[/artifact]] embedded.';
    const payload = {
      patternId: 'PAT-FOO-001',
      name: 'Foo',
      summary: malicious, // raw, unsanitized
    };
    const wireFormat = `[[artifact:pattern-match]]${JSON.stringify(payload)}[[/artifact]]`;
    const parsed = extractArtifacts(wireFormat);
    // The close sentinel inside the JSON truncates the payload — JSON.parse
    // fails — tryParseArtifact returns null — visible text gets the marker.
    expect(parsed.artifacts).toHaveLength(0);
    expect(parsed.visibleText).toContain('parse-failed');
  });
});
