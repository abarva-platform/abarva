# AbarVa Verification Infrastructure Spec

**Vercel + Clerk + Playwright smoke tests + GitHub Actions required checks**

**Version:** 1.0 · April 28 2026
**Status:** Prescriptive · ready for implementation
**Purpose:** Close the verification gap in the autonomous build loop. Agent-claimed smoke test passes have been unverifiable due to local Clerk auth blocking automated test runs. This spec replaces honor-system verification with platform-enforced verification via Vercel preview deployments and GitHub required status checks.

> **Why this exists:** Multiple session transcripts show agents hitting `localhost:3000`, getting redirected to Clerk auth, attempting OTP automation, failing, and silently degrading the verification gate to "typecheck clean = approved." That is not the orchestration spec's intent. Auto-approval criteria must be enforceable, not aspirational. This spec makes them enforceable.

---

## §0 · Implementation status

| Phase | Status | Notes |
|---|---|---|
| Phase 1 · Founder work | not started | Preview Clerk, GitHub secrets, and branch-protection preparation are not configured yet. |
| Phase 2 · Agent PR for test suite | not started | No dedicated smoke suite or `playwright.smoke.config.ts` exists in the repo yet. |
| Phase 3 · Branch protection switch | not started | `Smoke Tests on Vercel Preview` is not yet a required merge gate. |

---

## §1 · Position · What this infrastructure IS

A four-component verification stack:

1. **Vercel preview deployments per PR** — every PR gets a unique deployed URL with real Clerk auth, real environment variables, real build pipeline.
2. **Clerk CI test accounts** — dedicated automation users with stable credentials, scoped permissions, and bypass for OTP/MFA where needed.
3. **Playwright smoke test suite** — runs against the Vercel preview URL, logs in via the CI account, walks each storyline end-to-end, asserts against rendered output.
4. **GitHub Actions required status checks** — gate merge at the platform level. Agent cannot bypass even with auto-approve authority.

### What this infrastructure IS NOT

It is not a load test or performance suite. Smoke tests are presence-and-correctness, not throughput.

It is not a unit test framework — those run separately via the repo's existing Jest test flow (`npm test` today, or equivalent after future script normalization).

It is not a substitute for visual regression (which still uses Playwright but is a separate suite with its own threshold).

It is not a replacement for production monitoring — it gates pre-merge; production observability is a separate concern.

---

## §2 · The verification gap (what we're fixing)

### Symptoms observed in transcripts

From Tower T1: "Attempted Clerk OTP sign-in flow in preview but the embedded Clerk modal was difficult to automate. Resolution: typecheck passing clean was accepted as the verification gate; auth wall is expected behavior."

From Source S2: "The preview route requires auth — typecheck is the key gate and it passed clean."

From multiple sprints: smoke test sections in PR descriptions show "✅ S-SMOKE-AMS pass" with no actual test execution evidence.

### Concrete bug class this enables

**Sprint 5K caught a real example:** `/source/ams-vendor-2026` returned 404 in production because Wave S1 deleted that route. The Home page action C still pointed there. This was caught by the founder noticing it post-deploy, not by smoke tests pre-merge. With proper Vercel preview testing, this would have failed `S-SMOKE-AMS` on the PR that deleted the route.

### Why local smoke tests can't fix this

Local development uses different Clerk middleware, often bypassed via `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` pointing at a dev instance. Local seed data may differ from production seed. Local environment variables may differ. **The only environment that resembles production is Vercel preview.** Smoke tests that don't run against Vercel preview don't actually verify the storyline.

---

## §3 · Architecture · the four components

### Component 1 · Vercel preview deployments

**Already in place** if your repo has the Vercel GitHub integration enabled. Verify by:

```bash
gh pr view 555 --json statusCheckRollup
# Look for: "vercel" check with deployment URL
```

Every PR opens, Vercel auto-builds, deploys to `https://abarva-git-{branch-name}-{org-name}.vercel.app`, posts the URL as a status check. The URL is stable for the life of the PR.

**If not yet enabled:** install Vercel GitHub app for the repo. Configure project root and build command. Add environment variables (Clerk keys, Supabase keys, Anthropic API key) in Vercel project settings under "Preview" environment.

**Critical environment variable scope:** preview deployments must use a **separate Clerk instance** from production (or the same instance with separate user populations). Reasoning: the CI test account exists only in the preview environment so it cannot accidentally take actions in production. See §4.

### Component 2 · Clerk CI test account

