/**
 * FM #6 — Tenant-context unused · INT-RGS
 *
 * Failure mode: an authenticated user's tenant data is loaded
 * but the agent's response treats them as cold. The mechanism:
 * tenant-grounded mode is the default for `/programs/<id>` and
 * `/admin`; the broker bundle for those surfaces populates
 * facts/graphPaths/chunks for the active tenant.
 */

import { runQuestion } from './_helpers/runQuestion';
import { getQuestionsByFailureMode } from './fixtures/questions';
import { composeSentinelSystemPrompt } from '@/lib/agent/voice-doctrine/sentinel';

describe('FM #6 — Tenant-context unused', () => {
  it('tenant-mode bundle for an Apex question carries Apex tenantKey', async () => {
    const apexQuestions = getQuestionsByFailureMode(6).filter(
      (q) => q.tenantKey === 'apex-retail',
    );
    expect(apexQuestions.length).toBeGreaterThan(0);
    const { bundle } = await runQuestion(apexQuestions[0]!);
    expect(bundle.tenantKey).toBe('apex-retail');
    expect(bundle.mode).toBe('tenant');
  });

  it('tenant-mode bundle for a Meridian question carries Meridian tenantKey', async () => {
    const meridianQuestions = getQuestionsByFailureMode(6).filter(
      (q) => q.tenantKey === 'meridian-health',
    );
    expect(meridianQuestions.length).toBeGreaterThan(0);
    const { bundle } = await runQuestion(meridianQuestions[0]!);
    expect(bundle.tenantKey).toBe('meridian-health');
    expect(bundle.mode).toBe('tenant');
  });

  it('the system prompt for /admin defaults to tenant mode', () => {
    const prompt = composeSentinelSystemPrompt({
      mode: 'tenant',
      tenantKey: 'apex-retail',
      surface: '/admin',
      vectorIndexPending: true,
      worldviewPending: true,
    });
    expect(prompt).toContain('defaults to tenant mode');
    expect(prompt).toContain('apex-retail');
  });

  it('the system prompt for /programs defaults to full mode', () => {
    const prompt = composeSentinelSystemPrompt({
      mode: 'full',
      tenantKey: 'apex-retail',
      surface: '/programs/apex-cdp-2026',
      vectorIndexPending: true,
      worldviewPending: true,
    });
    expect(prompt).toContain('defaults to full mode');
    expect(prompt).toContain('apex-retail');
  });

  it('the system prompt for /intelligence defaults to corpus mode', () => {
    const prompt = composeSentinelSystemPrompt({
      mode: 'corpus',
      tenantKey: null,
      surface: '/intelligence',
      vectorIndexPending: true,
      worldviewPending: true,
    });
    expect(prompt).toContain('defaults to corpus mode');
    expect(prompt).toContain('unauthenticated cold visitor');
  });

  // CB-3 dependent — vector retrieval populates chunks
  it.todo(
    'tenant-mode bundle for an Apex question populates >=1 facts and >=1 chunks once Pinecone is live (CB-3)',
  );

  // CB-6 dependent — actual model output
  it.todo(
    'authenticated tenant-grounded response cites at least one tenant record id (LLM-dependent — CB-6)',
  );
});
