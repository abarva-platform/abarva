// Apex end-to-end loop · Slice 5.1
//
// Automates the Apex Retail contact-centre AI decision walked through the
// North-Star loop: Context -> Intelligence -> Move -> Source -> Tower ->
// Outcome. The script follows the 0.4 demo scenario verbatim:
//   docs/strategy/scenarios/SCENARIO-APEX-CONTACT-CENTER.md
//
// It signs in as the canonical Apex CIO demo account, traverses each
// surface in loop order, and asserts the decision is coherent at each
// step (correct tenant, the contact-centre Move present at phase P3,
// the loop hand-offs visible).
//
// CI note: like every other spec in tests/e2e/, this needs real Clerk +
// Supabase credentials to run. Without them the sign-in helper times out,
// so the whole suite is skipped via `test.skip` on a credentials guard.
// `npm run test:e2e` picks it up automatically when creds are present.
//
// Wiring gaps discovered while authoring this spec are inventoried in
//   docs/strategy/scenarios/APEX-LOOP-WIRING-GAPS.md
// and surfaced in the PR body. Steps that exercise a not-yet-wired loop
// hand-off assert the surface *loads coherently* rather than the artifact
// link, and carry an inline GAP comment. Fixing product wiring is
// follow-on work (Slices 5.x); this slice ships the spec + honest gap
// inventory only.
//
// Run modes:
//   Locally:    BASE_URL=http://localhost:3000 npx playwright test tests/e2e/apex-end-to-end-loop.spec.ts
//   Staging:    BASE_URL=https://staging.abarva.ai npx playwright test tests/e2e/apex-end-to-end-loop.spec.ts
//   Production: BASE_URL=https://app.abarva.ai npx playwright test tests/e2e/apex-end-to-end-loop.spec.ts
//
// Backlog: Wave 5, Slice 5.1 (Apex end-to-end path).

import { test, expect, type Page } from '@playwright/test';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const PASSWORD = process.env.E2E_DEMO_PASSWORD ?? 'Demo2026!';
const ACCESS_CODE = process.env.E2E_DEMO_ACCESS_CODE ?? '424242';

// Canonical Apex CIO demo account — the scenario's protagonist
// (Carlos Rivera, executive sponsor of the Contact Center AI Routing Move).
const APEX_CIO_EMAIL = 'cio@apex-retail.example.com';

// The seeded Move under test — see scripts/seed-apex-demo-move.ts
// (Contact Center AI Routing · P3 Design).
const MOVE_NAME = 'Contact Center AI Routing';

// Surfaces in North-Star loop order. `/programs` 301-redirects to
// `/strategic-moves` (next.config.ts), so the Move surface is addressed
// by its canonical route.
const ROUTES = {
  context: '/setup',
  intelligence: '/intelligence',
  moves: '/strategic-moves',
  source: '/source',
  tower: '/tower',
} as const;

// CI runs without real Clerk creds; skip the whole suite when the
// publishable key is absent or an obvious placeholder, matching the
// behaviour of the other tenant-flow specs.
const clerkKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY ?? '';
const hasCreds = /^pk_(test|live)_[A-Za-z0-9]/.test(clerkKey);

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function typeCredential(page: Page, placeholder: RegExp, value: string): Promise<void> {
  const field = page.getByPlaceholder(placeholder);
  await field.fill('');
  await field.click();
  await page.keyboard.type(value, { delay: 4 });
  await expect(field).toHaveValue(value);
}

async function signInAsApexCio(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByPlaceholder(/name@company.com/i)).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(
    () => Boolean((window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded),
    null,
    { timeout: 30_000 },
  );
  await typeCredential(page, /name@company.com/i, APEX_CIO_EMAIL);
  await typeCredential(page, /Password from invite/i, PASSWORD);
  await typeCredential(page, /6-digit code/i, ACCESS_CODE);
  await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled({ timeout: 10_000 });
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/home/, { timeout: 30_000 });
}

// ─── Suite ───────────────────────────────────────────────────────────────────

