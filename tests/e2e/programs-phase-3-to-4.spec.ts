import { expect, test } from '@playwright/test';
import { withClerkAuth, missingEngagementPrereqs } from './_helpers/auth';
import { buildNdjsonStream, mockNdjsonRoute } from './_helpers/stream-mock';
import {
  ensureProgramFixture,
  updateEngagementState,
  type ProgramFixtureState,
} from './_helpers/program-fixtures';

// The production Stripe invoice creation happens server-side once the real
// engage route records a phase-4 approval. This UI-level test still verifies
// the 3→4 transition, while the invoice path is better covered by a server
// integration test.

const FIXTURE = {
  clientNames: ['First Capital Financial', 'Arcturus Financial Group', 'First Capital'],
  activeClientCookie: 'arcturus',
  sponsor: {
    graphNodeId: 'person_e2e_phase_3_4_mina_shah',
    name: 'Mina Shah',
    email: 'e2e.mina.shah@abarva.test',
    role: 'Head of Commercial Banking Operations',
    organization: 'First Capital Financial',
    familiarity: 'active_program',
    communicationStyle: {
      title: 'Head of Commercial Banking Operations',
      cxo_function: 'Operations',
      unit: 'Commercial Banking',
      primary_focus: 'Improve banker throughput and reduce manual review effort across the lending workflow.',
    },
  },
  engagement: {
    graphNodeId: 'eng_e2e_phase_3_to_4',
    name: 'First Capital Analytics Modernization',
    industryCode: 'FINSERV',
    functionCode: 'MIDDLE_OFFICE',
    objectiveCode: 'MODERNISE',
    topicCode: 'analytics_modernization',
    currentPhase: 3,
    outcomeFeeUsd: 125000,
    outcomeFeeStatus: 'proposed',
    gatesPassed: [
      {
        phase: 0,
        status: 'approved',
        signed_at: '2026-04-01T15:00:00.000Z',
        signed_by: 'person_e2e_phase_3_4_mina_shah',
        approval_text: 'Phase 0 approved.',
        summary: 'Intake is complete.',
      },
      {
        phase: 1,
        status: 'approved',
        signed_at: '2026-04-05T15:00:00.000Z',
        signed_by: 'person_e2e_phase_3_4_mina_shah',
        approval_text: 'Phase 1 approved.',
        summary: 'Diagnostic is complete.',
      },
      {
        phase: 2,
        status: 'approved',
        signed_at: '2026-04-10T15:00:00.000Z',
        signed_by: 'person_e2e_phase_3_4_mina_shah',
        approval_text: 'Phase 2 approved.',
        summary: 'Design is signed off.',
      },
    ],
  },
};

const PHASE_OPENER_TEXT = 'Execute is complete. Outcome verification phase...';
const missingPrereqs = missingEngagementPrereqs();

let fixtureState: ProgramFixtureState | null = null;

test.describe.configure({ mode: 'serial' });

test.describe('Programs Phase 3 to 4', () => {
  test.skip(missingPrereqs.length > 0, `Missing required env: ${missingPrereqs.join(', ')}`);

  test.beforeAll(async () => {
    fixtureState = await ensureProgramFixture({
      clientNames: FIXTURE.clientNames,
      sponsor: FIXTURE.sponsor,
      engagement: FIXTURE.engagement,
      resetTurns: true,
    });
  });

  test('approval turn advances Execute to Verify inline', async ({ page }) => {
    if (!fixtureState) throw new Error('Fixture not initialized');

    await withClerkAuth(page, FIXTURE.activeClientCookie);

    await mockNdjsonRoute(page, `**/api/engage/${FIXTURE.engagement.graphNodeId}/turn`, async () => {
      await updateEngagementState(fixtureState!.engagementId, {
        current_phase: 4,
        gates_passed: [
          ...(FIXTURE.engagement.gatesPassed ?? []),
          {
            phase: 3,
            status: 'approved',
            signed_at: new Date().toISOString(),
            signed_by: fixtureState!.sponsorId,
            approval_text: 'Phase 3 approved.',
            summary: 'Execute is complete.',
          },
        ],
        outcome_fee_usd: FIXTURE.engagement.outcomeFeeUsd,
        outcome_fee_status: FIXTURE.engagement.outcomeFeeStatus,
      });

      return buildNdjsonStream([
        { type: 'stage', label: 'Pulling peer decisions', detail: '3 precedents' },
        { type: 'delta', text: `Approved. ${PHASE_OPENER_TEXT}` },
        { type: 'gate_approved', phase: 3, new_phase: 4 },
        { type: 'done', turnId: 'turn_e2e_phase_3_4_gate' },
      ]);
    });

    await page.goto(`/engagements/${FIXTURE.engagement.graphNodeId}`);
    await expect(page.getByText(FIXTURE.engagement.name)).toBeVisible();
    await expect(page.getByText('3 · Execute')).toBeVisible();

    const composer = page.getByPlaceholder('Your reply…');
    await composer.fill('Approved. Execute is complete, move us into verification.');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText('✓ Phase 3 approved · advancing to Phase 4…')).toBeVisible();
    await expect(page.getByText(PHASE_OPENER_TEXT)).toBeVisible();
    await expect(page.getByText('4 · Verify')).toBeVisible({ timeout: 7000 });
    await expect(page.getByText('P4 · Verify')).toBeVisible({ timeout: 7000 });

  });
});
