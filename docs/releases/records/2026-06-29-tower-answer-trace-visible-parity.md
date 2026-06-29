# 2026-06-29-tower-answer-trace-visible-parity — Tower trace parity schema

## Release ID

`2026-06-29-tower-answer-trace-visible-parity`

## Status

`candidate`

## Plain-English Summary

Tower answer tracing now supports the new Claude-owned visible-answer contract. Claude returns structured JSON; AbarVa renders the visible strings from that JSON without rewriting them. The previous database check incorrectly required the raw JSON and rendered prose to be identical, which blocked fresh trace persistence.

## Layer Impact

- `client-data-lane`: updates the `cio_tower.answer_traces` database constraint.
- `global-control-lane`: improves the shared Tower proof harness used across tenants.

## Client Applicability

- All clients: yes, for Tower answer tracing.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds migration `20260629162000_cio_tower_answer_trace_visible_parity.sql`.
- Drops the obsolete raw-equals-rendered trace check.
- Adds a visible-section parity check requiring `artifacts.visible_section_parity` when raw Claude JSON and rendered visible text are both stored.

## QA / Validation

- Pending in PR: migration syntax review, TypeScript unaffected, release check.
- Live VNet finding that motivated the change: fresh Tower traces on revision `ca-abarva-web-lab-eastus--m02e9e66d` failed to persist with `answer_traces_check` because raw Claude JSON correctly differed from rendered visible text.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then apply the migration in the Azure/Postgres migration lane. Rerun the Tower answer executor and scorer after migration application.

## Deployment Authority

- Repo-owned deploy workflow: required for app/runtime image if paired with code.
- Shared runtime mutators: no manual ACA mutation from this release.
- Approved image digest: produced by main deploy.
- ACA runtime invariant: template image, active revision, and traffic must match the approved main digest.
- Worker image invariant: worker jobs should remain on approved main digest after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: not for migration alone; VNet executor/scorer proof required before claiming answer quality.

## Rollback Plan

Rollback by restoring the old constraint only if the runtime stops storing structured Claude contracts. Do not restore the old equality check while `raw_model_response` contains JSON and `rendered_response` contains visible extracted text.

## Audit Evidence

- PR URL: pending.
- Migration: `supabase/migrations/20260629162000_cio_tower_answer_trace_visible_parity.sql`.
- VNet failure evidence: `new row for relation "answer_traces" violates check constraint "answer_traces_check"` during Tower answer executor run `job-abarva-private-operator-eus-llpxagg`.

## Known Gaps

This does not fix the answer quality failures by itself. It unblocks truthful capture of prompt, raw model output, rendered visible text, and validation failures so the next prompt/contract fix can be measured.
