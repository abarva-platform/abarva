# 2026-10-07-moves-workspace-v2-enroll — Enroll the phase-workspace v2 for the demo tenant

## Release ID

`2026-10-07-moves-workspace-v2-enroll`

## Status

`candidate`

## Plain-English Summary

The Moves phase-workspace "v2" redesign shipped in three increments, all behind
the `moves_workspace_v2` feature flag (default OFF): the shell (one slim phase
rail + the capture → generate → outcome → gate sub-step spine), the OUTCOME
findings surface (reviewable finding cards derived from the real current-state
readiness report), and the charts layer (readiness-/gap-derived charts where
real data exists, illustrative-labelled otherwise). With the flag OFF the
product renders exactly as before.

This enrols the flag for the **synthetic demo tenant** so the redesign can be
reviewed signed-in. It is a flag `includeTenants` change only — no feature code
changes, no behavior change for any other tenant.

## Layer Impact

Release lane: `global-control-lane` — a feature-flag enrolment of shared Moves
UI for one tenant. No schema, data, gate-logic, or persistence change; the
redesign is presentation/arrangement only (capture fields, saves, the
gate/approve pipeline, evidence, approvals and the readiness-workbook
upload/accept are all unchanged under the flag).

- `4 PRODUCTS` / Moves: the phase workspace renders in the v2 arrangement for
  the enrolled tenant.

## Client Applicability

- The synthetic demo tenant: sees the v2 phase workspace.
- All other tenants: unchanged (flag stays OFF).
- Internal only: No. Public/demo only: the enrolment targets a synthetic demo
  tenant.
- Feature flag: `moves_workspace_v2` — enrolled via `includeTenants`.

## Changes Included

- `src/lib/features/registry.ts` — `moves_workspace_v2.includeTenants` set to the
  demo tenant; summary updated to note the enrolment and that increments 2–3
  ship under the same flag.
- `docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md` — regenerated if the
  flag-summary change made it stale.

## QA / Validation

- `npm run release:check` — enforced in CI.
- The v2 feature code (increments 1–3) is covered by its own jest suites, merged
  green.
- **Live signed-in proof — REQUIRED after deploy** and captured separately: the
  enrolled tenant's phase workspace must be walked signed-in (the v2 shell,
  capture→generate→outcome→gate spine, findings, and charts render; capture,
  saves, gate, evidence, approvals and the workbook still work) before this is
  called live-proven.

## Rollout Plan

Merge to `main` via squash PR; the repo-owned `aca-main-deploy` workflow ships
the digest-pinned image. The flag resolves server-side; the enrolled tenant sees
v2 on the next deploy. Then capture the live signed-in proof.

## Rollback Plan

Revert the PR, or remove the demo tenant from `includeTenants`. The flag returns
to OFF everywhere; no data or migration impact.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic by itself and touches no Container
App template, revision weight, or secret. After deploy, prove the ACA runtime
invariant (template image = 100% traffic revision = required workers = approved
digest) and capture the live signed-in proof before calling it live-proven.

## Known Gaps

- Accept/Challenge on the findings surface is presentation-only (no
  findings-attestation store yet); it feeds an honest gate line but does not
  persist or gate the governed pipeline (carried from the increment-2 record).
- P4 cost/value/sensitivity charts are illustrative-labelled (no governed
  Finance baseline); real figures await a baseline.

## Audit Evidence

- CI: `npm run release:check`.
- The PR + merge commit; the post-deploy ACA digest proof + the live signed-in
  walk (captured separately).
