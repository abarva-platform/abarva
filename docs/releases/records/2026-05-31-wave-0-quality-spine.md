# 2026-05-31-wave-0-quality-spine — Wave 0 Quality Spine Harnesses

## Release ID

`2026-05-31-wave-0-quality-spine`

## Status

`candidate`

## Plain-English Summary

Adds the first Wave 0 quality-spine harnesses that future product and Source waves must keep green: answer-quality scoring, evidence-ledger composition, decision-readiness scoring, UX comprehension filtering, live-answer quality wrapper coverage, Source runtime quality output, request observability summaries, and explicit tenant-isolation Playwright probes.

## Layer Impact

- `global-control-lane`: Adds shared QA and observability utilities used across agent surfaces.
- `internal-admin`: Adds `/engineering/observability` as an internal operator dashboard for live/fallback mode, latency, timeout, model cost, and answer-quality posture.
- `eval/QA`: Adds deterministic unit coverage, a standing Wave 0 PR workflow, and E2E scaffolding for the Wave 0 gates.

## Client Applicability

- All clients: Shared quality gates are client-neutral.
- Specific clients: Apex Retail, Meridian Health, and SkyHarbor appear in deterministic fixtures and E2E persona scaffolding.
- Internal only: Observability dashboard and QA evidence report.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- New answer-quality scorer and 50/30 fixture gate under `src/lib/eval/answer-quality/**` and `scripts/ci/answer-quality-gate.*`.
- New evidence-ledger composer under `src/lib/agent/evidence-ledger/**` and `src/components/agent/EvidenceLedgerDrawer.tsx`.
- New decision-readiness scorer under `src/lib/agent/readiness-score/**`.
- New UX comprehension gate under `src/lib/agent/comprehension-gate/**`.
- New live-answer quality wrapper under `src/lib/agent/quality/live-answer-quality.ts`.
- Source Nexus stub responses now include an `answerQuality` result and render Source answers through the Wave 0 quality wrapper.
- New request telemetry summary and PostHog adapter under `src/lib/observability/**`.
- New internal route `src/app/(maestro)/engineering/observability/page.tsx`, gated to explicit platform admins so client personas and tenant-admin personas cannot view cross-client telemetry rows.
- New observability access-control regression test for unauthenticated redirect, client-persona block, tenant-admin block, explicit platform-admin role access, and allowlisted operator access.
- Tightens Tower response shaping so compacted Atlas answers do not end on dangling connector fragments such as `and.` or `or to proceed with.` after fixed word-limit trims.
- New tenant-isolation Playwright specs under `tests/e2e/tenant-isolation/**`.
- New serial credentialed L4 runner, `npm run wave0:tenant-isolation`, for Clerk server-ticket tenant-isolation execution.
- New standing Wave 0 PR workflow at `.github/workflows/wave0-quality-gate.yml` and `npm run wave0:quality-gate`.
- Updates `lint:depth` to use the existing CLI `server-only` preload so depth lint can produce JSON in plain Node CI.
- New QA evidence report at `docs/build/WAVE-0-QA-EVIDENCE-2026-05-31.md`.

## QA / Validation

- Passed local validation: focused Jest suites for the new Wave 0 modules, 6 suites and 14 tests.
- Passed local validation: `node scripts/ci/answer-quality-gate.mjs` with 50 known-good, 30 known-bad, and 100% fixture classification.
- Passed local validation: `npm run wave0:quality-gate`.
- Passed local validation: focused Source runtime quality wiring tests, 4 suites and 16 tests.
- Passed local validation: focused observability access-control regression, 1 suite and 5 tests.
- Passed local validation: focused Tower response-shaper regressions, 2 suites and 48 tests.
- Passed local validation: `npm run test:nav`, 1 suite and 26 tests.
- Passed local validation: `npm run test:behaviors`, 4 suites and 90 tests.
- Passed local validation: `npm run --silent lint:depth -- --all`.
- Failed broad baseline validation: `npm run test:integration` remains red on existing Admin/Source/Tower/Programs/design contracts with no clear Wave 0 ownership.
- Passed local validation: focused ESLint on Wave 0 files with `--max-warnings=0`.
- Passed local validation: `npx tsc --noEmit --pretty false`.
- Passed local validation: `npm run build`.
- Passed local validation: env-backed local HTTP crawl against `next start` on port 3011. Public routes rendered, protected routes redirected to auth, and `/api/health` returned `ok: true`.
- Passed local validation: credentialed L4 tenant-isolation against `next start` on port 3012 with one worker, 10 Playwright tests.
- Passed local validation: `git diff --check`.
- Passed local validation: `npm run release:check -- --base origin/main --head HEAD`.
- Playwright tenant-isolation specs require real Clerk credentials and a running dev server; placeholder auth is not a green signal. Local credentialed serial run passed.
- Vercel PR previews are protected by Vercel Authentication. Follow-up automation used Vercel's protected-deployment bypass path without logging the bypass secret and reached the deployed AbarVa sign-in page.
- Credentialed L6 retest on the PR preview passed canonical auth, logged-out protection, non-observability route identity, query-param isolation, and most answer-quality checks. It found a critical observability isolation issue: `/engineering/observability` showed `apex-retail`, `meridian-health`, and `skyharbor-air` sample rows to authenticated client personas. Deployed browser crawl after the first remediation passed the three executive persona checks but found the same exposure for `admin@skyharbor-air.example.com`; the route now requires explicit `platform_admin` metadata or the AbarVa platform-operator email allowlist. Redeployed preview retest passed for Apex CIO, Meridian CDIO, SkyHarbor CTO, and SkyHarbor tenant-admin: all see `Admin access only`, no telemetry rows, and no captured route/RSC 4xx/5xx.
- The same L6 retest reported warning-level residuals: consistent RSC prefetch 503s on `/admin/dossiers` and `/tower?tab=programme_gates`, plus two SkyHarbor Atlas responses ending mid-sentence. The Atlas truncation class is now locally remediated in the response shaper. The RSC 503 warning did not reproduce in authenticated local browser crawl and remains a Vercel-authenticated preview retest target.

## Rollout Plan

Merge to `main` and deploy after credentialed L6 sign-off. The internal dashboard becomes available only to explicit platform admins at `/engineering/observability`; authenticated client and tenant-admin personas receive an admin-only notice with no telemetry rows. The Wave 0 harnesses become available to CI and future wave PRs through `Wave 0 Quality Gate`.

## Rollback Plan

`gh pr revert 2679` removes the Wave 0 harness additions. No database migration or data rollback is required.

## Audit Evidence

- PR URL: `https://github.com/anandsundaram-hash/abarva/pull/2679`.
- CI run: pending.
- QA evidence: `docs/build/WAVE-0-QA-EVIDENCE-2026-05-31.md`.
- Local validation: passed for unit, Wave 0 quality gate, answer-quality gate, focused lint, TypeScript, build, release gate, nav, behaviors, credentialed L4 tenant isolation, and diff hygiene.

## Known Gaps

- This first Wave 0 slice provides deterministic harnesses, standing CI, a live-answer wrapper, and Source Nexus runtime insertion. It does not yet insert the wrapper into the streaming Nexus SSE route; that needs a separate streaming-safe design.
- Human L6 walkthrough still needs remaining warning retests before production sign-off.
- After the Atlas truncation patch deploy, retest the PR preview for RSC prefetch 503s and SkyHarbor prompts 1/3.
- Broad `npm run test:integration` is an existing red baseline and must be treated separately from Wave 0-specific green gates unless a fresh `origin/main` baseline proves otherwise.
