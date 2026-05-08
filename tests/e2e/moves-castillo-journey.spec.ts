/**
 * E2E: Castillo Journey Kit — MH-06 → Strategic Move end-to-end
 *
 * Waypoints covered:
 *   PROBE 8-3  — "Shape into a Move →" CTA exists on initiative detail page
 *   PROBE 8-4  — CTA carries correct URL params (fromInitiative, fromId, fromGapUsd)
 *   PROBE 8-5  — /strategic-moves/new opens with Nexus 2D context message
 *   PROBE 8-6  — Scaffold fills to 4/4 REQ via mocked chat turns
 *   PROBE 8-7  — "Promote to P1 Charter →" is active when 4/4 filled
 *   PROBE 8-8  — Promote creates Move and redirects to detail page
 *
 * Uses:
 *   - CLERK_SESSION_TOKEN for auth (admin account, meridian active client)
 *   - page.route() mocks for /api/chat/agent and /api/programs/origination-submit
 *   - No Supabase reads/writes — the move detail page redirect is mocked
 *
 * Skip condition: CLERK_SESSION_TOKEN absent (CI without real Clerk creds).
 */

import { test, expect, type Page } from '@playwright/test';
import { AUTH_TOKEN, BASE_URL, BASE_HOST } from './_helpers/env';

// ─── Constants ───────────────────────────────────────────────────────────────

const MH06_INITIATIVE_SLUG = 'meridian-llm-sap-joule-2025';
const MH06_DETAIL_URL = `/admin/ai-initiatives/${MH06_INITIATIVE_SLUG}`;
const E2E_MOVE_ID = 'e2e-castillo-journey-mock-uuid';

const missingPrereqs = [!AUTH_TOKEN ? 'CLERK_SESSION_TOKEN' : null].filter(Boolean);

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function withMeridianAuth(page: Page) {
  if (!AUTH_TOKEN) throw new Error('CLERK_SESSION_TOKEN missing');
  await page.context().addCookies([
    {
      name: '__session',
      value: AUTH_TOKEN,
      domain: BASE_HOST,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: BASE_URL.startsWith('https://'),
    },
    {
      name: 'abarva_active_client',
      value: 'meridian',
      domain: BASE_HOST,
      path: '/',
      sameSite: 'Lax',
      secure: BASE_URL.startsWith('https://'),
    },
  ]);
}

// ─── Mock stream builders ─────────────────────────────────────────────────────
//
// The /api/chat/agent route streams raw text. Artifacts are embedded inline
// using the [[artifact:type]]...JSON...[[/artifact]] sentinel format.
// We return three deterministic turns that progressively fill the 4 required
// scaffold fields (problem-statement, archetype, sponsor-candidate, scope-boundary).

function buildTurn1Stream(): string {
  // Turn 1: fills fields 01 (hypothesis) + 03 (sponsor) + 04 (scope)
  const artifact = JSON.stringify({
    fieldsTotal: 7,
    fieldsFilled: 3,
    fields: [
      { id: 'problem-statement', label: "What's the bet / hypothesis", status: 'filled', value: 'RPA pipeline stalled — Finance on manual SAP extraction, Joule blocked. 90-day sprint to restore data flow.' },
      { id: 'archetype', label: 'Archetype classification', status: 'empty' },
      { id: 'sponsor-candidate', label: 'Sponsor candidate', status: 'filled', value: 'Nina Patel (CFO) — budget authority and direct team impact confirmed' },
      { id: 'scope-boundary', label: 'Scope / boundary', status: 'filled', value: 'Finance team only; 90-day sprint; excludes other depts and Joule feature expansion' },
      { id: 'evidence-family', label: 'Evidence family selection', status: 'empty' },
      { id: 'value-hypothesis', label: 'Value hypothesis seed', status: 'filled', value: 'UNVALIDATED_HYPOTHESIS — majority of value gap recoverable by Q3' },
      { id: 'foundation-readiness', label: 'Foundation readiness', status: 'empty' },
    ],
  });
  return (
    "Nina, that's a clear signal and a well-bounded scope. I've captured hypothesis, sponsor, and scope. " +
    'One more thing needed — **archetype classification**. Does this framing match your intent? ' +
    'If yes, I\'ll move to archetype classification next.\n\n' +
    `[[artifact:brief-progress]]${artifact}[[/artifact]]`
  );
}

