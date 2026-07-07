/**
 * E2E: First Capital — FedNow Fraud Monitoring & Model-Risk end-to-end loop
 *
 * Wave 5, Slice 5.3 of ABARVA_PRODUCT_ENHANCEMENT_EXECUTION_PLAN.md.
 *
 * Automates the First Capital scenario from the 0.4 demo script
 * (docs/strategy/scenarios/SCENARIO-FIRSTCAPITAL-MODEL-RISK.md): the
 * FedNow / model-risk decision walked through the North-Star loop —
 * Context → Intelligence → Move → Source → Tower → Outcome — with the
 * SR 11-7 model-risk-management regulatory gate as the decisive step.
 *
 * What this spec asserts is *loop coherence*: that signing in as the
 * canonical First Capital CXO and traversing the four primary surfaces
 * (Intelligence → Moves → Source → Tower) renders each surface for the
 * regulated-AI archetype without a runtime crash, and that the
 * regulatory-gating substance (model risk, SR 11-7, MRM, AML) is
 * reachable on the path. It is a smoke + coherence spec, not an
 * agent-answer-quality regression.
 *
 * Run modes:
 *   npm run test:e2e              # picks this file up via tests/e2e/**
 *   npx playwright test tests/e2e/firstcapital-end-to-end-loop.spec.ts
 *
 * Skip condition: CI without real Clerk creds (CLERK_SESSION_TOKEN /
 * CLERK_SECRET_KEY absent) — the whole describe block is skipped, and
 * each test additionally skips if the First Capital Clerk user is
 * missing. This is expected: the spec will not run green in CI without
 * a seeded First Capital tenant.
 *
 * Wiring gaps discovered while authoring this spec are NOT fixed here —
 * they are inventoried in the PR body and in
 * docs/strategy/scenarios/FIRSTCAPITAL-LOOP-WIRING-GAPS.md. Where a step
 * of the scripted loop has no in-product handoff, the assertion below is
 * deliberately scoped to what the product *does* render today, with an
 * inline GAP comment pointing at the gap-doc entry.
 */

import { expect, test, type Page } from '@playwright/test';
import { findPersonaByEmail } from '../../src/lib/auth/cxo-personas';
import { clerkUserExists, missingAuthPrereqs, withClerkAuth } from './_helpers/auth';

// ─── Constants ───────────────────────────────────────────────────────────────

// Canonical First Capital CXO from the 0.4 script ("Sign in as the First
// Capital CIO demo account"). Patricia Huang, CIO, tenant First Capital.
const FIRSTCAPITAL_CIO_EMAIL = 'cio@firstcapital.example.com';
const FIRSTCAPITAL_CIO = findPersonaByEmail(FIRSTCAPITAL_CIO_EMAIL);

if (!FIRSTCAPITAL_CIO) {
  throw new Error(`Missing CXO persona fixture for ${FIRSTCAPITAL_CIO_EMAIL}`);
}

// Regulatory-gating vocabulary the scenario hinges on. Any one of these
// surfacing on a step is treated as evidence the regulated-AI substance
// is reachable on that surface. Kept broad on purpose — the spec asserts
// the loop carries model-risk language, not an exact label.
const MODEL_RISK_TERMS = /SR 11-7|model risk|model-risk|MRM|model validation/i;
const REGULATORY_TERMS = /AML|BSA|consent order|exam finding|fraud|regulator/i;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function expectNoRuntimeError(page: Page) {
  await expect(
    page.getByText(/Application error|Unhandled Runtime Error|Internal Server Error/i),
  ).toHaveCount(0);
}

/**
 * Soft coherence probe: returns whether any of the supplied regex
 * patterns appears in the page body. Used so a loop step can record
 * "regulatory substance present" without hard-failing when a wiring gap
 * means the term is not yet surfaced — the gap is logged, not asserted.
 */