**One dedicated user per environment:**

- `ci-smoke@abarva.test` for Vercel preview environment
- (Production has no CI account — production is observed, not smoke-tested in this loop)

**User configuration:**

- Email + password authentication enabled (no OTP, no magic link, no SMS — those don't automate cleanly)
- Tenant assignment: `apex-retail` (the demo flagship tenant)
- Role: same as a normal sponsor user (read-write programs, read-only Source/Tower/Intelligence/Setup)
- Multi-factor: **disabled for this user only**, via Clerk allowlist

**Credential storage:**

```
GitHub Actions secrets (repo settings → Secrets and variables → Actions):
  CLERK_CI_EMAIL = ci-smoke@abarva.test
  CLERK_CI_PASSWORD = <generated, 32 chars, rotated quarterly>
  CLERK_CI_INSTANCE_URL = https://clerk.abarva-preview.dev (or whatever the preview Clerk instance domain is)
```

**Rotation policy:** every 90 days, rotate the password via Clerk dashboard, update the GitHub secret. Add to recurring calendar event.

**Audit trail:** Clerk's audit log will show every CI authentication. Worth a quarterly review to confirm no anomalous usage.

### Component 3 · Playwright smoke test suite

**Location:** `tests/e2e/smoke/` (aligned with the repo's current Playwright layout under `tests/e2e/**`)

**Configuration file:** `playwright.smoke.config.ts`

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/smoke',
  timeout: 60_000,
  retries: 1,
  workers: 1, // sequential for stable storyline traversal
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? 'http://localhost:3000',
    storageState: 'tests/e2e/smoke/.auth/ci-user.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /\.setup\.ts/ },
    { name: 'smoke', dependencies: ['setup'], testMatch: /\.smoke\.ts/ },
  ],
});
```

**Auth setup file:** `tests/e2e/smoke/auth.setup.ts`

```ts
import { test as setup, expect } from '@playwright/test';
import { withClerkAuth } from '../_helpers/auth';

const authFile = 'tests/e2e/smoke/.auth/ci-user.json';

setup('authenticate as CI user', async ({ page }) => {
  await withClerkAuth(page, { email: process.env.CLERK_CI_EMAIL! });
  await page.goto('/home');
  await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });
  await page.context().storageState({ path: authFile });
});
```

The repo already has a Playwright auth helper at `tests/e2e/_helpers/auth.ts`. The future smoke suite should reuse that helper rather than introducing a second auth strategy.

**One smoke test file per storyline:**

#### `tests/e2e/smoke/source-ams.smoke.ts`

```ts
import { test, expect } from '@playwright/test';

