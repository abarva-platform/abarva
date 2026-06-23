# 2026-06-22-brain-contract — The Brain Contract (conformance spec) + Codex brief

## Release ID

`2026-06-22-brain-contract`

## Status

`candidate`

## Plain-English Summary

Adds **the Brain Contract** (`docs/build/BRAIN_CONTRACT.md`) — the testable invariants derived from `docs/build/ABARVA_HOW_THE_BRAIN_WORKS.html` that the product must satisfy to actually *instantiate the brain* (one canonical substrate, retrievable context, one shared engine, one aVa voice, model-emitted exhibits, end-to-end decision continuity, tenant-fenced honesty). It reframes the audit from "UI regression test" to **brain conformance**, and it is the anti-flip-back anchor: a committed spec + a gate, so no stale branch or rollup can quietly revert the architecture. Also adds a Codex brief (`docs/build/BRAIN_CONTRACT_CODEX_BRIEF.md`) to instantiate and conformance-prove the contract. Both align to the **existing** Playwright tenant-matrix gate as the canonical proof harness (no parallel gate); they flag `continuity` (invariant 6) as the one column still to add. Docs only — no runtime change.

## Layer Impact

`global-control-lane` — defines the cross-surface architecture contract (the acceptance test) that Home, Intelligence, Tower, and the other surfaces must meet. Documentation / governance only; no code, data-plane, schema, or runtime behavior change.

## Client Applicability

All clients — the contract is the standard every tenant's surfaces must satisfy. This PR is docs only, so no client receives a behavior change; it governs future surface PRs.

- All clients: yes (as a standard; no behavior change in this PR)
- Specific clients: n/a
- Internal only: the docs themselves
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/build/BRAIN_CONTRACT.md` — the 7 invariants, canonical owners, and proof columns.
- `docs/build/BRAIN_CONTRACT_CODEX_BRIEF.md` — the instantiate-and-prove brief for Codex.

## QA / Validation

- Docs only; no code paths change. `release:check` green; markdown reviewed for accuracy against the live gate's columns (`render`, `intel`, `dims19`, `synthesis`, `readable`, `visual`, `grounded`, `noRawId`, `experts`, `fence`). Enforcement lives in the existing `scripts/qa/tenant-matrix-gate.mjs`. Status: **passed** (docs + release-check).

## Rollout Plan

Merge to `main`. No runtime rollout — documentation. The contract gates future surface PRs (conformance = the matrix green for all tenants on the deployed app). No migration, image, flag, or worker change.

## Deployment Authority

- Repo-owned deploy workflow: none (docs only)
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unchanged
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: no for this PR; the contract *requires* it for the surfaces it governs

## Rollback Plan

Revert the two docs. No runtime impact (documentation only).

## Audit Evidence

- PR URL + the two committed docs.
- The existing `scripts/qa/tenant-matrix-gate.mjs` they reference (the enforcement harness).

## Known Gaps

`continuity` (invariant 6 — a decision referenced across surfaces) is not yet a gate column; the contract flags it as the one to add. Depth-of-corpus (e.g. ≈210 experts) is tracked as a coverage metric, **not** a pass/fail gate, by design — so conformance never fails on roadmap.
