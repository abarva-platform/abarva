/**
 * The Programs pattern authority gates on states the catalog column can
 * actually hold (backlog item 126, remediation).
 *
 * `resolvePromotedProgramPatternKey` refuses any key whose
 * `engagement_topics` row is not in a promoted state, and every writer
 * treats that refusal as fatal: `commit_program` returns
 * `program_pattern_not_promoted` instead of submitting the brief, and
 * `originateProgram` throws before the engagement is inserted.
 *
 * So the promoted-state list is not a preference. If it names states the
 * column cannot hold, the gate refuses every key that exists and
 * origination-with-a-pattern stops working — while every unit test stays
 * green, because a test can hand the resolver any row it likes through
 * the injected lookup. That is what happened: the list was
 * ('published','validated','active') and the column is constrained to
 * ('draft','pilot','mature','deprecated').
 *
 * The constraint is read here from the migration that defines it, so this
 * moves when the column moves and cannot drift back into agreement with
 * itself.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  PROMOTED_PATTERN_STATES,
  resolvePromotedProgramPatternKey,
} from '../pattern-authority';

const MIGRATION = join(
  process.cwd(),
  'supabase/migrations/041_programs_foundation.sql',
);

/** The values `engagement_topics.promotion_state` is constrained to. */
function statesThePromotionColumnCanHold(): string[] {
  const sql = readFileSync(MIGRATION, 'utf8');
  const match = sql.match(
    /promotion_state\s+IS\s+NULL\s+OR\s+promotion_state\s+IN\s*\(([^)]*)\)/i,
  );
  if (!match) {
    throw new Error(
      'promotion_state CHECK constraint not found in 041_programs_foundation.sql — ' +
        'the column moved and this test must follow it, not be deleted',
    );
  }
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe('Programs pattern authority · reachability', () => {
  it('reads a non-empty CHECK constraint from the defining migration', () => {
    expect(statesThePromotionColumnCanHold().length).toBeGreaterThan(0);
  });

  it('promotes only states the promotion_state column can hold', () => {
    const permitted = statesThePromotionColumnCanHold();
    expect([...PROMOTED_PATTERN_STATES].length).toBeGreaterThan(0);
    for (const state of PROMOTED_PATTERN_STATES) {
      expect(permitted).toContain(state);
    }
  });

  it('leaves the authoring and retirement states unpromoted', () => {
    expect([...PROMOTED_PATTERN_STATES]).not.toContain('draft');
    expect([...PROMOTED_PATTERN_STATES]).not.toContain('deprecated');
  });

  it('accepts a key in every state the catalog can actually promote it to', async () => {
    // Driven through the real resolver for each reachable state, so a
    // list that names only unreachable states fails here rather than
    // passing on a fixture nobody can produce.
    for (const state of PROMOTED_PATTERN_STATES) {
      await expect(
        resolvePromotedProgramPatternKey(' PAT-VALID-001 ', async () => ({
          topic_key: 'PAT-VALID-001',
          promotion_state: state,
        })),
      ).resolves.toBe('PAT-VALID-001');
    }
  });

  it('refuses every state the column can hold that is not promoted', async () => {
    const permitted = statesThePromotionColumnCanHold();
    const unpromoted = permitted.filter(
      (s) => !([...PROMOTED_PATTERN_STATES] as string[]).includes(s),
    );
    expect(unpromoted.length).toBeGreaterThan(0);
    for (const state of unpromoted) {
      await expect(
        resolvePromotedProgramPatternKey('PAT-VALID-001', async () => ({
          topic_key: 'PAT-VALID-001',
          promotion_state: state,
        })),
      ).rejects.toMatchObject({ code: 'program_pattern_not_promoted' });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// The classifier corpus is the authority everything else defers to
// ─────────────────────────────────────────────────────────────────────

describe('classifier corpus · reachability', () => {
  it('selects the corpus on states the promotion_state column can hold', async () => {
    // Same defect, same vocabulary, separate code path: the classifier's
    // own catalog query filtered on the three unreachable states, so it
    // returned nothing for every input and the classifier could not match
    // at all. Nothing downstream could notice — an empty corpus reads as
    // "no pattern fits this use case".
    const permitted = statesThePromotionColumnCanHold();
    jest.resetModules();

    const queryMock = jest.fn(async (..._args: unknown[]) => [] as unknown[]);
    jest.doMock('@/lib/data-plane/azureRead', () => ({
      __esModule: true,
      azureRead: { query: queryMock, select: jest.fn(async () => []), maybeSingle: jest.fn(async () => null) },
    }));

    const { classifyOrigination } = await import('../classifier');
    await classifyOrigination({
      useCase: 'Reduce denial write-offs across the network',
      tenancy: { clientId: 'client-1', userId: 'user-1' },
    } as never);

    const corpusCall = queryMock.mock.calls.find((call) =>
      String(call[0]).includes('FROM engagement_topics'),
    );
    expect(corpusCall).toBeDefined();
    const sql = String(corpusCall![0]);
    // The corpus must restrict on promotion state at all — an unrestricted
    // one would return drafts and retired patterns as live matches.
    expect(sql).toMatch(/promotion_state/i);

    const inline = [...sql.matchAll(/promotion_state[^)]*?IN\s*\(([^)]*)\)/gi)].flatMap((m) =>
      [...m[1].matchAll(/'([^']+)'/g)].map((q) => q[1]),
    );
    const bound = ((corpusCall![1] as unknown[]) ?? [])
      .filter((p): p is string[] => Array.isArray(p) && p.every((v) => typeof v === 'string'))
      .flat();
    const selectedStates = [...inline, ...bound];

    expect(selectedStates.length).toBeGreaterThan(0);
    for (const state of selectedStates) {
      expect(permitted).toContain(state);
    }
  });
});
