# 2026-06-27-tower-roi-honesty — Tower ROI Honesty Guard

## Release ID

`2026-06-27-tower-roi-honesty`

## Status

`candidate`

## Plain-English Summary

Tower aVa now treats portfolio ROI as a directional initiative-value proxy unless a board-grade ROI basis is explicitly loaded. This prevents the chat from presenting complete measured-value rows as true portfolio ROI.

## Layer Impact

- `global-control-lane`: shared Tower answer shaping changes for all tenants using the Tower factual spine.
- Runtime app layer: the rendered Tower chat answer changes wording for ROI questions without changing stored data.

## Client Applicability

- All clients: Tower tenants using the shared Tower aVa chat path.
- Specific clients: Lakeshore is the live regression target for this fix.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None; conservative answer wording is global.

## Changes Included

- `src/lib/atlas/tower-factual-spine.ts`
- `src/lib/atlas/__tests__/tower-factual-spine.test.ts`
- `scripts/qa/tower-chat-quality-fix-crawl.mjs`

## QA / Validation

- `npx eslint src/lib/atlas/tower-factual-spine.ts src/lib/atlas/__tests__/tower-factual-spine.test.ts` — pass.
- `npx jest src/lib/atlas/__tests__/tower-factual-spine.test.ts --runInBand` — pass.
- `npm run release:check` — pass.
- `npx eslint scripts/qa/tower-chat-quality-fix-crawl.mjs` — pass.
- Live Tower crawl via `scripts/qa/tower-chat-quality-fix-crawl.mjs` — pass, 13/13 after the deployed ROI fix.

## Rollout Plan

Merge to `main`, build and deploy through the approved Azure Container Apps main deployment path, then rerun the signed-in Tower crawl against `https://app.abarva.ai/tower`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy from `main`.
- Shared runtime mutators: no non-main/runtime-local mutator is approved.
- Approved image digest: produced by the main ACA deploy workflow after merge.
- ACA runtime invariant: template image, latest revision, and 100% traffic must match the approved main digest.
- Worker image invariant: no worker image change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Tower aVa crawl with Lakeshore auth state.

## Rollback Plan

Revert this commit and redeploy the prior approved ACA digest. No database rollback is required for this wording-only change.

## Audit Evidence

- Previous live crawl report: `/Users/anand/Downloads/tower-chat-quality-fix-2026-06-27T04-33-46-017Z`.
- Previous failure: `q09-portfolio-roi` failed because the answer was not honest enough about loaded-evidence limits.
- Passing live crawl report: `/Users/anand/Downloads/tower-chat-quality-fix-2026-06-27T05-02-41-848Z`.

## Known Gaps

This does not address Tower latency. It only closes the remaining ROI honesty failure.
