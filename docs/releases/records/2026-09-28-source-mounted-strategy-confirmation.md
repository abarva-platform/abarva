# 2026-09-28 Mounted Source Strategy confirmation

## Release ID

`2026-09-28-source-mounted-strategy-confirmation`

## Status

`candidate`

## Plain-English Summary

The mounted Strategy step could mark a confirmation complete only in browser state, even though a governed confirmation endpoint existed. This release connects the mounted step to the current event version and server receipt. A missing version or rejected write cannot complete the step. Event Owner policy copy no longer describes that step as a sponsor signature; historical signed-scope wording remains unchanged.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source Strategy shell adapter, mounted action, and policy-aware guidance.
- Layer 3 Canonical Model: No schema or commercial fact change. The existing append-only Source activity receipt remains the confirmation authority.

## Client Applicability

- All clients: Forward `self_v1` Source events at the Strategy step.
- Historical `legacy_signed_scope_v1` events: Existing external-signer policy remains in force; no local-only completion is offered for this step.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Forward the server-issued confirmation version from the stage task into the mounted shell step.
- POST the mounted Strategy action to the existing tenant-scoped confirmation endpoint, wait for server readback, and show errors without optimistic completion.
- Make the parent local-completion callback inert for `strategy.confirm`.
- For self-policy events, derive task completion only from the current persisted owner receipt, not a generic task `done` or evidence flag.
- Show Event Owner requirement language for `self_v1`; retain sponsor wording for the historical signed-scope policy.

## QA / Validation

- Pass: red-first mounted behavior tests reproduced the local-only completion and missing-version fallback.
- Pass: a deliberate removal of the shell version bridge failed three behavior assertions and was restored.
- Pass: a misleading generic `done` task was red before the receipt-only shell guard and is now kept open.
- Pass: 103 tests across the mounted Strategy, adjacent canvas, journey, guidebook, header, shell-adapter and page-builder suites.
- Pass: Node 24 TypeScript and scoped ESLint with zero warnings.
- Not run: signed-in post-deployment replay; it is required after the exact main deployment.

## Rollout Plan

Squash merge after applicable CI and review. Use only the repo-owned ACA main deployment workflow. Verify digest-pinned web and worker runtime, then click the synthetic Strategy step and fully reload to prove the receipt persists.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: Verify both required workers match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert via a reviewed PR and the same main deploy workflow. Existing activity receipts remain audit history; no data rollback or migration is required.

## Audit Evidence

PR, CI, main deploy run, runtime readback and signed-in replay are recorded in the private smoke ledger.

## Known Gaps

This does not accept Strategy artifacts, approve the stage, create sponsor signatures, contact suppliers, make an award or execute a contract. Those remain separate governed actions.
