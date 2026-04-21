import { expect, test } from '@playwright/test';
import { withClerkAuth, missingAuthPrereqs } from './_helpers/auth';
import { buildNdjsonStream, mockNdjsonRoute } from './_helpers/stream-mock';
import {
  ensureProgramFixture,
  missingSupabasePrereqs,
  type ProgramFixtureState,
} from './_helpers/program-fixtures';

const FIXTURE = {
  clientNames: ['Meridian Health System', 'Meridian Health'],
  activeClientCookie: 'meridian',
  sponsor: {
    graphNodeId: 'person_e2e_phase_0_priya_raman',
    name: 'Priya Raman',
    email: 'e2e.priya.raman@abarva.test',
    role: 'VP, Revenue Cycle Transformation',
    organization: 'Meridian Health System',
    familiarity: 'first_meeting' as const,
    communicationStyle: {
      title: 'VP, Revenue Cycle Transformation',
      cxo_function: 'Operations',
      unit: 'Revenue Cycle',
      primary_focus: 'Stabilize prior authorization throughput and denials while protecting patient access.',
    },
  },
  engagement: {
    graphNodeId: 'eng_e2e_phase_0_smoke',
    name: 'Meridian Prior Auth Recovery',
    industryCode: 'HEALTHCARE_IDN',
    functionCode: 'MIDDLE_OFFICE',
    objectiveCode: 'OPTIMISE',
    topicCode: 'prior_authorization',
    currentPhase: 0,
  },
  labels: {
    industry: 'Healthcare IDN',
    function: 'Middle Office',
    objective: 'Optimise',
  },
};

const CREATE_CONFIRMATION_TEXT =
  'Got it. Creating Meridian Prior Auth Recovery — healthcare IDN, middle office, optimise objective, with Priya Raman as sponsor. Setting it up now.';

const PHASE_OPENER_TEXT =
  "Phase 1 opener: I'll start with the current-state breakpoints in prior auth, the denial leakage, and the systems handoff gaps we need to quantify.";

const missingPrereqs = [...missingAuthPrereqs, ...missingSupabasePrereqs];

let fixtureState: ProgramFixtureState | null = null;

test.describe.configure({ mode: 'serial' });

test.describe('Programs Phase 0 smoke', () => {
  test.skip(missingPrereqs.length > 0, `Missing required env: ${missingPrereqs.join(', ')}`);

  test.beforeAll(async () => {
    fixtureState = await ensureProgramFixture({
      clientNames: FIXTURE.clientNames,
      sponsor: FIXTURE.sponsor,
      engagement: FIXTURE.engagement,
      resetTurns: true,
    });
  });

  test('intake chat to gate approval stays deterministic and inline', async ({ page }) => {
    if (!fixtureState) throw new Error('Fixture not initialized');

    await withClerkAuth(page, FIXTURE.activeClientCookie);

    await mockNdjsonRoute(page, '**/api/engagements/create/turn', buildNdjsonStream([
      { type: 'delta', text: CREATE_CONFIRMATION_TEXT },
      {
        type: 'engagement_created',
        engagement: {
          id: fixtureState.engagementId,
          graph_node_id: FIXTURE.engagement.graphNodeId,
          name: FIXTURE.engagement.name,
          industry_code: FIXTURE.engagement.industryCode,
          function_code: FIXTURE.engagement.functionCode,
          objective_code: FIXTURE.engagement.objectiveCode,
          topic_code: FIXTURE.engagement.topicCode,
          current_phase: 0,
          sponsor_person_id: fixtureState.sponsorId,
        },
        sponsor: {
          graph_node_id: FIXTURE.sponsor.graphNodeId,
          name: FIXTURE.sponsor.name,
          role: FIXTURE.sponsor.role,
          organization: FIXTURE.sponsor.organization,
          title: FIXTURE.sponsor.communicationStyle.title,
          cxo_function: FIXTURE.sponsor.communicationStyle.cxo_function,
          primary_focus: FIXTURE.sponsor.communicationStyle.primary_focus,
        },
        labels: FIXTURE.labels,
        active_client: fixtureState.clientName,
      },
      { type: 'done' },
    ]));

    await mockNdjsonRoute(page, `**/api/engage/${FIXTURE.engagement.graphNodeId}/turn`, buildNdjsonStream([
      { type: 'stage', label: 'Checking pattern library', detail: '0 active patterns' },
      {
        type: 'delta',
        text: `Got it. Logging Phase 0 gate as approved. Generating the deliverable now.\n\n${PHASE_OPENER_TEXT}`,
      },
      { type: 'gate_approved', phase: 0, new_phase: 1 },
      { type: 'done', turnId: 'turn_e2e_phase_0_gate_approval' },
    ]));

    await page.goto('/engagements/new');
    await expect(page).toHaveURL(/\/engagements\/new$/);

    const composer = page.getByPlaceholder('Describe the program…');
    await expect(composer).toBeVisible();
    await composer.fill('Meridian needs a Phase 0 prior auth recovery program for denials, throughput, and systems handoffs.');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText(CREATE_CONFIRMATION_TEXT)).toBeVisible();
    await expect(page.getByText(FIXTURE.engagement.name)).toBeVisible();

    const manualStartButton = page.getByRole('button', { name: 'Start Phase 0 →' });
    if (await manualStartButton.isVisible().catch(() => false)) {
      await expect(page.getByText('Phase 0 · Intake')).toBeVisible();
      await expect(page.getByText(fixtureState.clientName)).toBeVisible();
      await expect(page.getByText(`${FIXTURE.sponsor.name} · ${FIXTURE.sponsor.communicationStyle.title}`)).toBeVisible();
      await expect(page.getByText(FIXTURE.labels.industry)).toBeVisible();
      await expect(page.getByText(FIXTURE.labels.function)).toBeVisible();
      await expect(page.getByText(FIXTURE.labels.objective)).toBeVisible();
      await manualStartButton.click();
    }

    await expect(page).toHaveURL(new RegExp(`/engagements/${FIXTURE.engagement.graphNodeId}$`));
    await expect(page.getByText(FIXTURE.engagement.name)).toBeVisible();
    await expect(page.getByText(FIXTURE.sponsor.name)).toBeVisible();
    await expect(page.getByText(FIXTURE.sponsor.role)).toBeVisible();
    await expect(page.getByText('0 · Start')).toBeVisible();

    const phaseComposer = page.getByPlaceholder('Your reply…');
    await expect(phaseComposer).toBeVisible();
    await phaseComposer.fill('Approved. Start Phase 1.');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText('✓ Phase 0 approved · advancing to Phase 1…')).toBeVisible();
    await expect(page.getByText(PHASE_OPENER_TEXT)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/engagements/${FIXTURE.engagement.graphNodeId}$`));
  });
});
