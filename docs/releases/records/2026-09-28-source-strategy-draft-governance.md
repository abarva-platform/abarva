# 2026-09-28 Source Strategy draft governance context

## Release ID

`2026-09-28-source-strategy-draft-governance`

## Status

`candidate`

## Plain-English Summary

Strategy draft generation now receives the event's current approval policy, evidence applicability, and gate-criterion states. A value companion no longer treats an unreviewed upstream draft as approved context. Deterministic review flags draft claims that contradict those states or assert unsupported vendor-pricing behavior.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source artifact generation and quality review.
- Layer 3 Canonical Model: read-only use of existing event, evidence, and gate state. No schema or canonical fact write.

## Client Applicability

- All clients: Source events generating the Strategy Memo or Value Target Brief.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Bind the recorded event approval policy, audited requirement applicability, and current Strategy criteria to the two Strategy prompts.
- Mark an audited not-applicable requirement as such instead of converting its empty evidence state to `Not Requested`.
- Exclude an unreviewed Strategy Memo body from the Value Target Brief's authoring and quality-review inputs.
- Flag contradictions in generated text during both initial and rewrite quality reviews. Failed review remains a reviewable draft, not a client-final artifact or an approval.

## QA / Validation

- Pass: red-first tests reproduced missing governance context, draft-to-approved labeling, and undetected applicability/policy/gate contradictions.
- Pass: negative tests preserve accurate absence language and the historical strict-policy sponsor path.
- Pass: two deliberate mutations removed the governance prompt block and disabled the contradiction scan; each failed its targeted test, then was restored.
- Pass: 13 agent-generation suites / 138 tests, TypeScript with an 8 GB Node 24 heap, and scoped ESLint.
- Not run: post-deployment signed-in draft regeneration and content review; required before claiming product acceptance.

## Rollout Plan

Squash merge after applicable CI and review. Deploy only via the repo-owned ACA main workflow. Verify digest-pinned web and workers, then regenerate the two synthetic Strategy drafts signed in and inspect their full content before any client-final acceptance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: Verify both required workers match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a reviewed PR and the same main deploy workflow. No migration or data rollback is required. Existing generated drafts remain drafts and are not retroactively altered.

## Audit Evidence

PR, applicable CI, main deploy run, runtime readback, and signed-in review are tracked in the private execution ledger.

## Known Gaps

The deterministic scan is a backstop for named contradictions, not a complete factual verifier. Human content review and a separately accepted client-final artifact remain required. No stage gate is opened by generation alone.
