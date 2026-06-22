# 2026-06-22-home-gate-exhibit-informational — Home live-gate: exhibit check is informational

## Release ID

`2026-06-22-home-gate-exhibit-informational`

## Status

`candidate`

## Plain-English Summary

Adjusts the Home live-gate QA script (`scripts/qa/home-live-gate.mjs`) so its "structured exhibit" check is **informational, not a hard pass/fail**. PR #3836 correctly **suppresses inferred (prose-scraped) exhibits**, so a prose-only answer is now the right, honest result — the gate must not report `FAILED` just because no structured exhibit was emitted. The script still hard-fails the real gates (React `/home` served, a synthesized answer with no fake `Also:` row-dump, no raw internal IDs, named experts, cross-tenant fence); it now reports the exhibit state for information only.

## Layer Impact

`internal-admin` lane — a QA / verification script only. No product surface, data-plane, schema, flag, or runtime behavior changes.

## Client Applicability

Not applicable — internal QA tooling, run by an operator against the deployed app. No client receives anything from this change.

- All clients: no
- Specific clients: no
- Internal only: yes (operator QA script)
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/qa/home-live-gate.mjs` — the "structured exhibit emitted" assertion becomes informational (always reports, never fails on a correctly-suppressed exhibit).

## QA / Validation

- `node --check scripts/qa/home-live-gate.mjs` passes. The script is run manually, signed-in, against the deployed app; no runtime/product code changes. Status: **passed** (syntax) / not run (live verification is the operator's signed-in step).

## Rollout Plan

Merge to `main`. No runtime rollout — it is a QA script run manually on demand. No migration, image, flag, env, or worker change.

## Deployment Authority

- Repo-owned deploy workflow: none triggered by behavior (QA script only)
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unchanged
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: no (this is itself the verification tool; it is exercised when the operator runs the Home gate)

## Rollback Plan

Revert the one-line change. No runtime impact (QA script only).

## Audit Evidence

- PR URL + `node --check` output.
- The gate's own ✅/❌ output when the operator runs it against the deployed app.

## Known Gaps

None known.