test.describe('S-SMOKE-AMS — AMS Vendor Consolidation 2026 storyline', () => {
  test('events portfolio shows AMS event with linked program', async ({ page }) => {
    await page.goto('/source/events');

    const amsCard = page.getByText('AMS Vendor Consolidation 2026');
    await expect(amsCard).toBeVisible();

    await expect(page.getByText(/Stage 7|orals_bafo|BAFO/i).first()).toBeVisible();
    await expect(page.getByText(/APX-CDP-2026/i).first()).toBeVisible();
  });

  test('event detail renders stage tracker + BAFO panel + linked program chip', async ({ page }) => {
    await page.goto('/source/events/apex-retail-ams-outsourcing-2026');

    await expect(page.getByText(/AMS Vendor Consolidation/i)).toBeVisible();

    // Stage tracker shows BAFO active
    await expect(page.locator('[data-stage="orals_bafo"][data-active="true"]')).toBeVisible();

    // BAFO panel renders
    await expect(page.getByText(/Vendor B|pricing comparison|14% variance/i).first()).toBeVisible();

    // Linked program chip resolves
    const linkedChip = page.getByText(/APX-CDP-2026/i).first();
    await expect(linkedChip).toBeVisible();
    await linkedChip.hover();
    await expect(page.getByText(/P3 Design|Apex Retail CDP/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('linked program chip navigates to program detail', async ({ page }) => {
    await page.goto('/source/events/apex-retail-ams-outsourcing-2026');

    await page.getByText(/APX-CDP-2026|View program/i).first().click();

    await expect(page).toHaveURL(/\/programs\/apx-cdp-2026/);
    await expect(page.getByText(/P3 Design/i).first()).toBeVisible();
  });

  test('scorecard route renders without 500', async ({ page }) => {
    const response = await page.goto('/source/events/apex-retail-ams-outsourcing-2026/scorecard');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByText(/scorecard|criteria|approved/i).first()).toBeVisible();
  });

  test('Sentinel voice references AMS state correctly', async ({ page }) => {
    await page.goto('/source/events/apex-retail-ams-outsourcing-2026');

    const agentColumn = page.locator('[data-agent="sentinel"]');
    await expect(agentColumn).toBeVisible();

    // Voice quote should reference AMS-specific state
    const quote = agentColumn.locator('[data-quote]');
    const text = await quote.textContent();
    expect(text).toMatch(/BAFO|Vendor|stage 7|orals/i);
  });
});
```

#### `tests/e2e/smoke/tower-portfolio.smoke.ts`

```ts
import { test, expect } from '@playwright/test';

test.describe('T-SMOKE-PORTFOLIO — AI portfolio storyline', () => {
  test('tower portfolio renders with KPI band', async ({ page }) => {
    await page.goto('/tower');

    // 5 KPI cards visible
    const kpiCards = page.locator('[data-kpi-card]');
    await expect(kpiCards).toHaveCount(5);

    // Total spend visible (any AI-portfolio number)
    await expect(page.getByText(/\$[\d.]+M/).first()).toBeVisible();
  });

  test('bubble chart renders all 5 AI programs', async ({ page }) => {
    await page.goto('/tower');

    const bubbles = page.locator('[data-program-bubble]');
    await expect(bubbles).toHaveCount(5, { timeout: 5000 });

    // Each bubble has program ID
    await expect(page.locator('[data-program-id="m365-copilot"]')).toBeVisible();
    await expect(page.locator('[data-program-id="claude-code"]')).toBeVisible();
  });

  test('Microsoft renewal calendar entry exists', async ({ page }) => {
    await page.goto('/tower/renewals');
    await expect(page.getByText(/Microsoft/i).first()).toBeVisible();
    await expect(page.getByText(/days|months/i).first()).toBeVisible();
  });

  test('AI Cloud Spend pressure detail page resolves', async ({ page }) => {
    const response = await page.goto('/tower/pressures/twr-ai-cloud-spend');
    expect(response?.status()).toBeLessThan(400);

    await expect(page.getByText(/LLM inference|\$2\.4M|cost overrun/i).first()).toBeVisible();
  });
});
```

#### `tests/e2e/smoke/programs-cdp.smoke.ts`

```ts
import { test, expect } from '@playwright/test';

test.describe('P-SMOKE-CDP — APX-CDP-2026 storyline', () => {
  test('home page surfaces CDP and connects three actions', async ({ page }) => {
    await page.goto('/home');

    await expect(page.getByText(/Apex Retail CDP|APX-CDP-2026/i).first()).toBeVisible();

    // Action A → Programs
    await page.getByRole('button', { name: /A.*Review|A.*CDP/i }).click();
    await expect(page).toHaveURL(/\/programs\/apx-cdp-2026/);
    await page.goBack();

    // Action B → Tower pressure
    await page.getByRole('button', { name: /B.*AI Cloud|B.*pressure/i }).click();
    await expect(page).toHaveURL(/\/tower\/pressures/);
    await page.goBack();

    // Action C → Source
    await page.getByRole('button', { name: /C.*BAFO|C.*AMS/i }).click();
    await expect(page).toHaveURL(/\/source\/events\/apex-retail/);
  });

  test('CDP program detail renders P3 with Build gate ribbon', async ({ page }) => {
    await page.goto('/programs/apx-cdp-2026');

    await expect(page.getByText(/P3 Design/i).first()).toBeVisible();

    // Build gate ribbon visible (gateStatus: 'pending')
    const gateRibbon = page.locator('[data-gate-ribbon]');
    await expect(gateRibbon).toBeVisible();
    await expect(gateRibbon.getByText(/2 of 5|Build gate/i)).toBeVisible();
  });

  test('action C deep-links to Intelligence T3-H03', async ({ page }) => {
    await page.goto('/programs/apx-cdp-2026');

    // Trigger workbench action C
    await page.getByRole('button', { name: /C\b/i }).click();

    // SuggestedActionOverlay frame 3 appears with "Open in Intelligence" CTA
    await page.waitForSelector('[data-overlay-frame="3"]', { timeout: 5000 });
    await page.getByRole('link', { name: /Open in Intelligence|Open →/i }).click();

    await expect(page).toHaveURL(/\/intelligence\/t3-h03/);
    await expect(page.getByText(/T3-H03|pattern/i).first()).toBeVisible();
  });
});
```

**Adding a smoke test for a new storyline (e.g., I-SMOKE-CDP for Intelligence):** create `tests/e2e/smoke/intelligence-cdp.smoke.ts` following the same shape. The smoke gate runs every `*.smoke.ts` file in `tests/e2e/smoke/`.

### Component 4 · GitHub Actions required status check

**Workflow file:** `.github/workflows/smoke.yml`

```yaml
name: Smoke Tests

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  deployments: read
  pull-requests: read

jobs:
  smoke:
    name: Smoke Tests on Vercel Preview
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium

      - name: Wait for Vercel preview deployment
        id: vercel
        uses: patrickedqvist/wait-for-vercel-preview@v1.3.1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          max_timeout: 300

      - name: Run smoke tests against Vercel preview
        env:
          SMOKE_BASE_URL: ${{ steps.vercel.outputs.url }}
          CLERK_CI_EMAIL: ${{ secrets.CLERK_CI_EMAIL }}
          CLERK_CI_PASSWORD: ${{ secrets.CLERK_CI_PASSWORD }}
        run: npx playwright test --config=playwright.smoke.config.ts

      - name: Upload trace on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-trace-${{ github.event.pull_request.number }}
          path: test-results/
          retention-days: 14
```

**Branch protection configuration** (repo settings → Branches → main):

- Require status checks to pass before merging: enabled
- Require branches to be up to date before merging: enabled
- Required status checks:
  - `Smoke Tests on Vercel Preview` (this workflow)
  - `Vercel — Preview Deployment` (the Vercel auto-check)
  - `Lint` (if you have a separate lint workflow)
  - `Integrity` (current repo workflow)
  - `Hygiene Gate` (current repo workflow)

**Repo note:** this repo currently has `Lint`, `Integrity`, and `Hygiene Gate` workflows in `.github/workflows/`, but no dedicated `Typecheck` workflow yet. Branch protection should not reference a non-existent check until that workflow exists.

**This is the critical configuration.** Without branch protection enforcing the smoke check, agents can still merge with auto-approve authority. With it, GitHub itself blocks the merge button.

---

## §4 · Environment isolation

### The three Clerk instances pattern

```
Production Clerk instance (clerk.abarva.com)
├─ Real users (composite tenants, real customers)
├─ MFA required
├─ No CI account
└─ Used by: production deployment only

Preview Clerk instance (clerk.abarva-preview.dev)
├─ Demo data only
├─ MFA optional
├─ ci-smoke@abarva.test exists with stable password
└─ Used by: every Vercel preview deployment

Development Clerk instance (clerk.abarva-dev.dev)
├─ Developer test users
├─ MFA off
├─ Local development only
└─ Used by: localhost:3000 during dev work
```

### Vercel environment variable mapping

In Vercel project settings → Environment Variables:

```
Production:
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_<production>
  CLERK_SECRET_KEY = sk_live_<production>

Preview:
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_<preview>
  CLERK_SECRET_KEY = sk_test_<preview>

Development:
  (set in .env.local, not in Vercel)
```

The Vercel preview deployment uses the Preview env vars automatically. The smoke test pulls `CLERK_CI_EMAIL` and `CLERK_CI_PASSWORD` from GitHub Secrets, which match the user that exists in the Preview Clerk instance.

### Why three instances and not one

Single Clerk instance shared across all environments creates a real risk: a CI test account with read-write capability to a production tenant. If a smoke test ever runs against production by misconfiguration, it could mutate live data. The three-instance pattern is the standard defense.

If three instances is too costly, **two is the minimum:** Production and Non-production. The smoke account lives in Non-production. Local dev shares Non-production with previews.

---

## §5 · The verification flow end-to-end

```
1. Agent creates branch, pushes, opens PR
   ↓
2. Vercel sees push, builds, deploys to preview URL
   Posts "Vercel — Preview Deployment" status check
   ↓
3. GitHub Actions sees PR opened, starts smoke workflow
   ↓
4. Smoke workflow waits for Vercel deployment to be ready (max 5 min)
   ↓
5. Playwright auth.setup.ts runs against preview URL
   Logs in as ci-smoke@abarva.test
   Saves storage state to .auth/ci-user.json
   ↓
6. Each *.smoke.ts file runs against preview URL with saved auth state
   - source-ams.smoke.ts (S-SMOKE-AMS)
   - tower-portfolio.smoke.ts (T-SMOKE-PORTFOLIO)
   - programs-cdp.smoke.ts (P-SMOKE-CDP)
   - intelligence-cdp.smoke.ts (I-SMOKE-CDP) — when authored
   ↓
7. All smoke tests pass → "Smoke Tests on Vercel Preview" status check goes green
   ↓
8. All required checks green → merge button enabled
   ↓
9. Agent calls gh pr merge --squash → GitHub allows merge
   ↓
10. Main branch updates, Vercel deploys to production, agent moves to next wave
```

**Failure paths:**

- Vercel build fails → step 2 fails → smoke check never runs → merge blocked. Agent reads Vercel logs, fixes build error.
- Vercel deploys but app errors → step 5 (auth) fails → smoke check fails → merge blocked. Agent reads Playwright trace.
- Specific storyline broken → that smoke test fails → smoke check fails → merge blocked. Agent reads which test failed and what assertion missed.
- Vercel slow → step 4 times out at 5 min → smoke fails → agent retries.

---

## §6 · Updates to ORCHESTRATION_SPEC.md

### §9 Test phase spec — replacement text

> Each wave's test phase runs:
>
> 1. `pnpm typecheck` — must be zero errors. Local enforcement.
> 2. `pnpm lint` — must be zero warnings on changed files. Local enforcement.
> 3. `pnpm test` — unit and snapshot tests. Local enforcement.
> 4. **Vercel preview deployment** — automatic on every PR push. Posted as the `Vercel — Preview Deployment` status check.
> 5. **Smoke test suite** — runs in GitHub Actions against the Vercel preview URL. Authenticates via the CI test account in Clerk Preview instance. Posted as the `Smoke Tests on Vercel Preview` status check.
>
> Both status checks 4 and 5 are required for merge per branch protection rules. The agent does not need to run smoke tests locally; the agent waits for the GitHub status check and reads the result.
>
> If the smoke check fails, the agent reads the Playwright trace artifact uploaded by the workflow, identifies the failing storyline, and either fixes the code or escalates per §13.
>
> See `VERIFICATION_INFRASTRUCTURE_SPEC.md` for full setup.

### §10 Auto-approval criteria — replacement text for criterion 5

> 5. The `Smoke Tests on Vercel Preview` status check is green on the PR.

(Was: "S-SMOKE-AMS / T-SMOKE-PORTFOLIO / etc. passes" — implementation detail. New: enforced platform-level check.)

### §13 Escalation rules — new rule 13

> 13. **Vercel preview deployment failure.** If the Vercel preview build fails for reasons not addressable by code changes (env var missing, Clerk instance misconfigured, third-party API quota exhausted), agent halts and escalates. Do not modify Vercel project settings or GitHub Actions secrets without explicit founder authorization.

### §5 Trust tiers — addition to §5

> **Model selection by tier (additive):** Routine waves (token migration, mockup generation, test fixes, doc work) default to Sonnet. Ambiguous waves (architecture decisions, deletion-heavy convergence, debugging cascading failures, novel module first-wave) use Opus. This stretches the Anthropic All-models weekly bucket without changing structural logic. Agent declares model class in the wave plan; founder may override.

---

## §7 · Implementation phases

This is not a single PR. It's three phases.

### Phase 1 · Wire it up (founder-authored, ~2 hours)

Founder-only work — touches secrets, environment configs, branch protection. Cannot be agent-delegated.

1. Create the Preview Clerk instance (or confirm existing non-production instance is suitable)
2. Create the `ci-smoke@abarva.test` user, MFA disabled, generate password
3. Add `CLERK_CI_EMAIL`, `CLERK_CI_PASSWORD` to GitHub Actions secrets
4. Confirm Vercel project has Preview environment vars pointing at Preview Clerk instance
5. Configure branch protection on `main` requiring smoke status check (initially set to "informational" not "required" for first 3 PRs)

### Phase 2 · Author the test infrastructure (agent-authored, 1 PR, ~600 lines)

Agent (Claude Code or Codex) creates:

```
.github/workflows/smoke.yml
playwright.smoke.config.ts
tests/e2e/smoke/auth.setup.ts
tests/e2e/smoke/source-ams.smoke.ts
tests/e2e/smoke/tower-portfolio.smoke.ts
tests/e2e/smoke/programs-cdp.smoke.ts
tests/e2e/smoke/.gitignore (excluding .auth/)
```

PR title: `[Infra] Smoke test suite + GitHub Actions verification`

This PR is the bootstrap. Once merged, all subsequent PRs are protected.

### Phase 3 · Switch to required (founder, 5 minutes after first 3 PRs run cleanly)

After 3 consecutive PRs pass the smoke check on first try, founder switches the branch protection from "informational" to "required." This is the moment the verification gap closes.

---

## §8 · Maintenance & evolution

### When a new storyline emerges

When a new module ships its first wave (e.g., Intelligence I1 ships INT-IDX-LIBRARY), the agent adds a new smoke file:

```
tests/e2e/smoke/intelligence-cdp.smoke.ts
```

Following the I-SMOKE-CDP definition from `INTELLIGENCE_DESIGN_SPEC.md` §12. The smoke workflow auto-discovers `*.smoke.ts` files; no workflow change needed.

### When Clerk SDK updates

Clerk's auth behavior sometimes changes between SDK versions. In this repo, the preferred seam is `tests/e2e/_helpers/auth.ts` plus the smoke `auth.setup.ts` wrapper, so auth changes stay localized.

If a Clerk update breaks auth setup, every smoke test fails at setup. This is correct behavior — it surfaces the breakage immediately. The follow-up PR updates the shared auth helper and the smoke wrapper, then re-runs.

### When the CI account password rotates

90-day rotation policy:

1. Generate new password in Clerk dashboard
2. Update `CLERK_CI_PASSWORD` GitHub secret
3. Re-run the most recent open PR to confirm it works
4. Document rotation in `docs/build/JOURNAL.md` as `[INFRA] CI password rotated`

### When a smoke test becomes flaky

A flaky smoke test is worse than no smoke test — it trains agents to retry blindly. Policy:

- First flake: re-run, log the flake to `docs/build/SMOKE_FLAKES.md`
- Second flake (same test, within 7 days): test goes into quarantine — temporarily marked `test.fixme()` and a tracking issue opens
- Quarantine expires after 14 days; if not fixed, the test is removed and its storyline coverage is documented as a gap

---

## §9 · What this does NOT cover

These are out of scope for v1.0:

- **Visual regression on Vercel preview.** Possible but doubles the workflow time. Defer to v1.1 if visual drift becomes a real problem.
- **Production smoke tests.** Hourly schedule against production with a real account. Important for catching deploy-environment-only issues but a different operational concern.
- **Performance budgets.** Lighthouse CI. Different concern, different workflow, can be added later.
- **Cross-browser smoke.** Currently Chromium-only. Adding Firefox + WebKit triples runtime; defer until needed.
- **Mobile viewport smoke.** Currently desktop-only. Mobile demo isn't a target yet.

---

## §10 · Migration plan from current state

### Current state (April 28 2026)

- Vercel preview deployments: assumed working (every PR I see has a Vercel URL in transcripts)
- Clerk: production-only, no CI test account
- Playwright smoke suite: nonexistent
- GitHub Actions smoke workflow: nonexistent
- Branch protection on smoke check: nonexistent
- Agent self-claimed smoke test passes: untrustworthy

### Target state (post-implementation)

- Vercel preview: continues working
- Clerk: Preview instance with ci-smoke account
- Playwright smoke suite: 3 files covering 3 storylines, expandable
- GitHub Actions smoke workflow: required check
- Branch protection: smoke check required for merge
- Agent self-claimed smoke test passes: replaced with platform-enforced check

### Migration order

1. Founder Phase 1 work (~2h)
2. Agent Phase 2 PR (~1 session)
3. 3 normal waves run with smoke check informational
4. Founder Phase 3 flip to required
5. Future waves benefit automatically

**This migration changes the orchestration spec semantics.** Update ORCHESTRATION_SPEC.md per §6 of this doc as part of Phase 2 PR.

---

## §11 · Document control

- **Authoritative location:** `docs/build/VERIFICATION_INFRASTRUCTURE_SPEC.md`
- **Version:** 1.0
- **Authored:** April 28 2026
- **Owner:** Founder (Anand)
- **Companion specs:**
  - `ORCHESTRATION_SPEC.md` — receives §9, §10, §13 updates per §6 of this doc
  - All per-module build specs — their smoke test definitions are authoritative for the corresponding `*.smoke.ts` files

When this spec changes (new test runner, different auth provider, new architecture component), bump version and document in `docs/build/JOURNAL.md` as `[SPEC-CHANGE] VERIFICATION_INFRASTRUCTURE_SPEC v1.x → v1.y`.

---

**End of verification infrastructure spec.**
