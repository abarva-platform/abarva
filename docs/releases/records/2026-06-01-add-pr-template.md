# 2026-06-01-add-pr-template — Add Release-Focused PR Template

## Release ID

`2026-06-01-add-pr-template`

## Status

`candidate`

## Plain-English Summary

This change standardizes the pull request template around summary, release classification, QA, rollout, and rollback so each non-trivial change carries the release-control information required by `AGENTS.md`.

## Layer Impact

Ops-release-lane repository governance only. The change affects GitHub pull request authoring and does not change runtime behavior, product UI, authentication, data access, migrations, or infrastructure.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: AbarVa maintainers and contributors opening pull requests.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `.github/PULL_REQUEST_TEMPLATE.md`
- `docs/releases/records/2026-06-01-add-pr-template.md`

## QA / Validation

- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. GitHub applies the pull request template automatically to new pull requests after merge.

## Rollback Plan

Revert the template commit to restore the previous pull request template behavior.

## Audit Evidence

- Pull request for `codex/add-pr-template`
- Local validation commands listed above
- CI checks on the pull request

## Known Gaps

No runtime controls change in this PR; the updated template applies only to new pull requests after merge.
