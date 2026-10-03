# Moves Evidence Lineage and Adaptive P3

## Release ID

`2026-09-27-moves-evidence-lineage-and-adaptive-p3`

## Status

`candidate`

## Plain-English Summary

Uploaded Move evidence is presented for human correction before it can inform generation. The reviewed extraction, source quotes, and locators are persisted separately from the original file; generation prefers the reviewed snapshot and does not reintroduce corrected parser text as fact. Human-approved artifact versions remain the authority for later-phase context.

P1 captures the initial business-change and adoption assessment. P2 asks the reviewer to confirm or correct the solution-route recommendation against approved evidence. A validated technical-product route produces an estimation-sized P3 package and has route-specific approval criteria; it does not require a full process or operating-model design.

The phase progression action stays in the sticky step header. Current-phase required evidence gaps show a neutral review status and suppress the build/approval action; a green action appears only when saved inputs and required evidence are ready. Visiting a workflow step no longer marks it complete.

## Layer Impact

- Release lane: `global-control-lane`.
- `Products`: Moves captures route decisions, presents an evidence review queue, and selects route-specific P3 outputs.
- `Canonical information flow`: evidence-review and artifact-version lineage are read through tenant- and Move-scoped paths. No database schema migration is included.
- `Governance`: P2→P3 requires a completed P1/P2 route assessment backed by approved P2 evidence. P3 rechecks that lineage before advancement.
- `Generation`: approved evidence snapshots and exact signed-off artifact versions are eligible context; drafts and unapproved uploads are excluded.

## Client Applicability

- All clients: applies after the candidate is merged and deployed.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. P2→P3 advancement will require the new route assessment after rollout.

## Changes Included

- Persist and validate reviewed evidence extraction snapshots, including corrected structured facts and source citations.
- Show pending evidence in Files & Evidence with source preview and explicit human approve/reject action.
- Keep raw parser text out of prompt context when a reviewed snapshot exists.
- Carry completed, gate-passed prior-phase captures and exact signed-off generated artifact versions into later phase context.
- Require evidence-backed P1/P2 route validation, use the confirmed route to select P3 generation outputs, and enforce technical-route P3 approvals.
- Put the phase progression action in the sticky step header, hide it while current-phase required evidence remains open, and reserve completed workflow status for an approved gate.
- Add regressions for review payloads, context selection, version pointers, gate behavior, and route-specific generation.

## QA / Validation

- Pass: 250 tests across 19 focused evidence, artifact, Moves UI, capture, gate, and progression-readiness suites.
- Pass: TypeScript typecheck.
- Pass: ESLint on changed application and test files.
- Not run: full repository test suite.
- Not run: signed-in browser proof, deployed revision proof, tenant-opposite smoke, or generated-artifact review in a live workspace.

## Rollout Plan

Merge through a reviewed PR, then deploy only with the repo-owned ACA main deploy workflow. Because P2→P3 gains a required route assessment, validate an existing Move's capture state and approved evidence before declaring its gate ready. No data-plane backfill or direct database edits are part of this candidate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none used for this candidate.
- Approved image digest: not applicable; not deployed.
- ACA runtime invariant: not checked; not deployed.
- Worker image invariant: not checked; not deployed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; verify evidence correction, P1/P2 route validation, P3 output selection and approvals, then exact-version handoff in a signed-in workspace.

## Rollback Plan

Revert the application change through a follow-up PR and deploy it through the same ACA workflow. If the new route requirement blocks an in-flight Move, keep it blocked rather than editing persisted state; restore the prior code only after confirming the gate and downstream context behavior.

## Audit Evidence

- Candidate source and focused test results on branch `codex/moves-adaptive-evidence-routing`.
- Review the persisted `program_evidence_reviews` snapshot and source citation locators.
- Review the signed-off `deliverable_versions` pointer and corresponding artifact linkage.
- Signed-in and ACA evidence: not available; candidate is not merged or deployed.

## Known Gaps

- The sticky readiness action blocks current-phase required evidence at the final phase action; all intermediate P0–P5 substeps do not yet share a universal evidence-readiness resolver.
- Human review, sign-off, and the exact-version handoff still need a signed-in end-to-end proof after deployment.
- No estimate calculator or rate-card data model is introduced here; the technical route narrows P3 scope but does not itself compute the P4 estimate.
