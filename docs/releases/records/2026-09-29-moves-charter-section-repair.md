# 2026-09-29-moves-charter-section-repair — Repair undersized charter sections before the unchanged gate

## Release ID

`2026-09-29-moves-charter-section-repair`

## Status

`candidate`

## Plain-English Summary

Moves charter generation previously asked each section to meet a prose target but had no generation
step that acted when the assembled charter remained short. A fallback could append generic text only
when a canonical section was absent, so it did not help the normal fixed seven-section charter.

When the assembled charter is below the 700-word prose floor, the generation pipeline measures each
canonical section against its contract target and requests a targeted, evidence-grounded revision
only for sections below target. It preserves existing citations, does not add deterministic filler,
and does not relax the document-level gate. If the revised document still misses that gate, it
remains blocked.

## Layer Impact

Release lane: `global-control-lane` — shared Moves document-generation behavior for all workspaces
that generate a P1 Charter. No canonical data, tenant identity, or authorization rule changes.

- **Product generation path.** The Moves charter prompt/orchestrator now includes a distinct repair
  pass for canonical sections below their shared contract prose target. The repair uses only the
  evidence assigned to that section and the document remains subject to the existing quality gate.
- **Progress and policy.** The bounded repair pass has its own trace/progress label and uses the
  existing charter token ceiling. It is not feature-gated.
- **Canonical data model.** Unchanged. No schema, adapter, evidence object, or database write path is
  modified.

## Client Applicability

- All clients: yes, for Moves P1 Charter generation after deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/orchestrator/orchestrator.ts` — detects under-target canonical charter
  sections and invokes the bounded section repair pass before synthesis and final validation.
- `src/lib/deliverables/orchestrator/prompt-builder.ts` — supplies the current draft, measured word
  count, contract target, assigned evidence, and no-padding/phase-boundary instructions.
- `src/lib/deliverables/shared/artifact-contracts.ts` — sets per-section completeness targets with
  an 810-word combined target above the 700-word document floor and below each section cap.
- `src/lib/deliverables/orchestrator/section-generation.ts` — removes the generic append-only fallback
  so assembly cannot make a thin charter appear complete by adding boilerplate.
- `src/lib/deliverables/orchestrator/progress.ts` and `src/lib/ai/document-generation-policy.ts` —
  expose the repair pass in run traces/progress and apply the canonical charter token ceiling.
- Related orchestrator, progress, policy, and assembly regression tests.

## QA / Validation

- Focused generation/policy tests: **31 suites, 404 tests passed**.
- `npm run typecheck`: **Pass** on the final candidate (`typecheck: clean`).
- ESLint on changed TypeScript files: **Pass** on the final candidate.
- `git diff --check`: **Pass**.
- Regression test proves an under-target canonical seven-section charter requests repairs and can
  pass the 700-word gate after a successful repair.
- Negative regression test proves a still-short repaired charter remains blocked by that same gate.
- Mutation check inverted the below-floor trigger: the positive repair test failed with zero repair
  prompts, confirming the assertion exercises the runtime trigger.
- Assembly test proves a thin charter is not padded with boilerplate.
- Signed-in rebuild on the deployed synthetic smoke Move: **Not run**; required after deployment.
- Full P0–P5 synthetic journey: **Not complete**; this change only repairs the current P1 charter
  generation blocker and does not claim P5 completion.

## Rollout Plan

Merge through a standard PR squash merge. The repo-owned ACA main deploy workflow builds and deploys
the exact merge SHA. After deployment, verify the exact workflow run, digest-pinned web and worker
image invariant, and health checks. Then use the signed-in product UI to rebuild the existing
synthetic smoke charter and confirm the output either passes the unchanged quality gate or remains
blocked with a truthful reason. Do not approve the charter or advance the phase as part of this code
verification.

No migration, data build, direct database change, flag promotion, or manual ACA runtime mutation is
part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: pending the exact merge-SHA workflow run.
- ACA runtime invariant: pending post-deploy verification.
- Worker image invariant: pending post-deploy verification.
- Feature/env flag update path: none.
- Live signed-in proof required: **yes** — rebuild the synthetic smoke charter through the product UI
  and inspect its generated artifact and gate result; approval/phase advancement are not part of this
  proof.

## Rollback Plan

Revert the squash commit through a PR and redeploy that revert through the repo-owned ACA workflow.
No migration or data rollback is needed. The unchanged final quality gate remains the protection if
any repair output is still incomplete.

## Audit Evidence

- PR and its checks, including the charter repair pass/fail regression cases.
- Exact ACA main deploy workflow run for the merge SHA and its runtime-invariant proof bundle.
- Signed-in generated-artifact and quality-gate readback from the synthetic smoke run, stored in the
  private execution ledger.

## Known Gaps

- The live signed-in rebuild has not yet been repeated on this candidate; a passing unit suite is not
  live proof.
- Repair is bounded and may still fail to produce enough decision-useful, supported content. In that
  case the unchanged quality gate must block; additional evidence or human authoring is required.
- The full synthetic journey through P5 remains outstanding and is not implied by this release.
