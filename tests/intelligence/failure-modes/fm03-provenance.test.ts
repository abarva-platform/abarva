/**
 * FM #3 — Provenance buried · INT-RGS
 *
 * Failure mode: a Sentinel response makes claims without
 * surfacing the underlying provenance. The mechanism: every
 * item in the bundle carries a `provenance` entry; the panel
 * (CB-5) renders one provenance card per item.
 *
 * This test asserts the bundle contract — every emitted fact /
 * chunk / pattern has a matching provenance citation. Once
 * CB-5 ships, a panel-side test verifies the rendering.
 */

import { runQuestion } from './_helpers/runQuestion';
import { getQuestionsByFailureMode } from './fixtures/questions';

describe('FM #3 — Provenance buried', () => {
  it('every fact in the bundle has a matching provenance entry', async () => {
    const questions = getQuestionsByFailureMode(3).filter(
      (q) => q.tenantKey !== null,
    );
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions.slice(0, 4)) {
      const { bundle } = await runQuestion(q);
      const provenanceIds = new Set(bundle.provenance.map((p) => p.sourceId));
      for (const fact of bundle.facts) {
        expect(provenanceIds.has(fact.recordId)).toBe(true);
      }
    }
  });

  it('every semantic-chunk hit has a matching provenance entry', async () => {
    const questions = getQuestionsByFailureMode(3).filter(
      (q) => q.tenantKey !== null,
    );
    for (const q of questions.slice(0, 2)) {
      const { bundle } = await runQuestion(q);
      const provenanceIds = new Set(bundle.provenance.map((p) => p.sourceId));
      for (const chunk of bundle.semanticChunks) {
        expect(provenanceIds.has(chunk.chunk.chunkId)).toBe(true);
      }
    }
  });

  it("provenance entries carry sourceClass for the panel's color coding", async () => {
    const q = getQuestionsByFailureMode(3).find((q) => q.tenantKey !== null);
    expect(q).toBeDefined();
    const { bundle } = await runQuestion(q!);
    for (const p of bundle.provenance) {
      expect(p.sourceClass).toBeDefined();
      expect([
        'private_client_data',
        'tenant_admin_upload',
        'corpus',
        'pattern_catalog',
        'synthetic',
        'unknown',
      ]).toContain(p.sourceClass);
    }
  });

  it('generic mode has zero provenance entries', async () => {
    const q = getQuestionsByFailureMode(3).find((q) => q.tenantKey !== null);
    const { bundle } = await runQuestion(q!, { mode: 'generic' });
    expect(bundle.provenance).toEqual([]);
  });

  // CB-5 dependent — actual panel render
  it.todo(
    "panel renders a provenance card for every bundle item (CB-5 panel test)",
  );

  // CB-6 dependent — LLM output
  it.todo(
    'every claim in a Sentinel response is matched to a provenance entry (post-hoc validator — CB-6)',
  );
});
