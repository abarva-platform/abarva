# MOVES-P3-QUALITY-005 — Approved Approach to Architecture Binding

## Release ID

`2026-07-23-moves-target-architecture-assembly`

## Status

`candidate`

## Plain-English Summary

Makes P3 a governed two-part decision. Nexus first presents evidence-backed solution options; a human must actively select and approve one with rationale and accepted tradeoffs. Only then may Approve & Build assemble Target Architecture and its companion design artifacts in sequence. Every artifact is bound to one immutable decision packet and context snapshot. Target Architecture now validates a Structured Architecture Brief and ArchitectureModel before narrative generation; it stops instead of publishing a generic fallback when those structures are incomplete.

## Layer Impact

- `global-control-lane`: shared Moves P3 decision, generation boundary, prompt binding, sequential Target Architecture assembly, worker enforcement, and artifact lineage.
- Additive data-plane schema: durable batch/dependency/idempotency fields on `deliverable_runs` with tenant-fenced dependency integrity.
- No candidate promotion, Active Tenant Access, Home, or phase-transition changes.

## Client Applicability

- All clients: yes, for `target_state_architecture` generation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: Target Architecture structured assembly is now required by its artifact contract; the existing opt-in flag still controls other architecture-rendered artifacts.

## Changes Included

- Always generate a structured architecture model for Target Architecture.
- Require an explicit human P3 option selection; a highlighted recommendation is not approval.
- Persist the selected option, rationale, alternatives, accepted tradeoffs, approver, and approval timestamp through the existing signed-off `solution_approach_options` lifecycle.
- Pin `signed_off_version` and persist a server-computed decision id, version, hash, selected-option id/version, rejected-option reasons, scope, exclusions, assumptions, constraints, and unresolved decisions.
- Block the P3 batch API before context extraction or enqueue when no approved option exists.
- Enqueue Target Architecture → Solution Design → Operating Model → Sourcing Strategy as one atomic, idempotent dependency chain.
- Bind the approved approach, decision hash, context snapshot hash, and architecture-model version into every durable run and persisted artifact.
- Revalidate decision and context hashes in the worker before any model call; stale batches stop with an explicit blocker.
- Require each downstream artifact to consume its successfully persisted predecessor.
- Remove the legacy draft-architecture exception; solution options may be drafted before approval, architecture may not.
- Generate and validate the Structured Architecture Brief and ArchitectureModel before drafting the Target Architecture narrative; persist both as immutable assembly inputs on the generated artifact.
- Refuse client approval or direct sign-off when an architecture artifact's option hash, option version, context snapshot, or architecture-model version is stale.
- Supersede prior authoritative P3b deliverables whenever a new solution option is approved, while retaining historical versions for audit.
- Preserve the existing governed Claude tool call, validation, profile renderer, and quality contract, but fail closed when required architecture assembly fails.
- Keep the industry-neutral deterministic fallback only for non-Target-Architecture compatibility paths; it is not eligible to satisfy the governed Target Architecture contract.
- Mark client-specific systems, hosting, identity, network, and protocols as open inputs rather than inventing them.
- Add regression tests for option approval parsing, signed-off version pinning, P3 API enforcement, atomic ordering, dependency-aware claiming/cascade, worker decision-hash enforcement, durable prompt binding, explicit UI approval, and fail-closed architecture assembly.

## QA / Validation

- Focused Jest: 153 passing across 14 suites, plus 16 context-extract regression tests.
- ESLint, TypeScript, diff check, Moves context-extract audit, active/candidate separation for First Capital and SkyHarbor, Moves tenant isolation, architecture rules, enterprise naming, and release control pass locally.
- GitHub checks, ACA deployment, runtime-invariant verification, and signed-in disposable First Capital Target Architecture generation proof remain required before release status changes.

## Rollout Plan

Squash merge through a PR to `main`; deploy only through the repo-owned ACA main workflow. Verify the exact merge SHA and digest across the healthy 100%-traffic web revision and both worker jobs, then rerun Target Architecture on the disposable First Capital proof Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned workflow only.
- Approved image digest: pending deployment.
- ACA runtime invariant: pending deployment.
- Worker image invariant: pending deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash merge through a PR and deploy the resulting `main` SHA through the repo-owned workflow. The additive nullable queue columns may remain safely in place; no destructive data rollback is required.

## Audit Evidence

- PR URL: pending.
- GitHub checks: pending.
- ACA revision/digest/traffic proof: pending.
- Signed-in proof bundle: pending.

## Known Gaps

- Structured generation can still fail a legitimate architecture-quality check; that is an explicit blocker, not a client-facing fallback.
- Sourcing Strategy's separately observed `non_mechanical_writing` failure is outside this slice.
- Live proof will use the disposable First Capital proof Move only. It may record a P3 option approval and rerun generation, but must not approve the P3 gate or advance the Move.
