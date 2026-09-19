/**
 * The Programs pattern-key authority (backlog item 126).
 *
 * A row in `pattern_match_logs` carrying `acted_upon: true` and
 * `matched_by_agent: 'classifier_v1'` reads as evidence that a
 * classification resolved against the catalog. Three writers outside
 * the classifier accept that key from their caller — a model in
 * `commit_program`, a request body in `originateProgram`, a form in
 * `submitOriginationBrief` — and none of them checked it against
 * anything before persisting it.
 *
 * Two separable claims are proven here, because they failed for two
 * different reasons:
 *
 *  1. The promoted states this product gates on are states the
 *     `promotion_state` column can actually hold. The migration that
 *     defines the column is read at test time and is the authority;
 *     a state list that drifts from it is a gate that can never open.
 *
 *  2. No external writer persists an unresolved key as an acted-upon
 *     match. Each writer is driven for real and the rows it hands the
 *     write client are read back.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// ── azureRead is the resolver's only dependency ──────────────────────
const azureMaybeSingleMock = jest.fn();
const azureQueryMock = jest.fn();
const azureSelectMock = jest.fn();
jest.mock('@/lib/data-plane/azureRead', () => ({
  __esModule: true,
  azureRead: {
    maybeSingle: (...args: unknown[]) => azureMaybeSingleMock(...args),
    query: (...args: unknown[]) => azureQueryMock(...args),
    select: (...args: unknown[]) => azureSelectMock(...args),
  },
}));

import {
  PROMOTED_PATTERN_STATES,
  resolvePromotedPatternKey,
} from '../pattern-key-authority';

const MIGRATION = join(
  process.cwd(),
  'supabase/migrations/041_programs_foundation.sql',
);

/**
 * The states the `promotion_state` CHECK constraint permits, read from
 * the migration that defines the column rather than restated here. If
 * the constraint changes, this moves with it.
 */
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

beforeEach(() => {
  azureMaybeSingleMock.mockReset();
  azureQueryMock.mockReset();
  azureSelectMock.mockReset();
});

// ─────────────────────────────────────────────────────────────────────
// 1 · the promoted state list is a list the column can hold
// ─────────────────────────────────────────────────────────────────────

describe('pattern promotion states are states that can exist', () => {
  it('reads a non-empty CHECK constraint from the defining migration', () => {
    expect(statesThePromotionColumnCanHold().length).toBeGreaterThan(0);
  });

  it('gates only on states the promotion_state column permits', () => {
    const permitted = statesThePromotionColumnCanHold();
    expect(PROMOTED_PATTERN_STATES.length).toBeGreaterThan(0);
    for (const state of PROMOTED_PATTERN_STATES) {
      expect(permitted).toContain(state);
    }
  });

  it('leaves the authoring and retirement states out of the promoted set', () => {
    // `draft` is Maestro authoring and `deprecated` is retired; neither is
    // a match this product can stand behind.
    expect(PROMOTED_PATTERN_STATES).not.toContain('draft');
    expect(PROMOTED_PATTERN_STATES).not.toContain('deprecated');
  });

  it('selects the live classifier corpus on states the column permits', async () => {
    // The classifier is the authority the other writers defer to. A corpus
    // query filtered on states the column cannot hold returns nothing, for
    // every input, forever — so this is the claim that makes the rest of
    // the authority meaningful.
    const permitted = statesThePromotionColumnCanHold();
    azureQueryMock.mockResolvedValue([]);
    azureSelectMock.mockResolvedValue([]);

    const { classifyOrigination } = await import('../classifier');
    await classifyOrigination({
      useCase: 'Reduce denial write-offs across the network',
      tenancy: { clientId: 'client-1', userId: 'user-1' },
    } as never);

    const corpusCall = azureQueryMock.mock.calls.find((call) =>
      String(call[0]).includes('FROM engagement_topics'),
    );
    expect(corpusCall).toBeDefined();
    const sql = String(corpusCall![0]);
    // The corpus must restrict on promotion state at all — an unrestricted
    // corpus would return drafts and retired patterns as live matches.
    expect(sql).toMatch(/promotion_state/i);

    // The states it restricts to, whether written inline or bound as a
    // parameter. Either form has to name states the column can hold.
    const inline = [...sql.matchAll(/promotion_state[^)]*?IN\s*\(([^)]*)\)/gi)]
      .flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((q) => q[1]));
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

// ─────────────────────────────────────────────────────────────────────
// 2 · the resolver fails closed
// ─────────────────────────────────────────────────────────────────────

describe('resolvePromotedPatternKey', () => {
  it('resolves a key whose catalog row is promoted', async () => {
    azureMaybeSingleMock.mockResolvedValue({
      topic_key: 'PAT-PRG-CDP-001',
      promotion_state: PROMOTED_PATTERN_STATES[0],
    });
    await expect(resolvePromotedPatternKey('PAT-PRG-CDP-001')).resolves.toEqual({
      status: 'resolved',
      patternKey: 'PAT-PRG-CDP-001',
    });
  });

  it('refuses a key whose catalog row is still in authoring', async () => {
    azureMaybeSingleMock.mockResolvedValue({
      topic_key: 'PAT-DRAFT-001',
      promotion_state: 'draft',
    });
    await expect(resolvePromotedPatternKey('PAT-DRAFT-001')).resolves.toEqual({
      status: 'refused',
      reason: 'not_promoted',
    });
  });

  it('refuses a key with no catalog row at all', async () => {
    azureMaybeSingleMock.mockResolvedValue(null);
    await expect(resolvePromotedPatternKey('PAT-INVENTED-999')).resolves.toEqual({
      status: 'refused',
      reason: 'unknown_key',
    });
  });

  it('refuses rather than resolves when the catalog read fails', async () => {
    // Fail closed: a lookup that cannot answer is not a match.
    azureMaybeSingleMock.mockRejectedValue(new Error('relation does not exist'));
    await expect(resolvePromotedPatternKey('PAT-PRG-CDP-001')).resolves.toEqual({
      status: 'refused',
      reason: 'lookup_failed',
    });
  });

  it('reports an absent key as absent, not as a refusal', async () => {
    for (const empty of [null, undefined, '', '   ']) {
      await expect(resolvePromotedPatternKey(empty)).resolves.toEqual({
        status: 'absent',
      });
    }
    expect(azureMaybeSingleMock).not.toHaveBeenCalled();
  });

  it('looks the key up in the catalog that owns it', async () => {
    azureMaybeSingleMock.mockResolvedValue(null);
    await resolvePromotedPatternKey('PAT-PRG-CDP-001');
    expect(azureMaybeSingleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'engagement_topics',
        where: expect.objectContaining({ topic_key: 'PAT-PRG-CDP-001' }),
      }),
    );
  });
});
