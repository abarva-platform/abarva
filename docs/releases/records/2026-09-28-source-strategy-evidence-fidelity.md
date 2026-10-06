# 2026-09-28 Source Strategy evidence-role fidelity

## Release ID

`2026-09-28-source-strategy-evidence-fidelity`

## Status

`candidate`

## Plain-English Summary

Strategy draft authoring and quality review now distinguish required gate evidence from recommended evidence and requirements excluded by the event approval policy. A missing optional item is no longer presented to the model as a gate prerequisite. The deterministic review identifies drafts that use blocking language for that item.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source Strategy artifact generation and review.
- Layer 3 Canonical Model: read-only use of the existing evidence catalog and event approval policy. No schema, canonical fact, approval, or event-state write.

## Client Applicability

- All clients: Source events generating a Strategy Memo or Value Target Brief.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Bind canonical evidence level, policy applicability, and effective gate-blocking role into both authoring and quality-review context.
- Explicitly prohibit request-or-waive gate conditions for recommended or policy-excluded Strategy evidence.
- Detect contradictory blocking statements even when an optional item is described as optional elsewhere in the same line.
- Treat a requirement-status label as a status, not an unsupported market assertion.

## QA / Validation

- Pass: red-first tests reproduced missing evidence-role context and the undetected recommended-evidence gate claim.
- Pass: negative tests preserve accurate optional-status wording and the historical strict-policy sponsor requirement.
- Pass: two deliberate mutations made recommended evidence gate-blocking and disabled its contradiction check; each failed its targeted test and was restored.
- Pass: 13 agent-generation suites / 141 tests, TypeScript on Node 24 with an 8 GB heap, scoped ESLint, release gate, and diff check.
- Not run: PR CI, runtime readback, and signed-in regeneration of this candidate; required before release claims.

## Rollout Plan

Squash merge after applicable CI and review. Deploy only through the repo-owned ACA main workflow. Independently verify digest-pinned web and worker runtimes, then regenerate and review the synthetic Strategy drafts signed in before any final acceptance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: Verify both required workers match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a reviewed PR and the same main deploy workflow. No migration or data rollback is required. Existing drafts remain drafts and are not retroactively changed.

## Audit Evidence

PR, applicable CI, official deploy, runtime readback, and signed-in content review are tracked in the private execution ledger.

## Known Gaps

This is a targeted evidence-role guard, not complete verification of every generated claim. Drafts with other unsupported numbers, dates, or legal assertions remain review-only and must not be accepted as client-final. No stage gate opens through generation alone.
