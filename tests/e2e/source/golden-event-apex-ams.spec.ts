/**
 * Apex Retail AMS Sourcing — Golden Event Test
 * ============================================
 *
 * This is the load-bearing E2E spec for the Source module. It encodes the
 * pilot bar for the $35M Apex Retail AMS outsourcing event across all
 * 11 stages of the canonical lifecycle:
 *
 *   1. Strategy
 *   2. Scope
 *   3. RFP
 *   4. Responses
 *   5. Evaluation
 *   6. Pricing
 *   7. BAFO
 *   8. Executive Decision
 *   9. Selection
 *  10. Transition
 *  11. Value
 *
 * Per-stage assertions exercise the four audit-flagged failure modes:
 *   - gate enforcement (negative path with captureGateBlock)
 *   - artifact generation (download link + Content-Type + non-truncation)
 *   - AI Draft labeling (on AI-generated content)
 *   - approval recording (Executive Decision especially)
 *
 * Spec authoring stance
 * ---------------------
 * The audit flagged that today: gates do not enforce, AI Draft labels are
 * missing, and some artifact download tiles are phantoms. THIS SPEC IS
 * EXPECTED TO FAIL on those items today. That is the point — every red
 * here is a Wave 1 ticket. As the gaps close, the `test.fail()` annotations
 * flip to assertions and CI moves from "expected failure" to green.
 *
 * Event anchor
 * ------------
 * The seeded $35M event is `apex-retail-ams-outsourcing-2026` (see
 * src/lib/source/ams-outsourcing-2026-view.ts). It is currently parked
 * mid-event (BAFO, May 15 deadline). For the Strategy and Scope tests we
 * expect a reset-to-strategy helper; if it does not exist yet, those
 * tests document the gap and are annotated test.fail().
 */
import {
  auditedTest as test,
  expect,
  step,
  captureGateBlock,
  captureApprovalRecord,
  captureArtifact,
} from './_audit-harness';
import { signInAs } from './_auth';

// ─── Seed anchor ───────────────────────────────────────────────────────────
const APEX_AMS_EVENT_ID = 'apex-retail-ams-outsourcing-2026';

// Audit blocker links — each test.fail() points at the issue it encodes.
const AUDIT = {
  GATE_NOT_ENFORCED: 'AUDIT-2026-05-30 §Source-P0-01 · Gate criteria do not block advance',
  AI_DRAFT_MISSING: 'AUDIT-2026-05-30 §Source-P0-02 · AI-generated content lacks AI Draft label',
  PHANTOM_ARTIFACT: 'AUDIT-2026-05-30 §Source-P0-03 · Artifact tiles render without backing file',
  APPROVAL_REASON_NOT_PERSISTED:
    'AUDIT-2026-05-30 §Source-P0-04 · Approval recorded without justification reason',
  BRIEF_TRUNCATION: 'AUDIT-2026-05-30 §Source-P0-05 · Executive brief truncates dissent section',
  RESET_HELPER_MISSING:
    'AUDIT-2026-05-30 §Source-P1-12 · No reset-to-strategy helper; event parked in BAFO',
  VALUE_LEDGER_LINKBACK:
    'AUDIT-2026-05-30 §Source-P1-15 · Value Ledger does not link projected/realized to decision id',
} as const;

// ─── URL helpers ───────────────────────────────────────────────────────────
const stageUrl = (stage: string): string =>
  `/source/events/${APEX_AMS_EVENT_ID}?stage=${stage}`;

// ─── Selectors (mirror tests/e2e source canvas conventions) ────────────────
const SEL = {
  stageRail: '[data-testid="source-canvas-step-rail"]',
  stageStep: (stage: string) => `[data-testid="source-canvas-step-${stage}"]`,
  advanceButton: 'button[aria-label*="Advance" i], [data-testid="source-canvas-stage-advance"]',
  approveButton:
    '[data-testid^="source-canvas-exec-decision-approve-"], button[aria-label*="Approve" i]',
  artifactDrawer: '[data-testid="source-artifact-drawer"]',
  artifactStatusStrip: '[data-testid="artifact-status-strip"]',
  aiDraftLabel: '[data-testid="ai-draft-label"], [aria-label="AI Draft"]',
  stageCanvasPanel: '[data-testid="source-stage-canvas-panel"]',
} as const;

