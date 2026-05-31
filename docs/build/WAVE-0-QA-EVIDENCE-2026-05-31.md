# Wave 0 QA Evidence · 2026-05-31

## Status

Candidate evidence packet for Wave 0 quality-spine harnesses. Local implementation checks and credentialed L4 tenant-isolation passed. L6 human retest on the PR preview found a NO-GO on `/engineering/observability` tenant exposure; this packet records the corrective action and the remaining preview retest scope.

## Coverage Summary

| Layer | Evidence | Current status |
|---|---|---|
| L1 Unit | New Jest suites for answer quality, evidence ledger, readiness score, comprehension gate, request telemetry, live-answer wrapper, and Source runtime wrapper insertion | Passed locally: Wave 0 gate 6 suites/14 tests; Source focused 4 suites/16 tests |
| L2 Integration | Broad repo integration suite run for baseline signal | `test:integration` red on existing broad contracts; no clear Wave 0 ownership |
| L3 Contract | Pure TypeScript interfaces for answer-quality score, evidence ledger, readiness assessment, telemetry, comprehension gate, and Source Nexus `answerQuality` response | Passed: `npx tsc --noEmit --pretty false` |
| L4 E2E | `tests/e2e/tenant-isolation/*` for protected-route redirect, per-client DOM isolation, and network-response probe | Passed credentialed local serial run: 10 tests |
| L5 Answer quality | `src/lib/eval/answer-quality/fixtures/wave0-known-good.jsonl` and `wave0-known-bad.jsonl` plus CI gate script | Passed: 50 known-good accepted, 30 known-bad rejected |
| L6 Human | Browser walkthrough as Apex, Meridian, SkyHarbor on PR preview | Retest found one critical observability isolation blocker; route now locally gated to platform admins pending preview redeploy/retest |

## Harness Scores

| Harness | Evidence path | Candidate score |
|---|---|---:|
| CXO Answer Quality | `src/lib/eval/answer-quality/**` | Pass |
| Tenant Isolation Regression | `tests/e2e/tenant-isolation/**`, `npm run wave0:tenant-isolation` | Pass |
| Evidence/Source Ledger | `src/lib/agent/evidence-ledger/**` | Pass |
| Operational Observability | `src/lib/observability/**`, `/engineering/observability` | Locally remediated: platform-admin gated; client personas get admin-only notice without telemetry rows |
| Decision Readiness Score | `src/lib/agent/readiness-score/**` | Pass |
| UX Comprehension Gate | `src/lib/agent/comprehension-gate/**` | Pass |
| Live Answer Gate Wrapper | `src/lib/agent/quality/live-answer-quality.ts`, `src/lib/source/nexus-api.ts` | Pass |

## Browser Walkthrough Log

Local HTTP crawl was run against `next start` on port 3011 with the local env loaded from the main checkout, without logging secret values.

| Route | Result |
|---|---|
| `/` | 200 rendered |
| `/sign-in` | 200 rendered |
| `/product` | 307 to `/sign-in?redirect=%2Fproduct` |
| `/home` | 301 to `/admin` |
| `/tower` | 307 to `/sign-in?redirect=%2Ftower` |
| `/source` | 307 to `/sign-in?redirect=%2Fsource` |
| `/engineering/observability` | 307 to `/sign-in?redirect=%2Fengineering%2Fobservability` |
| `/api/health` | 200 JSON: `ok: true`; `postgres: true`; `direct_postgres: true`; `azure_graph: postgres` |

Vercel PR preview browser access is protected by Vercel Authentication, so unauthenticated preview crawling stops at the Vercel login screen. In-app localhost browser navigation also returned `ERR_BLOCKED_BY_CLIENT`; local validation used HTTP crawl instead.

Credentialed L4 tenant isolation was run against `next start` on port 3012 with the same local env. A parallel run produced a false red from concurrent Clerk server-ticket sessions for the same persona set; the deterministic serial run passed all 10 tests. `npm run wave0:tenant-isolation` pins this run to one worker.

Credentialed L6 retest on the PR preview with canonical personas (`cio@apex-retail.example.com`, `cdio@meridian-health.example.com`, `cto@skyharbor-air.example.com`) confirmed:

- Auth for all three canonical accounts passed with access code `424242`.
- Logged-out protection passed for `/home`, `/tower`, `/source`, and `/engineering/observability`.
- Query-param client injection was neutralized for tested routes.
- Non-observability routes rendered with the correct client identity and no forbidden tenant names.
- Answer quality was strong overall, with two SkyHarbor Atlas truncation warnings.
- `/engineering/observability` rendered multi-client sample telemetry to all three client personas; this was treated as a critical NO-GO because the route is documented as internal-only.

Corrective action: `/engineering/observability` now requires a platform-admin role or allowlisted platform operator email before rendering telemetry rows. Authenticated non-admin client personas receive an `Admin access only` notice and no `apex-retail`, `meridian-health`, or `skyharbor-air` telemetry row labels.

Follow-up local browser crawl after the corrective action:

- Admin/operator can render `/engineering/observability` and see all telemetry rows.
- Apex Retail, Meridian Health, and SkyHarbor Air can render the route but see only `Admin access only`; none of the three telemetry row labels appear.
- Authenticated local crawl of `/tower`, `/tower?tab=programme_gates`, `/tower?tab=executive_brief`, and `/admin/dossiers` across admin plus all three client personas returned 200s with no captured 4xx/5xx route or RSC responses. The L6 preview RSC 503 warning remains a preview-retail target because Vercel SSO blocks automated preview crawl from this shell.

Required credentialed L6 route set:

