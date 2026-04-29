/**
 * commit_program tool — Surface 1 PR1.5 verification
 *
 * Locks in the UUID-shape validation that fails fast (with an actionable
 * recovery message) when the agent passes a role title or name as
 * sponsor_person_id instead of a real persons.id UUID. Caught Anand's
 * walkthrough where Steward passed "CTO" and the platform returned a
 * generic "write error" the user couldn't recover from.
 *
 * The full handler (originateProgram path) is not exercised here; that
 * requires DB integration. We test only the pre-flight validation
 * which is pure and the highest-leverage failure surface.
 */

import { commitProgramTool } from '../program/commitProgram';

function makeCtx(surface = '/programs/new') {
  return {
    request: new Request('http://localhost/'),
    surface,
  };
}

describe('commit_program · sponsor/lead UUID pre-flight', () => {
  it('rejects role-title sponsor_person_id with actionable recovery', async () => {
    const result = await commitProgramTool.handler(
      {
        program_name: 'AI Led Product Lifecycle Transformation',
        problem_statement: 'CapEx + DORA transformation',
        sponsor_person_id: 'CTO',
      },
      makeCtx(),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/invalid_sponsor_person_id/);
      expect(result.recovery).toMatch(/role/);
      expect(result.recovery).toMatch(/full name/);
    }
  });

  it('rejects a personal name as sponsor_person_id', async () => {
    const result = await commitProgramTool.handler(
      {
        program_name: 'Test',
        problem_statement: 'Test',
        sponsor_person_id: 'Lin Martinez',
      },
      makeCtx(),
    );
    expect(result.success).toBe(false);
  });

  it('rejects a role-title lead_person_id when sponsor is valid', async () => {
    const result = await commitProgramTool.handler(
      {
        program_name: 'Test',
        problem_statement: 'Test',
        sponsor_person_id: '00000000-0000-0000-0000-000000000001',
        lead_person_id: 'Head of Platform',
      },
      makeCtx(),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/invalid_lead_person_id/);
    }
  });

  it('passes the UUID gate for properly-shaped ids (further failures from the DB are reported separately)', async () => {
    const result = await commitProgramTool.handler(
      {
        program_name: 'Test',
        problem_statement: 'Test',
        sponsor_person_id: '11111111-2222-3333-4444-555555555555',
      },
      makeCtx(),
    );
    // Passes pre-flight; downstream failure is from the auth/DB layer, not
    // the UUID validator. We don't assert success vs failure here — just
    // that the UUID gate did NOT short-circuit it.
    expect(
      result.success === false &&
        ('error' in result ? result.error.startsWith('invalid_sponsor_person_id') : false),
    ).toBe(false);
  });
});
