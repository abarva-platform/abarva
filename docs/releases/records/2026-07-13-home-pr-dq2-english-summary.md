# 2026-07-13-home-pr-dq2-english-summary - Home Plain-English Context Summary

## Release ID

`2026-07-13-home-pr-dq2-english-summary`

## Status

`candidate`

## Plain-English Summary

Home now renders a business-readable "What this means" section before the dense
context and quality details. It explains what AbarVa currently knows, how
complete the context is, what evidence backs it, where relationships are thin,
what aVa can safely answer, what decisions should not rely on the data yet, the
next data action, and how Home, Intelligence, Moves, Source, and Tower are
affected.

This is a deterministic read-only rendering change. It does not call Claude for
the summary, does not remediate data, does not create or promote candidates, and
does not change module runtime consumption.

## Layer Impact

- Release lane: `global-control-lane` because Home rendering and aVa prompt
  alignment are shared product behavior for all clients.
- Home surface: adds an executive context summary above the detailed Home
  knowledge snapshot.
- Home data-quality read model: consumes existing data-quality posture only;
  no new source of truth is created.
- aVa Home rail: aligns suggested prompts and caveat lists to the same
  plain-English summary posture.
- Audit/reporting: adds a deterministic Home English summary proof bundle.

## Client Applicability

- All clients: Yes, the renderer works from each tenant's existing Home
  data-quality posture.
- Specific clients: SkyHarbor/Airline Demo gets explicit source-rich,
  active-context-thin language when that posture is present.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- `src/lib/home/home-english-summary.ts`
- `src/app/(maestro)/home/page.tsx`
- `src/components/home/HomeSurface.tsx`
- `src/lib/home/__tests__/home-english-summary.test.ts`
- `src/components/home/__tests__/HomeSurface.test.tsx`
- `scripts/audit/build-home-english-summary.ts`
- `reports/home-english-summary/latest/*`
- `package.json`

## QA / Validation

- Pass: `npm run audit:home-english-summary`
- Pass: `npm run test:home-english-summary`
- Pass: Home data-quality tests via `npx jest src/lib/home/__tests__/home-data-quality.test.ts src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Pass: Home surface tests via `npx jest src/lib/home/__tests__/home-data-quality.test.ts src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Pass: Home aVa quality audit via `npm run audit:home-ava-representation`
- Pass: `npx eslint 'src/app/(maestro)/home/page.tsx' src/components/home/HomeSurface.tsx src/lib/home/home-english-summary.ts src/lib/home/__tests__/home-english-summary.test.ts src/components/home/__tests__/HomeSurface.test.tsx scripts/audit/build-home-english-summary.ts`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass after larger local heap: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`, then deploy through the approved Azure Container Apps main
workflow. The change becomes visible on `/home` after the ACA image is deployed
and receives traffic.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared ACA runtime.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, `/home` and `/home?candidatePreview=true`.

## Rollback Plan

Revert the PR or redeploy the previous ACA image. No data rollback is required
because this PR does not write tenant data, promote candidates, update Active
Tenant Access, or change module runtime consumption.

## Audit Evidence

- Proof bundle: `reports/home-english-summary/latest/`
- Local validation output after commands are run.
- Post-deploy ACA revision, health, runtime invariant, and signed-in browser
  proof after merge/deploy.

## Known Gaps

- This PR does not regenerate candidate data or fix source-rich/candidate-thin
  coverage. It explains that posture in plain English so users do not overtrust
  thin context.
