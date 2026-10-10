# Source New phase previews

## Release ID

`2026-10-10-source-new-phase-preview`

## Status

Candidate. Local validation passed; not merged, deployed, or live-proven by this record.

## Plain-English Summary

An event phase that has not opened now shows a navigable outline of its planned steps. The outline
contains empty questions and an always-visible preview notice. It does not display supplier,
agreement, package, approval, or release data as completed work. A phase excluded by the event's
declared sourcing path instead says "Not on this path" and shows no preview.

## Layer Impact

Release lane: **global-control-lane**. Product presentation only. No canonical object, adapter,
data build, read-model value, authority check, or tenant boundary changes.

## Client Applicability

All clients using the Source New workspace. No feature flag or client-specific data dependency.

## Changes Included

- Source New work view: empty step previews for unopened phases and an explicit off-path view.
- Presentation-only step inventory for the four Source New phases; no new canonical stage keys.
- Render tests for preview navigation, state honesty, and off-path exclusion.

## QA / Validation

- Focused workspace suite: 72 passed.
- TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
  The default 4 GB Node heap exhausted before reporting diagnostics.
- ESLint on changed TypeScript files and `git diff --check`: passed.
- Isolated mutations from a passing baseline: shortening the preview notice failed the supplier
  render test; removing the off-path branch failed the off-path render test; replacing the
  phase-specific inventory failed the market-package render test. Each mutation was restored and
  the clean focused suite passed again.
- Signed-in acceptance: not run. No client data or workflow was mutated.

## Rollout Plan

Squash-merge after applicable checks and review. Only the repo-owned ACA main deploy workflow may
build and shift shared web traffic. Verify the digest-pinned web template, 100%-traffic revision,
and required worker images separately, then walk the affected phases signed in before calling the
release live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest and ACA/worker invariant: to be read from the successful main deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for unopened supplier and market phases and an off-path event.

## Rollback Plan

Revert the merge through a PR and let the repo-owned main workflow deploy the prior work view. No
data or schema rollback is needed.

## Audit Evidence

The PR diff, focused test output, mutation results, release check, main deploy run, and signed-in
phase walk are the evidence trail. Runtime and signed-in links are pending.

## Known Gaps

The preview is an interface outline, not working supplier, NDA, or RFx functionality. Step names
and questions are presentation vocabulary, not governed stage or approval definitions. No data
load, workflow advance, or signed-in acceptance is claimed here.
