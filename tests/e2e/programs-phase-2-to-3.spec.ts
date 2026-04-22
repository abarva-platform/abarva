import { expect, test } from '@playwright/test';
import { withClerkAuth, missingEngagementPrereqs } from './_helpers/auth';
import { buildNdjsonStream, mockNdjsonRoute } from './_helpers/stream-mock';
import {
  ensureProgramFixture,
  updateEngagementState,
  type ProgramFixtureState,
} from './_helpers/program-fixtures';

const FIXTURE = {
  clientNames: ['Apex Retail Group', 'Apex Retail'],
  activeClientCookie: 'apexretail',
  sponsor: {
    graphNodeId: 'person_e2e_phase_2_3_priya_patel',
    name: 'Priya Patel',
    email: 'e2e.priya.patel@abarva.test',
    role: 'VP, Store Operations',
    organization: 'Apex Retail Group',
    familiarity: 'frequent_collaborator' as const,
    communicationStyle: {
      title: 'VP, Store Operations',
      cxo_function: 'Operations',
      unit: 'Store Operations',
      primary_focus: 'Improve associate productivity and store execution without adding frontline complexity.',
    },
  },
  engagement: {
    graphNodeId: 'eng_e2e_phase_2_to_3',
    name: 'Apex Store Ops Productivity',
    industryCode: 'RETAIL',
    functionCode: 'OPERATIONS',
    objectiveCode: 'TRANSFORM',
    topicCode: 'store_associate_productivity',
    currentPhase: 2,
    gatesPassed: [
      {
        phase: 0,
        status: 'approved',
        signed_at: '2026-04-02T15:00:00.000Z',
        signed_by: 'person_e2e_phase_2_3_priya_patel',
        approval_text: 'Phase 0 approved.',
        summary: 'Intake is complete.',
      },
      {
        phase: 1,
        status: 'approved',
        signed_at: '2026-04-07T15:00:00.000Z',
        signed_by: 'person_e2e_phase_2_3_priya_patel',
        approval_text: 'Phase 1 approved.',
        summary: 'Diagnostic is complete.',
      },
    ],
  },
};

const PHASE_OPENER_TEXT = "Design's signed off. Execute phase starts now...";
const missingPrereqs = missingEngagementPrereqs();

let fixtureState: ProgramFixtureState | null = null;

test.describe.configure({ mode: 'serial' });

test.describe('Programs Phase 2 to 3', () => {
  test.skip(missingPrereqs.length > 0, `Missing required env: ${missingPrereqs.join(', ')}`);

  test.beforeAll(async () => {
    fixtureState = await ensureProgramFixture({
      clientNames: FIXTURE.clientNames,
      sponsor: FIXTURE.sponsor,
      engagement: FIXTURE.engagement,
      resetTurns: true,
    });
  });

  test('approval turn advances Design to Execute inline', async ({ page }) => {
    if (!fixtureState) throw new Error('Fixture not initialized');

    await withClerkAuth(page, FIXTURE.activeClientCookie);

    await mockNdjsonRoute(page, `**/api/engage/${FIXTURE.engagement.graphNodeId}/turn`, async () => {
      await updateEngagementState(fixtureState!.engagementId, {
        current_phase: 3,
        gates_passed: [
          ...(FIXTURE.engagement.gatesPassed ?? []),
          {
            phase: 2,
            status: 'approved',
            signed_at: new Date().toISOString(),
            signed_by: fixtureState!.sponsorId,
            approval_text: 'Phase 2 approved.',
            summary: 'Design is signed off.',
          },
        ],
      });

      return buildNdjsonStream([
        { type: 'stage', label: 'Pulling topic playbooks', detail: '1 assigned' },
        { type: 'delta', text: `Approved. ${PHASE_OPENER_TEXT}` },
        { type: 'gate_approved', phase: 2, new_phase: 3 },
        { type: 'done', turnId: 'turn_e2e_phase_2_3_gate' },
      ]);
    });

    await page.goto(`/engagements/${FIXTURE.engagement.graphNodeId}`);
    await expect(page.getByText(FIXTURE.engagement.name)).toBeVisible();
    await expect(page.getByText('2 · Design')).toBeVisible();

    const composer = page.getByPlaceholder('Your reply…');
    await composer.fill('Approved. Lock the design and start execution.');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText('✓ Phase 2 approved · advancing to Phase 3…')).toBeVisible();
    await expect(page.getByText(PHASE_OPENER_TEXT)).toBeVisible();
    await expect(page.getByText('3 · Execute')).toBeVisible({ timeout: 7000 });
    await expect(page.getByText('P3 · Execute')).toBeVisible({ timeout: 7000 });
  });
});
