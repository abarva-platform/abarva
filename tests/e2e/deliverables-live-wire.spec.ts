import { expect, test } from '@playwright/test';
import { withClerkAuth, missingAuthPrereqs } from './_helpers/auth';
import {
  ensureProgramFixture,
  missingSupabasePrereqs,
  type ProgramFixtureState,
} from './_helpers/program-fixtures';
import {
  ensureDeliverableFixture,
  cleanupDeliverableFixture,
  type DeliverableFixtureState,
} from './_helpers/deliverable-fixtures';

// Fix Spec v4 §5 · Deliverables live-wire E2E.
//
// Seeds a deliverables_v2 + deliverable_versions row directly, then walks
// the actual Next.js routes · /engagements/[id]/deliverables and the
// detail page · to verify the listing + detail render from real DB reads.
// The AI generation step is intentionally skipped (slow, non-deterministic);
// the "live-wire" surface is the read/render path, which is what Prat will
// click through in the demo.

const FIXTURE = {
  clientNames: ['Meridian Health System', 'Meridian Health'],
  activeClientCookie: 'meridian',
  sponsor: {
    graphNodeId: 'person_e2e_deliverables_lars',
    name: 'Lars Mikkelsen',
    email: 'e2e.lars.mikkelsen@abarva.test',
    role: 'VP, Financial Operations',
    organization: 'Meridian Health System',
    familiarity: 'returning_recent' as const,
    communicationStyle: {
      title: 'VP, Financial Operations',
      cxo_function: 'Finance',
      unit: 'Financial Operations',
      primary_focus: 'Protect gross margin and DSO during EHR migration cutover.',
    },
  },
  engagement: {
    graphNodeId: 'eng_e2e_deliverables_lw',
    name: 'Meridian Margin Recovery Diagnostic',
    industryCode: 'HEALTHCARE_IDN',
    functionCode: 'MIDDLE_OFFICE',
    objectiveCode: 'OPTIMISE',
    topicCode: 'analytics_modernization',
    currentPhase: 1,
  },
} as const;

const DELIVERABLE_TITLE = 'Meridian Phase 1 Diagnostic Findings · Margin';
const STRUCTURED_SECTION_HEADING = 'executive_summary';
const STRUCTURED_SECTION_BODY =
  'Owned-brand gross margin is trailing plan by 175 bps for two consecutive quarters. Landed-cost visibility stops at FOB; markdown velocity on owned brands is 22% above national-brand anchors. Attribution spans sourcing, pricing, and trade promotion with no single accountable owner for the margin equation.';

const DELIVERABLE_CONTENT = `# Meridian Margin Recovery · Phase 1 Diagnostic Findings

## Executive summary
${STRUCTURED_SECTION_BODY}

## Root causes
- Landed-cost attribution gap (sourcing · freight · duty · rebate)
- Pricing system treats owned brands as price-takers of national-brand index
- Trade-promotion post-read cadence is monthly, not weekly

## Recommended interventions
- Landed-cost decomposition rebuild on existing data platform · 12-18 months
- Owned-brand cross-elasticity pricing discipline · 6-9 months
- Category P&L consolidation under single accountable owner · 3-6 month org move
`;

const missingPrereqs = [...missingAuthPrereqs, ...missingSupabasePrereqs];

let programState: ProgramFixtureState | null = null;
let deliverableState: DeliverableFixtureState | null = null;

test.describe.configure({ mode: 'serial' });

test.describe('Deliverables live-wire', () => {
  test.skip(missingPrereqs.length > 0, `Missing required env: ${missingPrereqs.join(', ')}`);

  test.beforeAll(async () => {
    programState = await ensureProgramFixture({
      clientNames: [...FIXTURE.clientNames],
      sponsor: FIXTURE.sponsor,
      engagement: FIXTURE.engagement,
      resetTurns: true,
    });

    deliverableState = await ensureDeliverableFixture({
      engagementId: programState.engagementId,
      deliverableTypeKey: 'diagnostic_findings',
      title: DELIVERABLE_TITLE,
      status: 'draft',
      content: DELIVERABLE_CONTENT,
      structuredData: {
        [STRUCTURED_SECTION_HEADING]: STRUCTURED_SECTION_BODY,
        root_causes: [
          'Landed-cost attribution gap',
          'Pricing system treats owned brands as price-takers',
          'Trade promotion post-read cadence is monthly',
        ],
        recommended_interventions: [
          'Landed-cost decomposition rebuild',
          'Cross-elasticity pricing discipline',
          'Category P&L consolidation',
        ],
      },
      qualityTotalScore: 86,
      qualityRemaining: ['Quantify trade-promo waste range with SKU-level variance'],
    });
  });

  test.afterAll(async () => {
    if (deliverableState) {
      await cleanupDeliverableFixture(deliverableState.deliverableId);
    }
  });

  test('listing renders the seeded deliverable and links to detail', async ({ page }) => {
    if (!programState || !deliverableState) throw new Error('Fixture not initialized');

    await withClerkAuth(page, FIXTURE.activeClientCookie);

    await page.goto(`/engagements/${FIXTURE.engagement.graphNodeId}/deliverables`);
    await expect(page).toHaveURL(new RegExp(`/engagements/${FIXTURE.engagement.graphNodeId}/deliverables$`));

    // Listing surface · v2 section header includes count; seeded row appears.
    await expect(page.getByText(/GENERATED · \d+/)).toBeVisible();
    await expect(page.getByText(DELIVERABLE_TITLE)).toBeVisible();
    await expect(page.getByText('QUALITY 86/100')).toBeVisible();
    await expect(page.getByText('diagnostic_findings', { exact: false })).toBeVisible();

    // Clicking the card routes to detail with the deliverable id.
    await page.getByRole('link', { name: /Meridian Phase 1 Diagnostic Findings/ }).click();
    await expect(page).toHaveURL(new RegExp(`/engagements/${FIXTURE.engagement.graphNodeId}/deliverables/${deliverableState.deliverableId}$`));
  });

  test('detail page renders meta + signal tiles + content sections', async ({ page }) => {
    if (!programState || !deliverableState) throw new Error('Fixture not initialized');

    await withClerkAuth(page, FIXTURE.activeClientCookie);

    const url = `/engagements/${FIXTURE.engagement.graphNodeId}/deliverables/${deliverableState.deliverableId}`;
    await page.goto(url);
    await expect(page).toHaveURL(new RegExp(url + '$'));

    // Meta header · type key + title + status + quality
    await expect(page.getByRole('heading', { name: DELIVERABLE_TITLE })).toBeVisible();
    await expect(page.getByText(/diagnostic_findings/)).toBeVisible();
    await expect(page.getByText('● draft')).toBeVisible();
    await expect(page.getByText('QUALITY 86/100')).toBeVisible();

    // Signal tiles · versions / quality / critical / remaining / resolved
    await expect(page.getByText('VERSIONS', { exact: false })).toBeVisible();
    await expect(page.getByText('CRITICAL', { exact: false })).toBeVisible();
    await expect(page.getByText('REMAINING', { exact: false })).toBeVisible();

    // Content sections · structured_data keys render with human labels
    await expect(page.getByText(/executive summary/i)).toBeVisible();
    await expect(page.getByText(STRUCTURED_SECTION_BODY)).toBeVisible();

    // Remaining quality issue surfaces the seeded copy.
    await expect(page.getByText(/Quantify trade-promo waste range/)).toBeVisible();

    // Back link returns to listing.
    await page.getByRole('link', { name: /deliverables/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/engagements/${FIXTURE.engagement.graphNodeId}/deliverables$`));
  });
});
