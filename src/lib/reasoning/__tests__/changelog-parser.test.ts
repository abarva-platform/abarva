/**
 * Reasoning changelog parser tests.
 *
 * Deterministic — exercises the pure parser against a hand-crafted
 * raw `git log` block. No filesystem, no child_process, no live git.
 */

import {
  parseReasoningCommitLine,
  parseReasoningCommitLog,
} from '@/lib/reasoning/changelog-parser';

const RAW_LOG = [
  '4aae5eb5ee4a72835d61dbb03c2d5df919211150|feat(reasoning): admin contradiction template editor (in-memory overrides) (#767)|anandsundaram-hash|2026-04-28T19:12:31-05:00',
  '753f71c60d4d676fb174ab95ac33452480081589|docs(reasoning): SDK-style quickstart + import map (#756)|anandsundaram-hash|2026-04-28T18:53:54-05:00',
  '00000000000000000000000000000000fixfix01|fix(reasoning): off-by-one in gate evaluator (#700)|alice|2026-04-20T10:00:00-05:00',
  '00000000000000000000000000000000refactr|refactor(reasoning): extract pattern lookup helper|bob|2026-04-15T08:30:00-05:00',
  '00000000000000000000000000000000chore01|chore(reasoning): bump telemetry capacity|carol|2026-04-10T12:00:00-05:00',
  // Should be skipped — wrong scope, no `(reasoning)`.
  'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef|feat(programs): something unrelated (#999)|dave|2026-04-09T11:00:00-05:00',
  '',
].join('\n');

describe('parseReasoningCommitLine', () => {
  it('parses a feat line with a PR number', () => {
    const line = RAW_LOG.split('\n')[0];
    const entry = parseReasoningCommitLine(line);
    expect(entry).not.toBeNull();
    expect(entry).toEqual({
      sha: '4aae5eb5ee4a72835d61dbb03c2d5df919211150',
      subject:
        'feat(reasoning): admin contradiction template editor (in-memory overrides) (#767)',
      author: 'anandsundaram-hash',
      date: '2026-04-28T19:12:31-05:00',
      prNumber: 767,
      kind: 'feat',
      short: 'admin contradiction template editor (in-memory overrides)',
    });
  });

  it('parses every supported kind (feat / fix / refactor / docs / chore)', () => {
    const lines = RAW_LOG.split('\n').slice(0, 5);
    const kinds = lines
      .map((l) => parseReasoningCommitLine(l)?.kind)
      .filter((k): k is NonNullable<typeof k> => Boolean(k));
    expect(kinds).toEqual(['feat', 'docs', 'fix', 'refactor', 'chore']);
  });

  it('returns null for non-reasoning kinds outside the allow-list', () => {
    const entry = parseReasoningCommitLine(
      'aaaa|build(reasoning): tweak ci|x|2026-01-01T00:00:00Z',
    );
    expect(entry).toBeNull();
  });

  it('returns null for empty / malformed lines', () => {
    expect(parseReasoningCommitLine('')).toBeNull();
    expect(parseReasoningCommitLine('   ')).toBeNull();
    expect(parseReasoningCommitLine('not-a-pipe-line')).toBeNull();
    expect(parseReasoningCommitLine('only|two|fields')).toBeNull();
  });

  it('handles a commit with no PR number — prNumber is null and short stays clean', () => {
    const entry = parseReasoningCommitLine(
      '00000000000000000000000000000000refactr|refactor(reasoning): extract pattern lookup helper|bob|2026-04-15T08:30:00-05:00',
    );
    expect(entry).not.toBeNull();
    expect(entry!.prNumber).toBeNull();
    expect(entry!.short).toBe('extract pattern lookup helper');
    expect(entry!.kind).toBe('refactor');
  });
});

describe('parseReasoningCommitLog', () => {
  it('skips blank trailing lines and preserves git-emitted order', () => {
    const entries = parseReasoningCommitLog(RAW_LOG);
    expect(entries).toHaveLength(5);
    expect(entries[0].sha).toBe('4aae5eb5ee4a72835d61dbb03c2d5df919211150');
    expect(entries[entries.length - 1].kind).toBe('chore');
  });

  it('does not emit entries for non-reasoning scopes mixed into the input', () => {
    const entries = parseReasoningCommitLog(RAW_LOG);
    const offending = entries.find((e) => e.subject.includes('(programs)'));
    expect(offending).toBeUndefined();
  });
});
