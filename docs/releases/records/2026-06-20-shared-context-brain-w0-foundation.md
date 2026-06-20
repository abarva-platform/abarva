# 2026-06-20-shared-context-brain-w0-foundation — Shared Context Brain W0 foundation + reference experts

## Release ID

`2026-06-20-shared-context-brain-w0-foundation`

## Status

`candidate`

## Plain-English Summary

Foundation for the "Shared Context Brain" — the planned single answer engine ("Ava") backed by a faculty of virtual industry experts ("Consilium"). This release adds **contracts and authoring infrastructure only — no runtime is wired and no surface behavior changes.** Specifically: the universal `AgentAnswer` output contract, the `ExpertPack v2` schema (with a `successModel` layer capturing probability-of-success / adoption / ROI-clarity), a deterministic content/honesty quality gate (`gateExpertPack`), five hand/parallel-authored reference expert packs (Healthcare Revenue Cycle, Back-Office Shared Services, Future of Work, Contact Center→CX, Clinical Process Transformation), the program's planning docs, and a technical training document. Nothing here is called by any product surface yet.

## Layer Impact

- **global-control-lane (additive, dormant):** new shared library contracts and a pure validation function under `src/lib/intelligence/{answer,expert-pack}`. These are new modules with no call sites in any runtime route, so there is no behavior change for any client until a later wiring release (W1).
- No `client-data-lane`, schema, migration, RLS, or ingestion changes.

## Client Applicability

State exactly who receives the change.

- All clients: No runtime change — contracts/packs/docs only; nothing wired.
- Specific clients: None.
- Internal only: Yes — build-time contracts, a validation function, reference content, and planning/training docs used by the build team.
- Public/demo only: None.
- Feature flag: None yet (the per-surface `scb_shared_engine_*` flags are queued for a later release, default-off when added).

## Changes Included

- `src/lib/intelligence/answer/agent-answer.ts` — `AgentAnswer` contract (prose/tables/charts/graphs/citations/gaps/actions + `contributingExperts`).
- `src/lib/intelligence/expert-pack/expert-pack.ts` — `ExpertPack v2` + `EXPERT_PACK_DEPTH_MINIMUMS` + `ExpertSuccessModel`.
- `src/lib/intelligence/expert-pack/quality-gate.ts` — `gateExpertPack()` content/honesty gate (defensive against malformed input).
- `src/lib/intelligence/expert-pack/packs/*.ts` — 5 reference ExpertPacks.
- `docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md`, `SHARED_CONTEXT_BRAIN_BUILD_PLAN.md`, `SCB_EXECUTION_TRACKER.md`; `docs/architecture/ADR001_CONTEXT_SUBSTRATE_POSTGRES_PGVECTOR.md`; `docs/codex-handoff/*`; `docs/build/INTELLIGENCE_DATA_FLOW_TRAINING.html`.

## QA / Validation

- `tsc --noEmit` clean across contracts, gate, and all 5 packs.
- `gateExpertPack` self-test: exemplar PASS (0 blockers); deliberately broken pack → 11 blockers; malformed inputs (missing arrays, missing `domain`, empty `{}`, `null`, `undefined`) all return a clean fail without throwing.
- All 5 reference packs independently gated: PASS, 0 blockers, 5 unique ids, both `ExpertKind` variants.
- code-review pass on the gate; findings (defensiveness, band-vocab, chart-kind drift) fixed and re-verified.

## Rollout Plan

Merge to `main`. **No runtime rollout** — no image build, no ACA deploy, no migration, no flag flip is required or triggered, because none of these modules are imported by a runtime route. Runtime activation happens in a later release (W1 engine wiring) behind default-off per-surface flags.

## Deployment Authority

Not applicable — this release cannot affect Azure Container Apps, deploy workflows, runtime images, flags, env vars, worker jobs, traffic, or DNS. It is additive build-time code + docs with no call sites.

- Repo-owned deploy workflow: n/a (no deploy)
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a (no flags in this release)
- Live signed-in proof required: No — no runtime surface changes.

## Rollback Plan

Revert the PR. Safe with no constraints — the modules have no runtime call sites, so removal cannot affect any live behavior. No migration to roll back.

## Known Gaps

- No runtime wiring yet — the engine (W1), retrievability/pgvector (W2, Codex), renderers (W4), and evals (W5) are not in this release. `AgentAnswer`/`ExpertPack` are contracts with no live call sites.
- The faculty is 5 reference packs, not the ~210 target. The bulk authoring run (W3.2) is pending an explicit go.
- Reference packs are AI/parallel-authored and pass the deterministic gate, but have had no human SME review (per the AI-gate-only decision) and no live retrieval/answer proof.
- Per-surface exposure flags + parity gate (W6.1) are queued, not built — so there is no client-facing exposure path in this release.

## Audit Evidence

- PR URL: (to be filled on PR creation) `claude/scb-w0.3-quality-gate` → `main`.
- Commits: `0af6550c9` (gate), `e67b50bd7` (successModel), `4e10ca374` (review hardening), `63b53fa08` (4 reference packs), plus foundation `81e036504`.
- CI: `npm run release:check`, `tsc` clean, gate self-test output captured in the PR description.
