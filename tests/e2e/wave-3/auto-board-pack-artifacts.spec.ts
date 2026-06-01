import { expect, test } from '@playwright/test';

import type { MoveBusinessCaseInput } from '../../../src/lib/programs/move-business-case';
import { CHARTER_FUNCTION_PACK_KEY } from '../../../src/lib/programs/function-identity';
import { renderMoveAuditPackHtml } from '../../../src/lib/programs/expert-kernel/exports/audit-pack/html-renderer';
import {
  buildQuarterlyBoardPack,
  type QuarterlyBoardPackInput,
} from '../../../src/lib/programs/expert-kernel/exports/board-pack/quarterly-board-pack-model';
import { renderBoardPackHtml } from '../../../src/lib/programs/expert-kernel/exports/board-pack/html-renderer';
import type { BoardPack } from '../../../src/lib/tower/board-pack';

const move: MoveBusinessCaseInput = {
  industry_code: 'RETAIL',
  tenant_key: 'apexretail',
  tenant_name: 'Apex Retail',
  name: 'Reduce store labor overage without hurting service levels',
  charter: { [CHARTER_FUNCTION_PACK_KEY]: 'workforce_labor' },
  baseline_metrics: [
    {
      metric_name: 'Schedule adherence',
      value: 83,
      unit: 'percent',
      source: 'Workforce management baseline',
      as_of: '2026-05-01',
    },
  ],
};

const towerBoardPack: BoardPack = {
  tenantClientKey: 'apexretail',
  headline: 'Board pack: one decision needs the board.',
  topDecisions: [],
  spendAtRisk: {
    totalCommittedAmount: 10_900_000,
    earnedVerifiedAmount: 8_100_000,
    spendAtRiskAmount: 2_800_000,
    unevidencedClaimedAmount: 0,
    headline: '$2.8M of $10.9M committed value is not yet verified and evidence-backed.',
  },
  valueChange: {
    realizationRatio: 0.74,
    severity: 'watch',
    earningSummary: 'The portfolio is earning, but evidence gaps remain.',
    adoptionHeadline: 'Adoption telemetry is bound for the main program set.',
    adoptionInstrumentationGap: false,
  },
  actionsRequired: [],
  evidenceLinks: [],
  disclaimer: 'Deterministic composition.',
  deterministicSeed: true,
};

const boardInput: QuarterlyBoardPackInput = {
  clientKey: 'apexretail',
  clientLabel: 'Apex Retail',
  quarter: 'Q2 2026',
  generatedOn: '2026-06-01',
  towerBoardPack,
  moves: [
    {
      name: 'AI Store Labor',
      phase: 'Mobilize',
      status: 'watch',
      owner: 'VP Stores',
      nextGate: 'Bind value evidence',
    },
  ],
  blockedDecisions: [
    {
      move: 'AI Store Labor',
      decision: 'Approve value-evidence refresh before expansion',
      owner: 'CFO',
      timeInState: '12 days',
      rationale: 'The board needs evidence before approving the next wave.',
    },
  ],
  patterns: [
    {
      pattern: 'Evidence gap on value claim',
      evidence: 'One value claim lacks bound evidence.',
      action: 'Bind source evidence before external circulation.',
    },
  ],
  recommendedSequence: [
    {
      sequence: '1',
      move: 'AI Store Labor',
      rationale: 'Refresh evidence before expansion.',
    },
  ],
  riskHorizon: [
    {
      title: 'Evidence gap remains open',
      severity: 'high',
      exposure: 'One value claim is not evidence-backed.',
      nextAction: 'Assign owner before quarterly review.',
    },
  ],
  topQuestions: [
    {
      owner: 'CFO',
      question: 'Which value can we quote externally?',
      whyNow: 'The evidence gap remains open.',
    },
    {
      owner: 'CIO',
      question: 'Which gate is blocked?',
      whyNow: 'The next wave depends on evidence.',
    },
    {
      owner: 'COO',
      question: 'Which sequence changes next quarter?',
      whyNow: 'Expansion should wait for evidence.',
    },
  ],
};

test.describe('Wave 3 generated pack artifacts', () => {
  test('renders the per-Move audit pack without raw IDs', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.setContent(renderMoveAuditPackHtml(move, '2026-06-01'), {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByRole('heading', { name: /Per-Move Audit Pack/ })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Vendor SOW and BAA chain' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'AI Governance attestation' }),
    ).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/signal:[0-9a-f-]{8,}/i);
    expect(errors).toEqual([]);
  });

  test('renders the quarterly board pack with blocked-decision context', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    const html = renderBoardPackHtml(buildQuarterlyBoardPack(boardInput));
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('main').getByRole('heading', {
        name: /Apex Retail Q2 2026 Board Pack/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Blocked decisions with named owners and time in state',
      }),
    ).toBeVisible();
    await expect(page.getByText(/Owner: CFO/)).toBeVisible();
    await expect(page.getByText(/Time in state: 12 days/)).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/tenant_id|signal:/i);
    expect(errors).toEqual([]);
  });
});
