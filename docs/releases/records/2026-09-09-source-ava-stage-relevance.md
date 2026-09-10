# 2026-09-09-source-ava-stage-relevance — Scope aVa panels to the question

## Release ID

`2026-09-09-source-ava-stage-relevance`

## Status

`candidate`

## Plain-English Summary

Source aVa answers now show delivery-model, should-cost, and proposal-normalization panels only when the user asks about those topics. Stage-readiness questions use the event's recorded blockers and missing inputs instead of mixing in generic pre-RFP assumptions, so a late-stage answer cannot contradict the visible event with an unrelated cost model or an empty-proposal message.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Products: narrows Source answer presentation and stage-readiness wording to the user's question and governed event context.
- Layers 1-3: No intake, adapter, schema, canonical-record, or data mutation change.

## Client Applicability

- All clients: Yes, for Source event aVa answers.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Recognize named Source-stage readiness questions, including Transition and Selection.
- Keep award-readiness, holdback, and blocker questions out of the accepted-selection-memo intent.
- Route vendor price-comparison questions to the normalized response packages before the event value ledger.
- Refuse price ranking and savings calculations until every vendor has accepted numeric commercial facts on a comparable basis.
- Route BAFO ask questions to a governed instruction pack derived from the same normalized response challenges as the BAFO page.
- Route award-readiness questions to the normalized response challenges, BAFO holdbacks, and provisional evaluation view so aVa names each real vendor's controlling condition without treating response coverage as award readiness.
- Distinguish the stage named in a readiness question from the event's current lifecycle stage.
- Clarify that proposal commitments alone do not prove Transition readiness and that the accepted transition packet plus approval record are controlling.
- Suppress delivery-model panels unless the question asks about the delivery model.
- Suppress should-cost panels unless the question asks about should-cost or TCO.
- Suppress proposal-normalization panels unless the question asks for proposal, bid, or price normalization/comparison.
- Use event blockers and missing inputs as the late-stage readiness gap set.

## QA / Validation

- PASS — 83 focused Source answer-engine, governed-intent, stage-lens, and API route-order tests.
- PASS — regression proving a Transition-readiness answer contains no TCO iceberg, empty-proposal message, delivery-model gate, or generic retained-organization gap.
- PASS — scoped ESLint.
- PASS — TypeScript no-emit compile with `NODE_OPTIONS=--max-old-space-size=8192`.
- NOT RUN — live signed-in stage-specific aVa proof; required after deployment.

## Rollout Plan

Merge through a protected pull request and deploy the merge SHA through `.github/workflows/aca-main-deploy.yml`. Verify the digest-pinned runtime invariant, then repeat the signed-in late-stage aVa probes and confirm each answer stays within the requested event stage.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: The repo-owned main deploy workflow only.
- Approved image digest: Recorded by the deploy workflow for the merge SHA.
- ACA runtime invariant: Web template and 100% traffic revision must match the approved digest.
- Worker image invariant: Required worker jobs must match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash merge through a new pull request and redeploy through the main workflow. No data rollback is required.

## Audit Evidence

- Pull request and merge SHA.
- Focused Jest, ESLint, TypeScript, and release-check output.
- ACA deployment evidence for the merge SHA.
- Signed-in Source aVa browser proof across late commercial stages.

## Known Gaps

Proposal normalization remains intentionally empty until the Source agent context carries accepted structured proposal rows. An explicit normalization question will continue to report that evidence limitation rather than invent a comparison.