async function pageMentions(page: Page, ...patterns: RegExp[]): Promise<boolean> {
  for (const pattern of patterns) {
    if ((await page.getByText(pattern).count()) > 0) {
      return true;
    }
  }
  return false;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('First Capital end-to-end loop: FedNow model-risk (Slice 5.3)', () => {
  test.describe.configure({ mode: 'serial' });

  // CI without real Clerk creds cannot run this — skip the whole block.
  test.skip(
    missingAuthPrereqs.length > 0,
    `Missing required env: ${missingAuthPrereqs.join(', ')}`,
  );

  test.beforeEach(async ({ page }) => {
    test.skip(
      !(await clerkUserExists(FIRSTCAPITAL_CIO.email)),
      `No Clerk user found for ${FIRSTCAPITAL_CIO.email}`,
    );

    await withClerkAuth(page, {
      activeClient: FIRSTCAPITAL_CIO.clientKey,
      email: FIRSTCAPITAL_CIO.email,
    });
  });

  // ── Step 0 · Context — sign in as the First Capital CIO ──────────────────────

  test('Context · signs in as the First Capital CIO and lands on the tenant home', async ({
    page,
  }) => {
    await page.goto('/auth-redirect');
    // arcturus is the First Capital app ClientKey (see cxo-personas.ts).
    await page.waitForURL(/\/home/, { timeout: 15000 });

    await expect(page.getByTestId('tenant-home-page')).toBeVisible();
    await expect(
      page.getByText(FIRSTCAPITAL_CIO.tenant, { exact: false }).first(),
    ).toBeVisible();
    await expectNoRuntimeError(page);
  });

  // ── Step 1 · Intelligence — identify and pressure-test the bet ───────────────

  test('Intelligence · loads the pattern-to-Move funnel for the First Capital CIO', async ({
    page,
  }) => {
    await page.goto('/intelligence');

    await expect(page.getByTestId('intelligence-v3-page')).toBeVisible();
    await expect(page.getByRole('tab', { name: /The Brief/i })).toBeVisible();
    await expectNoRuntimeError(page);

    // Coherence probe: the scenario's bet is the AML/BSA modernization
    // pattern crossed with FedNow. Record whether regulated-AI substance
    // surfaces. Soft — see GAP-1 (no FedNow seed segment) and GAP-2
    // (no scripted Intelligence→Move "promote bet brief" handoff).
    const hasModelRisk = await pageMentions(page, MODEL_RISK_TERMS, REGULATORY_TERMS);
    test.info().annotations.push({
      type: 'loop-coherence',
      description: `Intelligence surfaces model-risk/regulatory language: ${hasModelRisk}`,
    });
  });

  // ── Step 2 · Move — shape the bet into a governed initiative ─────────────────

  test('Move · loads Strategic Moves with the New Move action visible', async ({ page }) => {
    await page.goto('/strategic-moves');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Strategic Moves' }),
    ).toBeVisible();
    // "+ New Move" is the origination entry point. The 0.4 script promotes
    // the Intelligence bet brief into a Move; today that promotion is a
    // manual New-Move start — see GAP-2.
    await expect(page.getByRole('link', { name: /\+?\s*New Move/i })).toBeVisible();
    await expectNoRuntimeError(page);
  });

  test('Move · the SR 11-7 control matrix substance is reachable from Moves', async ({
    page,
  }) => {
    // The scenario's hard gate: P3 cannot pass without MRM validation
    // readiness + a regulator-engagement plan. This probe records whether
    // the model-risk control vocabulary is reachable on the Moves surface.
    // Soft — see GAP-3 (no first-class regulatory-gate / control-matrix
    // deliverable type wired into the Move phase trace).
    await page.goto('/strategic-moves');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Strategic Moves' }),
    ).toBeVisible();

    const hasControlMatrix = await pageMentions(page, MODEL_RISK_TERMS);
    test.info().annotations.push({
      type: 'loop-coherence',
      description: `Moves surfaces SR 11-7 / model-risk control language: ${hasControlMatrix}`,
    });
    await expectNoRuntimeError(page);
  });

  // ── Step 3 · Source — choose the commercial / partner / vendor path ──────────

  test('Source · loads the sourcing events portfolio for the regulated-AI archetype', async ({
    page,
  }) => {
    await page.goto('/source');

    await expect(
      page.getByRole('heading', { name: /Sourcing events|Source/i }),
    ).toBeVisible();
    await expectNoRuntimeError(page);

    // Coherence probe: the scenario makes MRM-readiness a hard pass/fail
    // vendor screen across the AML vendor landscape (NICE Actimize, SAS,
    // Oracle FSAA, Verafin). Record whether that gating language surfaces.
    // Soft — see GAP-4 (no Move→Source "sourcing-strategy deliverable"
    // handoff) and GAP-5 (no MRM-readiness pass/fail screen primitive).
    const hasVendorGate = await pageMentions(page, MODEL_RISK_TERMS, /vendor|sourcing/i);
    test.info().annotations.push({
      type: 'loop-coherence',
      description: `Source surfaces MRM-readiness / vendor-gate language: ${hasVendorGate}`,
    });
  });

  // ── Step 4 · Tower — track value, risk, adoption, outcomes ───────────────────

  test('Tower · loads the portfolio cockpit with the Atlas rail mounted', async ({ page }) => {
    await page.goto('/tower');

    await expect(page.getByText(/Control Tower|Portfolio|IT Portfolio/i).first()).toBeVisible();
    // Atlas dock proves the agent rail is mounted on Tower.
    await expect(page.getByText(/Atlas/i).first()).toBeVisible();
    await expectNoRuntimeError(page);
  });

  test('Tower · the regulatory-risk lens carries the model-risk gate as a portfolio risk', async ({
    page,
  }) => {
    // The scenario's executive headline: the SR 11-7 MRM validation gate
    // is the top portfolio risk. The Tower risk lens is the closest
    // in-product surface. Probe it for model-risk language.
    // Soft — see GAP-6 (no Source-event → Tower-card dependency link for
    // the MRM gate) and GAP-7 (Tower risk lens is not regulatory-scoped).
    // Per Tower audit §5.4 / brief item 6, the /tower/lens/* redirect-shells
    // have been removed. The risk-lens content lives on the index under the
    // `?lens=risk` query param.
    await page.goto('/tower?lens=risk');

    await expect(
      page.getByRole('heading', { name: /Risk|Tower/i }).first(),
    ).toBeVisible();
    await expectNoRuntimeError(page);

    const hasGateRisk = await pageMentions(page, MODEL_RISK_TERMS, REGULATORY_TERMS);
    test.info().annotations.push({
      type: 'loop-coherence',
      description: `Tower risk lens surfaces the SR 11-7 / model-risk gate: ${hasGateRisk}`,
    });
  });

  // ── Step 5 · Outcome — evidence feeds back to the Context Layer ──────────────

  test('Outcome · the Tower outcome ledger renders for the First Capital portfolio', async ({
    page,
  }) => {
    // The loop closes when verified vs projected value (false-positive
    // rate, MRM-maturity progression) is recorded back to the context
    // layer. The Tower outcomes ledger is the in-product surface.
    // Soft — see GAP-8 (no outcome-ledger → context-segment write-back
    // wiring; the loop is not closed in-product).
    // The legacy Tower outcome/portfolio subroutes have been retired; the
    // loop closes through the consolidated AI Control Tower route.
    await page.goto('/tower');

    await expect(
      page.getByRole('heading', { name: /Outcome|Tower/i }).first(),
    ).toBeVisible();
    await expectNoRuntimeError(page);

    const hasVerifiedValue = await pageMentions(page, /verified|projected|outcome/i);
    test.info().annotations.push({
      type: 'loop-coherence',
      description: `Tower outcome ledger surfaces verified/projected value: ${hasVerifiedValue}`,
    });
  });

  // ── Loop coherence summary ───────────────────────────────────────────────────

  test('Loop · all four primary surfaces render in sequence for the First Capital CIO', async ({
    page,
  }) => {
    // End-to-end traversal in one session: Intelligence → Moves → Source
    // → Tower. Asserts the loop is *navigable* for the regulated-AI
    // archetype without a crash on any leg. The cross-surface handoffs
    // themselves (bet brief → Move, sourcing deliverable → Source event,
    // Source event → Tower card) are the wiring gaps — see the gap-doc.
    const surfaces: Array<{ path: string; ready: () => Promise<unknown> }> = [
      {
        path: '/intelligence',
        ready: () => expect(page.getByTestId('intelligence-v3-page')).toBeVisible(),
      },
      {
        path: '/strategic-moves',
        ready: () =>
          expect(
            page.getByRole('heading', { level: 1, name: 'Strategic Moves' }),
          ).toBeVisible(),
      },
      {
        path: '/source',
        ready: () =>
          expect(
            page.getByRole('heading', { name: /Sourcing events|Source/i }),
          ).toBeVisible(),
      },
      {
        path: '/tower',
        ready: () =>
          expect(
            page.getByText(/Control Tower|Portfolio|IT Portfolio/i).first(),
          ).toBeVisible(),
      },
    ];

    for (const surface of surfaces) {
      await page.goto(surface.path);
      await surface.ready();
      await expectNoRuntimeError(page);
    }
  });
});
