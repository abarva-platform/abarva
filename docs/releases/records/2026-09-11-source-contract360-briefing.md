# 2026-09-11-source-contract360-briefing — Contract 360 briefing surfaces

## Release ID

`2026-09-11-source-contract360-briefing`

## Status

`draft`

## Plain-English Summary

The Contract 360 tabs read as a dashboard: labels, ratios and bare figures that a
reader has to assemble into a story. This changes them to read as a briefing —
each surface opens with a sentence someone can repeat out loud, every count is
shown against the total it is counted from, and a facet that a given contract
type does not require is stated as "not applicable" instead of rendering as a
zero next to real gaps.

Three correctness defects are fixed along the way. Each is the same mistake in a
different place: one label standing over two different populations.

1. **The benchmarking-clause line was inverted.** The contract record stores this
   as a value ("present", "limited", "absent", "none"), but the code tested
   whether the field was *filled in* rather than what it *said*. Every filled-in
   value counts as true, so a contract whose record explicitly says it has no
   benchmarking clause was described on screen as having one, and the "not
   established" wording could only ever appear for a contract holding no value at
   all. The more carefully the data was recorded, the more confidently wrong the
   output. The page now reports the recorded value.

2. **A readiness word blamed the wrong thing.** A contract could show "education
   basis is partial" while every applicable step beneath it read as loaded,
   because the summary was derived from an unsigned review status rather than
   from the evidence. It now names its own cause, and a step the contract type
   does not require is no longer counted against readiness.

3. **Value figures carried no concept.** Recoverable, avoidable, negotiated and
   realized value are four different claims about money and are not
   interchangeable. They now render side by side, each labelled, explicitly not
   summed, with a governed refusal styled so it cannot be misread as an amount.

It also connects a seven-step optimization workflow that was already built and
had no caller: the Optimize tab now shows where a case actually stands, derived
from baseline status, evidence readiness, amount traceability and opportunity
maturity, so a case cannot appear to have advanced past work it has not done.

## Layer Impact

- `global-control-lane`: shared Source product behaviour for all clients, not
  feature-gated. No client-scoped schema, seed, ingestion or retrieval changes,
  so this is not a `client-data-lane` release.

- **Layer 4 (Products · Source).** Presentation and view-model only. The Contract
  360 tabs render new components; the education view gains two derived fields
  that explain a readiness state.
- **Layer 3 (Canonical model).** Unchanged. No schema, migration, loader or
  adapter is touched, and no stored value changes. The benchmarking fix changes
  how a stored value is *read and described*, not what is stored.

## Client Applicability

- All clients: yes — this is shared Source product behaviour.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a direct replacement of the existing panels.

## Changes Included

- `src/lib/source/contract-intelligence/education.ts` — replaces the
  `hasBenchmarking` boolean with the recorded `benchmarkingClause` value; adds
  `requiredEvidenceCount` and `missingEvidence` so a readiness state carries its
  reason; stops counting a not-required step as outstanding.
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts` — passes the
  recorded clause value through; derives the governed workflow position via
  `deriveOptimizeWorkflowPosition` and exposes it as `optWorkflow`.
- `src/app/(maestro)/source/preview/workspace/Contract360Briefing.tsx` — new:
  workflow rail, value ledgers, education briefing.
- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx` —
  mounts the three components; removes the superseded education panel rather
  than leaving it unmounted.
- `src/app/(maestro)/source/preview/workspace/workspace.css` — the design's
  inline styles ported to named classes under a `sw-c3-` prefix.
- Tests: new `Contract360Briefing.test.tsx`; new benchmarking cases in
  `education.test.ts`; corrects a tab-list assertion in
  `buildViewModel.numeric.test.ts` that had been failing on main since the
  Education tab was introduced.

## QA / Validation

- `npx tsc -p tsconfig.json --noEmit` — clean (0 errors).
- `npx eslint` on every changed file — clean (0 errors, 0 warnings).
- `npx jest 'preview/workspace' src/lib/source/contract-intelligence
  src/lib/source/data-model` — 34 suites, 286 tests, all passing.
- **Mutation check on the benchmarking guard.** The new cases were run against
  the previous implementation and 4 of them fail, confirming they detect the
  inversion rather than merely passing alongside it. The pre-existing test set
  the boolean directly and so never exercised the coercion that caused the bug.
- **Direct render inspection.** The three components were rendered with the
  production stylesheet and reviewed visually. Two defects were found and fixed
  this way that the tests did not catch: a duplicated action line, and two
  layout modifier classes that set grid columns without setting `display: grid`.
- Not validated locally: the assembled page against live tenant data. This
  surface reads the data plane through the client VNet, which a local dev server
  cannot reach, so end-to-end verification belongs to the signed-in proof below.

## Rollout Plan

Merge to `main`, then the repo-owned ACA main deploy workflow builds and deploys
in the normal lane. No migration, no seed, no data build, no flag. Presentation
and view-model only, so the change is live as soon as the new revision carries
100% traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. No ad-hoc
  `az acr build` or `az containerapp update` is required or permitted here.
- Shared runtime mutators: none. This change does not touch env vars, flags,
  scale, secrets, traffic or DNS.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: to be proven after deploy — Container App template
  image, 100%-traffic revision image and worker job images must all match the
  approved digest.
- Worker image invariant: unchanged; no worker job is affected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes.** Open a contract whose record carries a
  negative benchmarking value and confirm the Education tab reports it as
  recorded rather than as "present"; confirm the Optimize tab renders the
  workflow position; confirm the Economics ledgers render four labelled
  concepts. Until that is captured this record may say `merged` or `deployed`,
  not `live-proven`.

## Rollback Plan

Revert the commit and redeploy through the same workflow. There is no migration
and no data change, so rollback is a straight image roll-back to the previous
approved digest with no reconciliation step and no data loss.

## Known Gaps

- **Not yet live-proven.** Validation so far is typecheck, lint, 286 tests and
  direct component rendering. The assembled page has not been exercised against
  live tenant data, because this surface reads the data plane through the client
  VNet and a local dev server cannot reach it. The signed-in proof named under
  Deployment Authority is still owed.
- **Scope is three surfaces, not the whole design.** The design contract covers
  eight tabs plus a register-only tier that withholds tabs for contracts with no
  depth package. This release implements the workflow rail, the value ledgers
  and the education briefing. Story, Scope, Relationship and Evidence keep their
  current rendering, and the register-only tier is not built.
- **Portfolio arithmetic is untouched and still wrong.** Known open defects on
  the portfolio tabs — an archetype partition that sums past the size of the
  book, three disagreeing contract-depth counts, and an evidence matrix that
  disagrees with the lanes directly beneath it — are out of scope here and
  remain open.
- **The benchmarking fix changes description, not data.** Contracts whose record
  carries no value still read "not established". Populating that field is a data
  task, not a product one.

## Audit Evidence

- Commit on branch `claude/source-contract360-v3-design`.
- CI run for the PR, including `npm run release:check`.
- Local validation output recorded under QA / Validation above.
- Post-deploy: the ACA runtime invariant check and the signed-in route proof
  named under Deployment Authority.