- Apex Retail: `/home`, `/tower`, `/intelligence`, `/engineering/observability`
- Meridian Health: `/home`, `/tower`, `/intelligence`, `/engineering/observability`
- SkyHarbor Air: `/home`, `/tower`, `/source`, `/engineering/observability`

## Answer Grading Table

The fixture harness includes 50 known-good and 30 known-bad answers. Human L6 answer grading still needs 5 real prompts per client.

## Issue Register

| Priority | Issue | Status |
|---|---|---|
| P1 | Playwright isolation requires real Clerk credentials; placeholder auth cannot prove route isolation | Closed for local Wave 0: credentialed serial run passed 10/10 |
| P1 | L6 retest found `/engineering/observability` exposed all three client row labels to authenticated client personas | Locally remediated with platform-admin gate and focused regression test; requires preview redeploy/retest |
| P2 | L6 retest found consistent RSC prefetch 503s on `/admin/dossiers` and `/tower?tab=programme_gates` | Not reproduced locally in authenticated browser crawl; requires Vercel-authenticated preview retest |
| P2 | L6 retest found SkyHarbor Atlas truncation on prompts 1 and 3 | Locally remediated in Tower response shaper; regression prevents compacted lines ending in `and.`, `or to proceed with.`, or similar connector fragments |
| P2 | Evidence/readiness/comprehension gates are inserted into Source Nexus runtime responses, but the streaming Nexus route still needs a separate SSE-safe wrapper design | Follow-up runtime wiring before declaring full Wave 0 product enforcement |
| P3 | Jest reports pre-existing duplicate manual mock warnings before focused Wave 0 tests | Non-blocking local warning; not introduced by this slice |
| P4 | Broad `npm run test:integration` is red on existing Admin/Source/Tower/Programs/design contracts | Pre-existing baseline risk; not treated as Wave 0-specific without a clean `origin/main` baseline |

## Go/No-Go Memo

No-go for production sign-off until the remediated `/engineering/observability` platform-admin gate and Atlas truncation fix are redeployed and retested on the PR preview. Local build, contract, release, lint, unit, Wave 0 standing gate, answer-quality gates, credentialed L4 tenant isolation, focused observability access-control regression, and Tower response-shaper truncation regression are green. Remaining L6 preview retest scope: observability gate, RSC prefetch 503s, and SkyHarbor prompts 1/3.

## Local Validation Log

| Command | Result |
|---|---|
| `npm ci --ignore-scripts` | Passed; dependency install only, existing audit warnings reported |
| `node scripts/ci/answer-quality-gate.mjs` | Passed: 50 known-good, 30 known-bad, 100% fixture classification |
| `npm run wave0:quality-gate` | Passed: answer fixture gate, 6 Jest suites/14 tests, 10 tenant-isolation E2E tests discovered |
| `BASE_URL=http://127.0.0.1:3012 npx playwright test tests/e2e/tenant-isolation --reporter=list --workers=1` | Passed: 10 credentialed tenant-isolation tests |
| `npx jest src/lib/source/__tests__/nexus-api-live-context.test.ts src/__tests__/integration/source/source-nexus-api-stub.test.ts src/lib/agent/quality/__tests__/live-answer-quality.test.ts src/lib/agent/comprehension-gate/__tests__/lint.test.ts --runInBand` | Passed: 4 suites, 16 tests |
| `npx jest src/lib/eval/answer-quality/__tests__/scorer.test.ts src/lib/agent/evidence-ledger/__tests__/composer.test.ts src/lib/agent/readiness-score/__tests__/scorer.test.ts src/lib/agent/comprehension-gate/__tests__/lint.test.ts src/lib/observability/__tests__/request-telemetry.test.ts src/lib/agent/quality/__tests__/live-answer-quality.test.ts --runInBand` | Passed: 6 suites, 14 tests |
| `npx jest src/__tests__/integration/observability/observability-access.test.tsx --runInBand` | Passed: unauth redirect, client persona block, admin role access, allowlisted operator access |
| `npx jest src/lib/agent/__tests__/response-shape-regression.test.ts src/lib/agent/__tests__/response-shape.test.ts --runInBand` | Passed: 2 suites, 48 tests, including no dangling connector fragment after Tower compaction |
| Authenticated local browser crawl on `next start` port 3028 | Passed: admin sees observability telemetry rows; all three client personas see admin-only notice; Tower tabs and admin dossiers returned 200 with no captured route/RSC 4xx/5xx |
| `npm run test:nav` | Passed: 1 suite, 26 tests |
| `npm run test:behaviors` | Passed: 4 suites, 90 tests |
| `npm run test:integration` | Failed: 59 failing suites / 168 failing tests in broad pre-existing contracts; no clear Wave 0 ownership |
| `npm run --silent lint:depth -- --all` | Passed after applying existing CLI `server-only` preload pattern |
| `npx eslint src/lib/eval/answer-quality src/lib/agent/evidence-ledger src/lib/agent/readiness-score src/lib/agent/comprehension-gate src/lib/observability/request-telemetry.ts src/lib/observability/posthog-emitter.ts src/components/agent/EvidenceLedgerDrawer.tsx 'src/app/(maestro)/engineering/observability/page.tsx' tests/e2e/tenant-isolation --max-warnings=0` | Passed |
| `npx tsc --noEmit --pretty false` | Passed |
| `npm run build` | Passed |
| `PORT=3011 npm run start` with local env plus HTTP crawl | Passed public/protected-route smoke and `/api/health`; protected routes redirected to auth as expected |
| `npm run release:check -- --base origin/main --head HEAD` | Passed |
| `git diff --check` | Passed |

## Rollback Path

Revert PR #2679:

```bash
gh pr revert 2679
```

No database rollback is required.
