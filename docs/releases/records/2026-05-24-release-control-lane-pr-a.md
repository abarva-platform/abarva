# 2026-05-24-release-control-lane-pr-a — Release Control Discipline

## Release ID

`2026-05-24-release-control-lane-pr-a`

## Status

`released`

## Plain-English Summary

This release adds the operating discipline that makes AbarVa changes trackable before pilot onboarding. It does not change product behavior for clients. It makes every future release-impacting PR explain, in English, what changed, which layer changed, who is affected, what QA was performed, how the change rolls out, and how it can be rolled back.

## Layer Impact

- `ops-release-lane`: Adds the release-control policy, release-record template, first release record, and CI enforcement script.
- `app-control-lane`: Adds repo-level instructions and PR-template requirements that govern future changes to the app control lane. No runtime app route or API behavior changes in this PR.

## Client Applicability

- All clients: The process applies to every future global/control-lane release, but this PR does not alter client-facing runtime behavior.
- Specific clients: None.
- Internal only: AbarVa engineering and agent workflow.
- Public/demo only: None.
- Feature flag: Not applicable.

## Changes Included

- Root `AGENTS.md` gains a release-control rule for all agents.
- `.github/pull_request_template.md` gains release lane, layer impact, client applicability, rollout, rollback, and audit evidence sections.
- `.github/workflows/release-control.yml` runs the deterministic release-control gate on pull requests.
- `scripts/release-control/check-release-record.mjs` checks that release-impacting PRs include an English release record.
- `package.json` adds `npm run release:check`.
- `docs/releases/RELEASE_CONTROL_POLICY.md` and `docs/releases/templates/release-record-template.md` define the policy and record shape.

## QA / Validation

- `npm run release:check -- --base origin/main --head HEAD` passed locally and found this release record.
- `node scripts/release-control/check-release-record.mjs --base origin/main --head HEAD` passed locally.
- The gate is deterministic and uses `git diff --name-only <base>...<head>` so it can run in CI and locally.

## Rollout Plan

Merge this PR to `main`. GitHub Actions will run the release-control workflow on future pull requests. The PR template and `AGENTS.md` rule become active for future agents as soon as the branch lands.

## Rollback Plan

Revert this PR to remove the release-control gate, PR template additions, and policy docs. Since this PR adds no database migration and no runtime app code, rollback is a normal git revert.

## Audit Evidence

- PR #2303: `https://github.com/anandsundaram-hash/abarva/pull/2303`.
- Merge commit: `9931d878d4e97b1f2808392f3855593134547acd`.
- CI run for `Release record and impact note` passed.
- PR checks passed: ESLint, Fresh Postgres migration replay, New migration drift surface, Production readiness gate, Routes and disclaimers, Run hygiene gate, Score depth exemplars, Typecheck plus reasoning-layer tests, Validate agent quality corpus.
- Vercel PR contexts passed for `abarva` and `nexus`.
- Local validation output for `npm run release:check -- --base origin/main --head HEAD`.
- The policy document: `docs/releases/RELEASE_CONTROL_POLICY.md`.

## Known Gaps

This is markdown-and-CI enforcement only. A DB-backed `/admin/releases` surface is intentionally deferred to the next release-control slice.
