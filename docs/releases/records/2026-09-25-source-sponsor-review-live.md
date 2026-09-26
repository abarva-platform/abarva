# Source sponsor review on the mounted Scope step

## Release ID

`2026-09-25-source-sponsor-review-live`

## Status

`candidate`

## Plain-English Summary

The explicit sponsor-review request now appears in the mounted Source event Scope step. The earlier request control was present in a checklist component that the active event page did not render. The request remains a notification only; it does not sign a commitment or open the Scope gate.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: no schema or data change.
- Layer 4: the active event canvas reuses the existing sponsor-review request control only for the incomplete Scope sponsor step.

## Client Applicability

- All clients using the mounted Source event canvas, subject to the existing named-sponsor and recipient-allowlist checks.
- No client-specific recipient or delegated-signature authority is added.

## Changes Included

- Export the existing sponsor-review control from the checklist module.
- Mount it on the active Scope sponsor step without exposing it on other steps.
- Test the mounted canvas, request payload, fallback status, and unchanged disabled gate.

## QA / Validation

- Pass: mounted-canvas behavior failed before implementation because the request button was absent; 20 focused cases passed afterward.
- Pass: removing the sponsor-step identity check made the non-sponsor case fail; restoring it returned the suite to green.
- Pass: targeted ESLint, TypeScript and release check after final implementation.
- Not run: live email transmission, recipient assignment or signing. Those are separate governance actions.

## Rollout Plan

Squash merge after applicable CI and review. Only the repo-owned ACA main deploy workflow may move shared traffic. Verify the digest-pinned web template, sole 100%-traffic revision and required worker jobs, then read the frozen Scope step signed in. Do not click the request button during read-only acceptance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators outside that workflow: none.
- Approved digest and runtime invariant: verify after merge.
- Live signed-in proof: request action visible on the Scope sponsor step, with the Scope gate still governed.

## Rollback Plan

Revert this mount through a PR. The server-side sponsor-recipient policy remains unchanged.

## Audit Evidence

Focused red/green output, mutation result, CI, merge, official deploy run, independent Azure reads and signed-in replay are recorded separately in the private execution ledger.

## Known Gaps

- A real signed sponsor commitment, client-specific recipient assignment and independent delegated-signer proof are not supplied by this change.
- Milestone-triggered email automation is not included.