function buildTurn2Stream(): string {
  // Turn 2: fills field 02 (archetype) — all 4/4 required now complete
  const artifact = JSON.stringify({
    fieldsTotal: 7,
    fieldsFilled: 4,
    fields: [
      { id: 'problem-statement', label: "What's the bet / hypothesis", status: 'filled', value: 'RPA pipeline stalled — Finance on manual SAP extraction, Joule blocked. 90-day sprint to restore data flow.' },
      { id: 'archetype', label: 'Archetype classification', status: 'filled', value: 'Workflow Automation (WA) — restoring RPA pipeline; broken workflow, not missing AI capability' },
      { id: 'sponsor-candidate', label: 'Sponsor candidate', status: 'filled', value: 'Nina Patel (CFO) — budget authority and direct team impact confirmed' },
      { id: 'scope-boundary', label: 'Scope / boundary', status: 'filled', value: 'Restore existing pipeline only · Finance team · 90-day sprint · hand back to SAP COE · no rebuild or new features' },
      { id: 'evidence-family', label: 'Evidence family selection', status: 'empty' },
      { id: 'value-hypothesis', label: 'Value hypothesis seed', status: 'filled', value: 'UNVALIDATED_HYPOTHESIS — majority of value gap recoverable by Q3' },
      { id: 'foundation-readiness', label: 'Foundation readiness', status: 'empty' },
    ],
  });
  return (
    'Workflow Automation is the right call — broken pipeline restoration fits the archetype cleanly. ' +
    'Recording that as high confidence. All four required sections are complete. ' +
    'You can promote to P1 Charter when ready.\n\n' +
    `[[artifact:brief-progress]]${artifact}[[/artifact]]`
  );
}

