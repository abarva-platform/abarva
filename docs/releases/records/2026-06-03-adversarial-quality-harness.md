# 2026-06-03-adversarial-quality-harness — Adversarial Quality Harness

## Release ID

`2026-06-03-adversarial-quality-harness`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic adversarial quality dashboard for the agent golden corpus,
strengthens the corpus with off-domain and current-affairs refusal probes, and
documents the runbook for deterministic, live, scoring, and chaos-drill evidence.

## Layer Impact

- Release lane: `internal-admin`.
- Layer impact: internal QA, release evidence, and agent-quality governance.
- Runtime impact: no product route, migration, data-plane, or Azure resource
  changes.

## Client Applicability

- All clients: no runtime change.
- Specific clients: none.
- Internal only: QA harness, dashboard, and runbook.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/qa/adversarial-quality-dashboard.mjs`
- `package.json`
- `tests/agent-quality/golden/atlas.jsonl`
- `tests/agent-quality/golden/sentinel.jsonl`
- `docs/build/ADVERSARIAL_QUALITY_DASHBOARD_2026-06-03.md`
- `docs/runbooks/adversarial-quality-harness.md`

## QA / Validation

- Pass: `npm run qa:adversarial-quality`
- Pass: `npm run qa:agent-quality:corpus`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The harness becomes available as an internal QA command and
release-evidence artifact. No runtime rollout or Azure provisioning is required.

## Rollback Plan

Revert the documentation, package-script, dashboard, and golden-corpus commit.
No data, schema, runtime, or infrastructure rollback is required.

## Audit Evidence

- This release record.
- `docs/build/ADVERSARIAL_QUALITY_DASHBOARD_2026-06-03.md`
- Local validation output for the deterministic dashboard and existing corpus
  validator.
- Pull request diff and CI checks.

## Known Gaps

- This does not run a 24-hour agent army.
- This does not execute live model scoring without a preview URL and demo auth.
- This does not run Azure outage drills without drill tokens.