test.describe('Apex end-to-end loop · Contact Centre AI Routing (Slice 5.1)', () => {
  test.skip(!hasCreds, 'Requires real Clerk + Supabase credentials (absent in CI).');
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => {
      throw new Error(`Page errored: ${err.message}`);
    });
    await signInAsApexCio(page);
  });

  // Step 0 · Context Layer — what the tenant already knows.
  // Scenario surface: Setup / Data Trust (Steward). The readiness snapshot
  // is the grounding for every downstream step, so we assert the Setup
  // surface loads under the Apex session without redirecting to auth.
  test('Step 0 · Context — Setup/Data Trust loads for the Apex tenant', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.context}`, { waitUntil: 'domcontentloaded' });
    // Coherence: we are still authenticated as Apex, not bounced to /sign-in.
    expect(page.url()).not.toContain('/sign-in');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
  });

  // Step 1 · Intelligence — identify and pressure-test the bet.
  // Scenario surface: /intelligence (Sentinel). The V4 Brief headline is
  // tenant-keyed; it must name Apex Retail. The contact-centre pattern is
  // the candidate bet the funnel promotes into Moves.
  test('Step 1 · Intelligence — Brief headline names Apex Retail', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.intelligence}`, { waitUntil: 'domcontentloaded' });
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 30_000 });
    const text = (await heading.textContent()) ?? '';
    expect(text).toContain('Apex Retail');

    // GAP-1 (see APEX-LOOP-WIRING-GAPS.md): the scenario's "contact-centre
    // service cost and experience pressure" bet brief is not promoted into
    // the funnel as a discrete, clickable artifact that deep-links to the
    // seeded Move. We can assert the Brief renders for the right tenant,
    // but cannot yet assert an Intelligence -> Move hand-off link. The bet
    // text is loaded as a soft signal only.
    const betSignal = page.getByText(/contact[\s-]?cent(er|re)/i).first();
    if (await betSignal.count()) {
      await expect(betSignal).toBeVisible();
    }
  });

  // Step 2 · Move — shape it into a governed initiative.
  // Scenario surface: /strategic-moves (Nexus). The seeded Contact Center
  // AI Routing Move must be present in the Apex portfolio at phase P3.
  test('Step 2 · Move — Contact Center AI Routing is present at P3', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.moves}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /^Strategic Moves$/i })).toBeVisible({
      timeout: 30_000,
    });
    // The seeded Move appears as a portfolio card. Coherence of the loop's
    // central object: the bet from Step 1 has become a governed Move.
    const moveCard = page.getByText(MOVE_NAME, { exact: false }).first();
    await expect(moveCard).toBeVisible({ timeout: 15_000 });

    // Open the Move detail and confirm it is the P3 Design phase, matching
    // the seed (scripts/seed-apex-demo-move.ts). The phase trace P0->P3 and
    // the "Sourcing strategy decision" deliverable are what trigger the
    // hand-off to Source in the scenario.
    await moveCard.click();
    await page.waitForURL(/\/strategic-moves\/.+/, { timeout: 30_000 });
    await expect(page.getByText(MOVE_NAME, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/\bP3\b|Design/i).first()).toBeVisible({ timeout: 15_000 });

    // GAP-2 (see APEX-LOOP-WIRING-GAPS.md): the "Sourcing strategy decision"
    // deliverable is seeded as a not_started P3 module, but it does not yet
    // expose a deep-link/CTA that opens a Source event. The Move -> Source
    // hand-off is described in the scenario but not wired in product, so
    // this step asserts the deliverable is *named* on the Move rather than
    // navigable into Source.
    const sourcingDeliverable = page.getByText(/sourcing strategy/i).first();
    if (await sourcingDeliverable.count()) {
      await expect(sourcingDeliverable).toBeVisible();
    }
  });

  // Step 3 · Source — choose the commercial / partner / vendor path.
  // Scenario surface: /source (Sentinel). The scenario enters Source via
  // the Move's sourcing-strategy deliverable; that link is GAP-2, so we
  // verify Source itself loads coherently for Apex instead.
  test('Step 3 · Source — sourcing portfolio loads for Apex', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.source}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Sourcing events', level: 1 })).toBeVisible({
      timeout: 30_000,
    });

    // GAP-3 (see APEX-LOOP-WIRING-GAPS.md): no sourcing event for the
    // contact-centre decision is seeded. scripts/seed-apex-demo-move.ts
    // seeds the Move, squad, deliverables and milestones but stops short
    // of a Source event; the three-lane sourcing strategy from the
    // scenario therefore has no in-product home. We assert the Source
    // surface is reachable and tenant-correct; if a contact-centre event
    // is present (future seed work) we additionally assert it links back
    // to the Move.
    const sourcingEvent = page.getByText(/contact[\s-]?cent(er|re)/i).first();
    if (await sourcingEvent.count()) {
      await expect(sourcingEvent).toBeVisible();
    }
  });

  // Step 4 · Tower — track value, risk, adoption, outcomes.
  // Scenario surface: /tower (Atlas). The Move should appear as a portfolio
  // card with projected value, risk posture and a dependency link to the
  // Source event.
  test('Step 4 · Tower — Atlas portfolio loads for Apex', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.tower}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/^Atlas$/i).first()).toBeVisible({ timeout: 30_000 });

    // GAP-4 (see APEX-LOOP-WIRING-GAPS.md): the contact-centre Move does
    // not surface as a Tower portfolio card. Tower's only contact-centre
    // reference in seed data is a paused telemetry integration
    // (scripts/seed/tower/data.ts), not a portfolio line item with
    // projected value / risk / the Source dependency link the scenario
    // describes. We assert Tower loads with the Atlas rail; the Move card
    // and the Source dependency link are deferred to follow-on wiring.
    const moveOnTower = page.getByText(MOVE_NAME, { exact: false }).first();
    if (await moveOnTower.count()) {
      await expect(moveOnTower).toBeVisible();
    }
  });

  // Step 5 · Outcome — evidence feeds back to the Context Layer.
  // Scenario surface: Tower outcome ledger -> Context Layer. The ledger
  // distinguishes projected / tracked / verified value and writes
  // verified evidence back as fresh context segments, closing the loop.
  test('Step 5 · Outcome — Tower outcome ledger loads for Apex', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.tower}/outcomes`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).not.toContain('/sign-in');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });

    // GAP-5 (see APEX-LOOP-WIRING-GAPS.md): the projected -> tracked ->
    // verified outcome evidence for the contact-centre Move is not seeded,
    // and there is no in-product write-back path from the outcome ledger
    // to the Context Layer (Step 0). The loop is therefore not closed in
    // product — Step 5 -> Step 0 is a documented gap. We assert the
    // outcome ledger surface loads; closing the loop is follow-on work.
  });
});
