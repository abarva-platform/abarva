# 2026-09-13 — Source workspace hydration reliability

## Release ID

`2026-09-13-source-hydration`

## Status

`candidate`

## Plain-English Summary

The Source workspace now renders its governed portfolio shell before optional impact and action data finishes loading. A direct Contract 360 link also resolves its requested contract through the governed provider without loading the entire portfolio impact layer, and transient detail failures receive a bounded additional retry.

## Layer Impact

- **Products:** Source workspace loading and Contract 360 deep-link read behavior changed in the `global-control-lane`.
- **Source adapters:** No change.
- **Canonical model:** No schema or data mutation.
- **Client intake:** No change.

## Client Applicability

- All clients using the Source workspace read path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Portfolio loader uses deferred impact mode for the initial shell on every workspace tab.
- Contract detail fallback resolves the requested projection header and declared scope with deferred impact mode.
- Direct deep links use the governed ECL provider default and perform one bounded lifecycle requeue after request-level retries.
- Transient portfolio service failures receive two bounded retries; authorization failures still fail immediately.
- Direct ECL contract requests resolve header and declared scope from the contract projection before using the supplemental portfolio fallback.
- Updated focused routing, detail-retry, ECL browser-surface, and API route tests.

## QA / Validation

- Focused Jest suite: 4 suites, 37 tests passed.
- ESLint passed for all changed source and test files.
- TypeScript passed with the repository typecheck command.
- `git diff --check` passed.
- Live signed-in proof is required after ACA deployment for both `/source` initial paint and a direct Contract 360 URL.

## Rollout Plan

Merge the PR to `main`. The repo-owned ACA main deploy workflow builds a digest-pinned image, deploys the new revision, assigns 100% traffic, and runs the required runtime checks. No data-build job or migration is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: The repo-owned ACA deploy workflow only.
- Approved image digest: Recorded by the deployment workflow after merge.
- ACA runtime invariant: Template image, 100% traffic revision image, and required worker images must match the approved digest.
- Worker image invariant: No worker image change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source portfolio initial paint and direct Contract 360 hydration.

## Rollback Plan

Reassign traffic to the previous verified digest through the repo-owned ACA deployment lane. Revert the release candidate if the live read-path proof fails. No database rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Release workflow run and digest-pinned ACA runtime invariant.
- Signed-in Source workspace smoke output for `/source` and a direct contract URL.
- Focused Jest, ESLint, TypeScript, and diff checks listed above.

## Known Gaps

This release does not enrich or reload contract data, add archetype mappings, or implement report/email delivery. The heavy impact request may still take time in the background; the product exposes that state without blocking the governed shell.
