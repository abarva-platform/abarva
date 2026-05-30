import { buildAtlasSynthesisPrompt } from './route';

describe('Tower Atlas synthesis prompt', () => {
  it('inherits the shared agent output contract', () => {
    const prompt = buildAtlasSynthesisPrompt(
      'USER CONTEXT',
      'ACCESS POLICY',
      'RESTRICTED OUTPUT',
      'DEMO CONTEXT',
    );

    expect(prompt).toContain('AGENT OUTPUT CONTRACT v2026-05-09');
    expect(prompt).toContain('Surface family: tower');
    expect(prompt).toContain('lead-bullets, lead-table, stat-stack, sequential-steps, or brief-narrative');
    expect(prompt).toContain('do not emit raw markdown emphasis markers');
    expect(prompt).toContain('do not show raw pattern, use-case, or vendor IDs');
    expect(prompt).toContain('Prefer lead-bullets for the Tower quote');
  });
});

