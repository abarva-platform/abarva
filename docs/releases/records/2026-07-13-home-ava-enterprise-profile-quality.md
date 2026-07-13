# 2026-07-13-home-ava-enterprise-profile-quality — Home aVa Enterprise Profile Quality

## Release ID

`2026-07-13-home-ava-enterprise-profile-quality`

## Status

`candidate`

## Plain-English Summary

Home now grounds the tenant overview and Home aVa answers in the governed enterprise profile source instead of thin context-browser labels. Meridian/Healthcare Demo renders the correct synthetic enterprise profile facts such as legal name, industry posture, headquarters, revenue, employee count, business model, segments, priorities, and caveats. Home aVa preset answers are routed through the audited Claude synthesis path when enabled, with deterministic fallback preserved.

## Layer Impact

- Global control lane: Home aVa’s visible answer path now uses Claude synthesis over the governed Home packet and renders structured answer packets in the expanded rail.
- Enterprise data layer: Home summary snapshots can read the governed enterprise profile source template as a required tenant profile domain; missing/placeholder values remain gaps instead of invented facts.
- UI layer: The Home aVa rail stays hidden until evoked and expands into a larger answer panel with the same structured rendering used by aVa answer packets.

## Client Applicability

- All clients: Yes, for Home enterprise-profile rendering and Home aVa answer quality.
- Specific clients: Meridian/Healthcare Demo receives the main verified correction.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Claude synthesis can be disabled with `HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED=false`; default is enabled with deterministic fallback.

## Changes Included

- Added governed enterprise profile read model for Home summary and Home aVa answers.
- Updated Home summary snapshot derivation to use enterprise profile facts before context-browser fallback rows.
- Updated Home aVa company-profile answers to include governed profile facts and direct technology budget when present.
- Added Home Claude synthesis for the `/api/home/know/ask` governed Home packet path.
- Updated Home aVa expanded rail sizing and answer-packet rendering.
- Added post-deploy Home crawl interaction so `/home` screenshots evoke aVa, expand the rail, ask the company-overview prompt, and save the transcript.
- Added Meridian regression tests for profile accuracy and thin-row protection.
- Regenerated Home summary/content accuracy reports.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/home/__tests__/home-summary-snapshot.test.ts src/lib/home/know/__tests__/v7-home-ask.test.ts --runInBand`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- Pass: `npx eslint src/components/home/HomeSurface.tsx src/app/api/home/know/ask/route.ts src/lib/home/home-summary-snapshot.ts src/lib/home/know/v7-home-ask.ts src/lib/home/know/home-know-claude-synthesis.ts src/lib/enterprise-data/enterprise-profile/enterprise-profile-read-model.ts scripts/crawl/post-deploy-harness.ts`
- Pass: `npm run audit:home-summary-snapshot`
- Pass: `npx tsx scripts/qa/home-content-accuracy-audit.ts` (`397 pass / 0 watch / 0 fail`)
- Pass: `npm run audit:enterprise-naming`
- Not run yet: post-merge ACA deploy, runtime invariant, production health, and signed-in browser crawl.

## Rollout Plan

Merge to `main` through a PR. The repo-owned ACA main deploy workflow builds and deploys the image. After deploy, run the ACA runtime invariant, production health check, and signed-in Home crawl, then capture a screenshot proving Meridian Home and expanded aVa render correctly.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: to be assigned by ACA main deploy
- ACA runtime invariant: required after deploy
- Worker image invariant: no worker change expected
- Feature/env flag update path: none
- Live signed-in proof required: yes, Home route and Home aVa expanded response

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. The deterministic Home answer path remains available as fallback if Claude synthesis is disabled by `HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED=false`.

## Audit Evidence

- Focused Jest tests for Home summary snapshot and Home aVa question routing.
- TypeScript compile.
- Home summary snapshot audit output under `reports/home-summary-snapshot/latest/`.
- Home content accuracy audit output under `reports/home-content-accuracy/latest/`.
- Post-deploy ACA and signed-in browser proof to be attached after merge/deploy.

## Known Gaps

Live production proof is not complete until the candidate is merged, deployed through ACA, and a signed-in browser screenshot is captured.
