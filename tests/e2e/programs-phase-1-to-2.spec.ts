import { expect, test } from '@playwright/test';
import { withClerkAuth, missingEngagementPrereqs } from './_helpers/auth';
import { buildNdjsonStream, mockNdjsonRoute } from './_helpers/stream-mock';
import {
  ensureProgramFixture,
  updateEngagementState,
  type ProgramFixtureState,
} from './_helpers/program-fixtures';

const FIXTURE = {
  clientNames: ['Meridian Health System', 'Meridian Health'],
  activeClientCookie: 'meridian',
  sponsor: {
    graphNodeId: 'person_e2e_phase_1_2_alex_navarro',
    name: 'Alex Navarro',
    email: 'e2e.alex.navarro@abarva.test',
    role: 'Director, Patient Access',
    organization: 'Meridian Health System',
    familiarity: 'frequent_collaborator' as const,
    communicationStyle: {
      title: 'Director, Patient Access',
      cxo_function: 'Operations',
      unit: 'Patient Access',
      primary_focus: 'Reduce prior auth delays and shorten authorization turnaround for specialty care.',
    },
  },
  engagement: {
    graphNodeId: 'eng_e2e_phase_1_to_2',
    name: 'Meridian Intake Modernization',
    industryCode: 'HEALTHCARE_IDN',
    functionCode: 'FRONT_OFFICE',
    objectiveCode: 'OPTIMISE',
    topicCode: 'prior_authorization',
    currentPhase: 1,
    gatesPassed: [
      {
        phase: 0,
        status: 'approved',
        signed_at: '2026-04-01T15:00:00.000Z',
        signed_by: 'person_e2e_phase_1_2_alex_navarro',
        approval_text: 'Phase 0 approved.',
        summary: 'Intake is ready to diagnose.',
      },
    ],
  },
};

const PHASE_OPENER_TEXT = 'Diagnostic is approved. Time to design...';
const missingPrereqs = missingEngagementPrereqs();

let fixtureState: ProgramFixtureState | null = null;

test.describe.configure({ mode: 'serial' });

test.describe('Programs Phase 1 to 2', () => {
  test.skip(missingPrereqs.length > 0, `Missing required env: ${missingPrereqs.join(', ')}`);

  test.beforeAll(async () => {
    fixtureState = await ensureProgramFixture({
      clientNames: FIXTURE.clientNames,
      sponsor: FIXTURE.sponsor,
      engagement: FIXTURE.engagement,
      resetTurns: true,
    });
  });

  test('approval turn advances Diagnose to Design inline', async ({ page }) => {
    if (!fixtureState) throw new Error('Fixture not initialized');

    await withClerkAuth(page, FIXTURE.activeClientCookie);

    await mockNdjsonRoute(page, `**/api/engage/${FIXTURE.engagement.graphNodeId}/turn`, async () => {
      await updateEngagementState(fixtureState!.engagementId, {
        current_phase: 2,
        gates_passed: [
          ...(FIXTURE.engagement.gatesPassed ?? []),
          {
            phase: 1,
            status: 'approved',
            signed_at: new Date().toISOString(),
            signed_by: fixtureState!.sponsorId,
            approval_text: 'Phase 1 approved.',
            summary: 'Diagnostic is complete.',
          },
        ],
      });

      return buildNdjsonStream([
        { type: 'stage', label: 'Checking pattern library', detail: '2 active patterns' },
        { type: 'delta', text: `Approved. ${PHASE_OPENER_TEXT}` },
        { type: 'gate_approved', phase: 1, new_phase: 2 },
        { type: 'done', turnId: 'turn_e2e_phase_1_2_gate' },
      ]);
    });

    await page.goto(`/engagements/${FIXTURE.engagement.graphNodeId}`);
    await expect(page.getByText(FIXTURE.engagement.name)).toBeVisible();
    await expect(page.getByText('1 · Diagnose')).toBeVisible();

    const composer = page.getByPlaceholder('Your reply…');
    await composer.fill('Approved. Lock the diagnostic and move into design.');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText('✓ Phase 1 approved · advancing to Phase 2…')).toBeVisible();
    await expect(page.getByText(PHASE_OPENER_TEXT)).toBeVisible();
    await expect(page.getByText('2 · Design')).toBeVisible({ timeout: 7000 });
    await expect(page.getByText('P2 · Design')).toBeVisible({ timeout: 7000 });
  });
});