function buildPromoteResponse() {
  return {
    ok: true,
    engagementId: E2E_MOVE_ID,
    name: 'Stalled RPA pipeline migration blocking Joule automation — Finance on manual SAP extraction',
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.describe('Castillo Journey Kit — MH-06 → Strategic Move', () => {
  test.skip(missingPrereqs.length > 0, `Missing required env: ${missingPrereqs.join(', ')}`);

  // ── PROBE 8-3 / 8-4: CTA exists on initiative detail page with correct params ──

  test('PROBE 8-3/8-4 — "Shape into a Move →" CTA on MH-06 detail page', async ({ page }) => {
    await withMeridianAuth(page);
    await page.goto(MH06_DETAIL_URL);

    // CTA must be visible
    const cta = page.getByTestId('shape-into-move-cta');
    await expect(cta).toBeVisible({ timeout: 10_000 });
    await expect(cta).toContainText('Shape into a Move');

    // Verify required URL params are wired up
    const href = await cta.getAttribute('href');
    expect(href).toContain('fromInitiative=1');
    expect(href).toContain('fromId=MH-06');
    expect(href).toContain('fromGapUsd=');
    expect(href).toContain('/strategic-moves/new');

    // Gap should be non-zero (MH-06 has a $1.8M gap)
    const gapMatch = href?.match(/fromGapUsd=(\d+)/);
    expect(gapMatch).not.toBeNull();
    expect(Number(gapMatch![1])).toBeGreaterThan(0);
  });

  // ── PROBE 8-5: /strategic-moves/new opens with 2D context message ──

  test('PROBE 8-5 — /strategic-moves/new shows Nexus 2D context from MH-06', async ({ page }) => {
    await withMeridianAuth(page);

    const params = new URLSearchParams({
      fromInitiative: '1',
      fromId: 'MH-06',
      fromName: 'Joule (SAP) Pilot for Finance',
      fromStatus: 'value_lag',
      fromOwner: 'SAP COE',
      fromGoal: 'Restore margin · accelerate financial recovery',
      fromGapUsd: '1800000',
    });

    await page.goto(`/strategic-moves/new?${params.toString()}`);

    // Nexus opening message must reference the initiative and value gap
    await expect(page.getByText('MH-06')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/1\.8M|1,800,000/)).toBeVisible();
    // Value Lag pattern note
    await expect(page.getByText(/Value Lag|value.lag/i)).toBeVisible();
  });

  // ── PROBE 8-6 / 8-7: Chat fills scaffold 4/4, promote button activates ──

  test('PROBE 8-6/8-7 — scaffold fills to 4/4 via chat, promote button activates', async ({ page }) => {
    await withMeridianAuth(page);

    let chatCallCount = 0;
    await page.route('**/api/chat/agent', async (route) => {
      chatCallCount++;
      const body = chatCallCount === 1 ? buildTurn1Stream() : buildTurn2Stream();
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body,
      });
    });

    const params = new URLSearchParams({
      fromInitiative: '1',
      fromId: 'MH-06',
      fromName: 'Joule (SAP) Pilot for Finance',
      fromStatus: 'value_lag',
      fromOwner: 'SAP COE',
      fromGoal: 'Restore margin · accelerate financial recovery',
      fromGapUsd: '1800000',
    });

    await page.goto(`/strategic-moves/new?${params.toString()}`);

    // Send Turn 1: describe root cause, sponsor, scope
    const input = page.getByPlaceholder(/Describe the outcome|pick a step/i);
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill('Root cause is the RPA pipeline migration stalled — Finance team is still on manual SAP extraction. I should sponsor this as CFO. Scope: 90-day value-recovery sprint for Finance team only.');
    await page.keyboard.press('Enter');

    // Wait for scaffold update from Turn 1 (3/4 fields)
    await expect(page.getByText(/archetype/i).first()).toBeVisible({ timeout: 10_000 });

    // Send Turn 2: archetype classification
    await input.fill('Yes exactly right. Archetype: Workflow Automation — we are restoring an RPA pipeline. WA fits.');
    await page.keyboard.press('Enter');

    // Wait for scaffold to show 4/4 filled (Promote button activates)
    const promoteBtn = page.getByRole('button', { name: /Promote to P1 Charter/i });
    await expect(promoteBtn).toBeEnabled({ timeout: 15_000 });

    // Verify scaffold status label
    await expect(page.getByText(/4.*REQ|4 OF 4/i)).toBeVisible();
  });

  // ── PROBE 8-8: Promote creates Move and redirects to detail page ──

  test('PROBE 8-8 — promote creates Move and redirects to detail page', async ({ page }) => {
    await withMeridianAuth(page);

    let chatCallCount = 0;
    await page.route('**/api/chat/agent', async (route) => {
      chatCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: chatCallCount === 1 ? buildTurn1Stream() : buildTurn2Stream(),
      });
    });

    await page.route('**/api/programs/origination-submit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildPromoteResponse()),
      });
    });

    const params = new URLSearchParams({
      fromInitiative: '1',
      fromId: 'MH-06',
      fromName: 'Joule (SAP) Pilot for Finance',
      fromStatus: 'value_lag',
      fromOwner: 'SAP COE',
      fromGoal: 'Restore margin · accelerate financial recovery',
      fromGapUsd: '1800000',
    });

    await page.goto(`/strategic-moves/new?${params.toString()}`);

    const input = page.getByPlaceholder(/Describe the outcome|pick a step/i);
    await expect(input).toBeVisible({ timeout: 10_000 });

    await input.fill('Root cause is the RPA pipeline stall — Finance team on manual SAP extraction. Sponsor: myself (CFO). Scope: Finance only, 90-day sprint.');
    await page.keyboard.press('Enter');

    await input.fill('Archetype is Workflow Automation. WA fits — broken pipeline, not missing AI capability.');
    await page.keyboard.press('Enter');

    const promoteBtn = page.getByRole('button', { name: /Promote to P1 Charter/i });
    await expect(promoteBtn).toBeEnabled({ timeout: 15_000 });

    await promoteBtn.click();

    // Should redirect to the Move detail page
    await expect(page).toHaveURL(new RegExp(`/strategic-moves/${E2E_MOVE_ID}`), { timeout: 10_000 });
  });
});
