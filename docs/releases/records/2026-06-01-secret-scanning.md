# 2026-06-01-secret-scanning — Secret Scanning

## Release ID

`2026-06-01-secret-scanning`

## Status

`candidate`

## Plain-English Summary

Adds gitleaks secret scanning to local pre-commit hooks and pull-request CI. The check scans staged changes locally and the PR diff in CI so real credentials are caught before merge.

## Layer Impact

Engineering governance / internal-admin: adds a security guardrail to local commits and GitHub Actions.

Control plane: no runtime behavior, route, schema, or product UI changes.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: engineering security controls.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `.github/workflows/secret-scanning.yml`
- `.husky/pre-commit`
- `package.json`
- `package-lock.json`
- `docs/runbooks/dev-environment.md`
- `docs/runbooks/secret-scanning.md`

## QA / Validation

- Passed: `npm run secrets:staged`
- Passed: `npm run secrets:scan -- --log-opts="origin/main..HEAD"`
- Passed after release-record QA wording fix: `npm run release:check -- --base origin/main --head HEAD`
- Passed: `git diff --check`

## Rollout Plan

Merge to `main`. The pre-commit hook becomes active after developers run `npm install`; the GitHub Actions workflow runs on future pull requests.

## Rollback Plan

Revert this PR to remove the gitleaks dependency, npm scripts, hook change, workflow, and runbook updates.

## Audit Evidence

- CI check: `Secret Scanning / Gitleaks PR diff`
- Local command: `npm run secrets:staged`
- Branch command: `npm run secrets:scan -- --log-opts="origin/main..HEAD"`

## Known Gaps

This scans staged changes and PR diffs. A full historical repository scan/rotation exercise remains a separate security-hardening task.
