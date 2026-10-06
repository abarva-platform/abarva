# 2026-09-02-intelligence-starter-prompts — Intelligence starter prompts

## Release ID

`2026-09-02-intelligence-starter-prompts`

## Status

`candidate`

## Plain-English Summary

The Intelligence surface offered three starter questions, and they described a narrower product than the one behind them: an AI-opportunity ask, a current-state gap ask, and a question about what the assistant can safely say. Two of the three pointed at evidence mechanics rather than at an executive decision, which made the surface read as a search box over loaded files.

The starters are now four, each pointing at a different executive job: understand the enterprise, decide where to invest, see what is coming in the industry, and pressure-test the strategy against both. They are the product's own statement of what the surface is for, so they should describe the advisory work it actually does.

Wording matters more here than it looks. The answer-mode classifier is lexical, so a starter phrased without an outlook or ranking signal falls through to the general mode and comes back less specific than the question deserves. A guard test pins the answer mode each starter reaches, so a future reword cannot quietly downgrade one of them without the suite saying so.

The outlook starter says "our industry" rather than naming the tenant's vertical. Verticals in the registry include values such as "Global Airline" and "Diversified Holdco", which do not read well interpolated into a sentence.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not feature-gated and not client-scoped.

- Layer 4 (Products — Intelligence): starter prompt copy and a test-only export.
- Layer 3 (Canonical model): unchanged.
- Layers 1-2 (Client intake, source adapters): unchanged.

## Client Applicability

- All clients: yes — starters are built per tenant from the landscape view model.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx` — replaced the three starters with four, one per executive job; exported `buildStarterPrompts` so the guard test can reach it; documented why the wording is load-bearing.
- `src/components/intelligence-advisory/__tests__/intelligence-starter-prompts.test.ts` — new. Pins the answer mode each starter classifies into, across more than one tenant.

## QA / Validation

- `npx jest src/components/intelligence-advisory/__tests__/intelligence-starter-prompts.test.ts` — 4 passed, run across two tenants using real landscape view models.
- `npx tsc --noEmit --pretty false` — 0 errors repo-wide, re-run after the test file was added.
- `npx eslint` on both changed files — clean.

## Rollout Plan

Merge to main via PR (squash). The repo-owned ACA main deploy workflow builds and deploys the image. No migration, no data build, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may shift shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: to be proven after deploy — template image, 100% traffic revision image, and worker job images must match the approved digest.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — the four starters rendered on a signed-in session, and one of them answered end to end.

## Rollback Plan

Revert the PR and redeploy through the same main deploy workflow. Copy-only change with no schema, data, or stored-state effect, so revert is complete and immediate.

## Known Gaps

- Not live-proven; the starters have not been seen rendered on a deployed revision.
- The classifier guard pins the mode, not the answer. A starter can reach the right contract and still return a weak answer; that is only provable live.
- The starter copy is shared across every tenant vertical. A tenant whose executives use different vocabulary may want its own set, which is not supported here.
- `buildStarterPrompts` is exported purely so the guard can reach it. If the component is refactored, the starters and their guard should move together into a module of their own.
- The answer-rendering complaints raised alongside this work — answer density, follow-up presentation, and visual hierarchy in the response body — are not addressed here and still need reproduction against a running instance.

## Audit Evidence

- PR URL: to be attached on open.
- CI run for the PR.
- Local validation output recorded in the QA section above.
- Post-deploy: ACA revision digest check and the live signed-in starter proof.