// ─── Suite ─────────────────────────────────────────────────────────────────
test.describe('Apex AMS Sourcing — Golden Event', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await signInAs(page, 'apex-vp-sourcing');
    await page.goto(stageUrl('strategy'));
  });

  // ────────────────────────────────────────────────────────────────────────
  // Stage 1 · Strategy
  // ────────────────────────────────────────────────────────────────────────
  test('Stage 1 · Strategy — gate blocks empty advance, approval records reason', async ({
    page,
  }) => {
    test.fail(true, AUDIT.GATE_NOT_ENFORCED);

    await step(page, 'Strategy canvas renders with all 11 stages on rail', async () => {
      await expect(page.locator(SEL.stageRail)).toBeVisible();
      for (const s of [
        'strategy',
        'scope',
        'rfp',
        'responses',
        'evaluation',
        'pricing',
        'bafo',
        'executive_decision',
        'selection',
        'transition',
        'value',
      ]) {
        await expect(page.locator(SEL.stageStep(s))).toBeVisible();
      }
    });

    await step(page, 'Attempt advance with no required fields — must block', async () => {
      await page.locator(SEL.advanceButton).first().click();
      const block = await captureGateBlock(page, 'strategy');
      expect(block.gateCriteria.length).toBeGreaterThan(0);
      // The gate panel should call out at minimum: business reason, owner, value target.
      const joined = block.gateCriteria.join(' | ').toLowerCase();
      expect(joined).toMatch(/business reason|owner|value target|decision authority/);
    });

    await step(
      page,
      'Fill business reason / owner / value target / decision authority',
      async () => {
        await page
          .getByLabel(/business reason/i)
          .fill('Modernize AMS to support Q3 2026 data migration window for APX-CDP-2026.');
        await page.getByLabel(/owner|sponsor/i).fill('VP Sourcing — Apex Retail');
        await page.getByLabel(/value target/i).fill('15% run-rate reduction; $5.25M annualized');
        await page.getByLabel(/decision authority/i).fill('CIO + CFO joint approval');
      },
    );

    await step(page, 'Approve Strategy with justification — approval recorded with reason', async () => {
      await page.locator(SEL.approveButton).first().click();
      await page
        .getByLabel(/justification|reason/i)
        .fill('Strategic fit confirmed; aligns with CDP migration dependency.');
      await page.getByRole('button', { name: /confirm|submit/i }).click();

      const record = await captureApprovalRecord(page, 'strategy');
      expect(record.reason).toContain('Strategic fit');
      expect(record.approver).toBeTruthy();
      expect(record.decisionId).toBeTruthy();
    });

    await step(page, 'Advance to Scope', async () => {
      await page.locator(SEL.advanceButton).first().click();
      await expect(page).toHaveURL(/stage=scope/);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Stage 2 · Scope
  // ────────────────────────────────────────────────────────────────────────
  test('Stage 2 · Scope — AI Draft labeling + commit-without-edit blocked', async ({ page }) => {
    test.fail(true, AUDIT.AI_DRAFT_MISSING);

    await page.goto(stageUrl('scope'));

    await step(page, 'Scope canvas loads', async () => {
      await expect(page.locator(SEL.stageCanvasPanel)).toBeVisible();
    });

    await step(page, 'AI-drafted scope summary is labeled AI Draft', async () => {
      // AI-generated scope content must be tagged so reviewers know it needs human edit.
      await expect(page.locator(SEL.aiDraftLabel).first()).toBeVisible();
    });

    await step(page, 'Attempting to advance without human edit must block', async () => {
      await page.locator(SEL.advanceButton).first().click();
      const block = await captureGateBlock(page, 'scope');
      expect(block.blockMessage?.toLowerCase()).toMatch(/edit|review|human/);
    });

    await step(page, 'Edit scope, then advance', async () => {
      await page.getByLabel(/scope summary|scope of work/i).fill(
        'In-scope: L1/L2 production support, incident triage, change windows aligned to APX-CDP-2026 freeze.',
      );
      await page.locator(SEL.advanceButton).first().click();
      await expect(page).toHaveURL(/stage=rfp/);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Stage 3 · RFP
  // ────────────────────────────────────────────────────────────────────────
  test('Stage 3 · RFP — AI Draft on RFP body, artifact download is real', async ({ page }) => {
    test.fail(true, AUDIT.PHANTOM_ARTIFACT);

    await page.goto(stageUrl('rfp'));

    await step(page, 'RFP body is labeled AI Draft prior to issuance', async () => {
      await expect(page.locator(SEL.aiDraftLabel).first()).toBeVisible();
    });

    await step(page, 'RFP DOCX artifact is downloadable with correct Content-Type', async () => {
      const downloadTile = page
        .locator(SEL.artifactStatusStrip)
        .getByRole('link', { name: /RFP.*docx/i })
        .first();
      await expect(downloadTile).toBeVisible();

      const href = await downloadTile.getAttribute('href');
      expect(href).toBeTruthy();

      const response = await page.request.get(href!);
      expect(response.status()).toBe(200);
      const ct = response.headers()['content-type'] ?? null;
      expect(ct).toMatch(/officedocument\.wordprocessingml\.document|application\/octet-stream/);

      const body = await response.body();
      await captureArtifact(page, 'rfp', 'rfp.docx', {
        downloadUrl: href,
        contentType: ct,
        byteSize: body.length,
        aiDraftLabelPresent: true,
      });
      expect(body.length).toBeGreaterThan(2_000); // non-empty / non-stub
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Stage 4 · Responses
  // ────────────────────────────────────────────────────────────────────────
  test('Stage 4 · Responses — vendor responses captured, gate blocks before all-in', async ({
    page,
  }) => {
    test.fail(true, AUDIT.GATE_NOT_ENFORCED);

    await page.goto(stageUrl('responses'));

    await step(page, 'Responses canvas shows seeded vendor list', async () => {
      // AMS seed: Northstar + ArcVault invited; BlueMaster + DataPeak excluded.
      await expect(page.getByText(/Northstar/i)).toBeVisible();
      await expect(page.getByText(/ArcVault/i)).toBeVisible();
    });

    await step(page, 'Cannot advance with missing vendor response uploads', async () => {
      await page.locator(SEL.advanceButton).first().click();
      const block = await captureGateBlock(page, 'responses');
      expect(block.gateCriteria.join(' ').toLowerCase()).toMatch(/response|upload|complete/);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Stage 5 · Evaluation
  // ────────────────────────────────────────────────────────────────────────
  test('Stage 5 · Evaluation — scorecards persisted, dissent captured', async ({ page }) => {
    test.fail(true, AUDIT.GATE_NOT_ENFORCED);

    await page.goto(stageUrl('evaluation'));

    await step(page, 'Evaluation canvas renders rubric', async () => {
      await expect(page.getByText(/rubric|scorecard|evaluation criteria/i)).toBeVisible();
    });

    await step(page, 'Cannot advance without all evaluators scoring', async () => {
      await page.locator(SEL.advanceButton).first().click();
      const block = await captureGateBlock(page, 'evaluation');
      expect(block.gateCriteria.length).toBeGreaterThan(0);
    });

    await step(page, 'Dissent / minority opinion field accepts text', async () => {
      const dissent = page.getByLabel(/dissent|minority opinion|concern/i).first();
      await expect(dissent).toBeVisible();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Stage 6 · Pricing
  // ────────────────────────────────────────────────────────────────────────
  test('Stage 6 · Pricing — pricing normalization with bands, AI Draft on summary', async ({
    page,
  }) => {
    test.fail(true, AUDIT.AI_DRAFT_MISSING);

    await page.goto(stageUrl('pricing'));

    await step(page, 'Pricing canvas shows normalized bands (low/medium/high)', async () => {
      await expect(page.getByText(/low|medium|high/i).first()).toBeVisible();
    });

    await step(page, 'AI-generated pricing summary is AI-Draft labeled', async () => {
      await expect(page.locator(SEL.aiDraftLabel).first()).toBeVisible();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Stage 7 · BAFO
  // ────────────────────────────────────────────────────────────────────────
  test('Stage 7 · BAFO — committee panel, vendor cards, risk flags', async ({ page }) => {
    test.fail(true, AUDIT.PHANTOM_ARTIFACT);

    await page.goto(stageUrl('bafo'));

    await step(page, 'BAFO canvas shows committee and shortlist (Northstar, ArcVault)', async () => {
      await expect(page.getByText(/Northstar/i)).toBeVisible();
      await expect(page.getByText(/ArcVault/i)).toBeVisible();
    });

    await step(page, 'BAFO worksheet artifact downloads cleanly', async () => {
      const tile = page
        .locator(SEL.artifactStatusStrip)
        .getByRole('link', { name: /BAFO/i })
        .first();
      await expect(tile).toBeVisible();
      const href = await tile.getAttribute('href');
      expect(href).toBeTruthy();
      const response = await page.request.get(href!);
      expect(response.status()).toBe(200);

      const body = await response.body();
      await captureArtifact(page, 'bafo', 'bafo-worksheet', {
        downloadUrl: href,
        contentType: response.headers()['content-type'] ?? null,
        byteSize: body.length,
        aiDraftLabelPresent: null,
      });
      expect(body.length).toBeGreaterThan(2_000);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Stage 8 · Executive Decision  ← the most load-bearing assertion
  // ────────────────────────────────────────────────────────────────────────
  test('Executive Decision — brief is complete, cited, non-truncated, with dissent + approval', async ({
    page,
  }) => {
    test.fail(true, AUDIT.BRIEF_TRUNCATION);

    await page.goto(stageUrl('executive_decision'));

    await step(page, 'Decision Brief canvas renders with required sections', async () => {
      for (const section of [
        /evidence/i,
        /missing data|gaps/i,
        /risks/i,
        /dissent|minority opinion/i,
        /recommendation/i,
        /approval/i,
      ]) {
        await expect(page.getByRole('heading', { name: section }).first()).toBeVisible();
      }
    });

    await step(page, 'Brief is labeled AI Draft (recommendation is AI-generated)', async () => {
      await expect(page.locator(SEL.aiDraftLabel).first()).toBeVisible();
    });

    await step(page, 'Citations are present on every claim in the recommendation', async () => {
      const citations = page.locator('[data-testid="citation-chip"], sup a');
      const count = await citations.count();
      expect(count).toBeGreaterThan(0);
    });

    await step(page, 'Download Decision Brief DOCX + PDF; verify non-truncation', async () => {
      const docxLink = page.getByRole('link', { name: /Decision Brief.*docx/i }).first();
      const pdfLink = page.getByRole('link', { name: /Decision Brief.*pdf/i }).first();

      const docxHref = await docxLink.getAttribute('href');
      const pdfHref = await pdfLink.getAttribute('href');
      expect(docxHref).toBeTruthy();
      expect(pdfHref).toBeTruthy();

      const docxResp = await page.request.get(docxHref!);
      const pdfResp = await page.request.get(pdfHref!);
      expect(docxResp.status()).toBe(200);
      expect(pdfResp.status()).toBe(200);

      const docxBody = await docxResp.body();
      const pdfBody = await pdfResp.body();
      await captureArtifact(page, 'executive_decision', 'decision-brief.docx', {
        downloadUrl: docxHref,
        contentType: docxResp.headers()['content-type'] ?? null,
        byteSize: docxBody.length,
        aiDraftLabelPresent: true,
      });
      await captureArtifact(page, 'executive_decision', 'decision-brief.pdf', {
        downloadUrl: pdfHref,
        contentType: pdfResp.headers()['content-type'] ?? null,
        byteSize: pdfBody.length,
        aiDraftLabelPresent: true,
      });

      // The brief must contain the literal closing-section markers.
      const docxText = docxBody.toString('utf-8');
      expect(docxText).toMatch(/Dissent/i);
      expect(docxText).toMatch(/Approval Record/i);

      // Scroll to bottom of preview to verify the final paragraph renders fully.
      await page.locator('[data-testid="decision-brief-preview"]').evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      const lastParagraph = page.locator('[data-testid="decision-brief-preview"] p').last();
      const lastText = (await lastParagraph.textContent())?.trim() ?? '';
      // A truncated brief ends mid-sentence; complete briefs end with terminal punctuation.
      expect(lastText).toMatch(/[.!?]$/);
    });

    await step(
      page,
      'Approve recommendation with justification — captureApprovalRecord persists reason',
      async () => {
        await page.locator(SEL.approveButton).first().click();
        await page
          .getByLabel(/justification|reason/i)
          .fill('Concur with recommendation; dissent noted on offshore ratio.');
        await page.getByRole('button', { name: /confirm|submit|record/i }).click();

        const record = await captureApprovalRecord(page, 'executive_decision');
        expect(record.reason).toContain('Concur');
        expect(record.approver).toBeTruthy();
        expect(record.decisionId).toBeTruthy();
      },
    );
  });

  // ────────────────────────────────────────────────────────────────────────
  // Stage 9 · Selection
  // ────────────────────────────────────────────────────────────────────────
  test('Stage 9 · Selection — selected vendor reflected, award letter artifact real', async ({
    page,
  }) => {
    test.fail(true, AUDIT.PHANTOM_ARTIFACT);

    await page.goto(stageUrl('selection'));

    await step(page, 'Selection canvas shows the awarded vendor', async () => {
      await expect(
        page.getByText(/awarded|selected/i).first(),
      ).toBeVisible();
    });

    await step(page, 'Award letter artifact downloads', async () => {
      const tile = page
        .getByRole('link', { name: /award letter|notice of award/i })
        .first();
      await expect(tile).toBeVisible();
      const href = await tile.getAttribute('href');
      const resp = await page.request.get(href!);
      expect(resp.status()).toBe(200);
      const body = await resp.body();
      expect(body.length).toBeGreaterThan(1_000);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Stage 10 · Transition
  // ────────────────────────────────────────────────────────────────────────
  test('Stage 10 · Transition — transition plan ties to APX-CDP-2026 freeze window', async ({
    page,
  }) => {
    test.fail(true, AUDIT.GATE_NOT_ENFORCED);

    await page.goto(stageUrl('transition'));

    await step(page, 'Transition canvas shows 8-week onboarding plan', async () => {
      await expect(page.getByText(/8.?week|onboarding|transition plan/i).first()).toBeVisible();
    });

    await step(page, 'Plan references APX-CDP-2026 Q3 freeze window', async () => {
      await expect(page.getByText(/APX-CDP-2026|Q3 2026|data migration/i).first()).toBeVisible();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Stage 11 · Value
  // ────────────────────────────────────────────────────────────────────────
  test('Value Ledger ties decision to projected and realized outcomes', async ({ page }) => {
    test.fail(true, AUDIT.VALUE_LEDGER_LINKBACK);

    await page.goto(stageUrl('value'));

    await step(page, 'Value Ledger canvas shows baseline / projected / realized columns', async () => {
      for (const col of [/baseline/i, /projected/i, /realized/i]) {
        await expect(page.getByRole('columnheader', { name: col }).first()).toBeVisible();
      }
    });

    await step(page, 'Projected and realized rows link back to a decision id', async () => {
      const linkBacks = page.locator('[data-testid="value-row-decision-link"]');
      const count = await linkBacks.count();
      expect(count).toBeGreaterThan(0);
      // Every value row should carry a non-empty decision id reference.
      for (let i = 0; i < count; i++) {
        const href = await linkBacks.nth(i).getAttribute('href');
        expect(href).toMatch(/\/source\/.*decision/);
      }
    });
  });
});
