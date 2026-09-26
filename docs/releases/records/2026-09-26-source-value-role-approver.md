# 2026-09-26-source-value-role-approver - Terminal decision role

## Release ID

`2026-09-26-source-value-role-approver`

## Status

`candidate`

## Plain-English Summary

The live Source Value-stage view no longer names a worked-example person as its approver. It labels the Source V1 Event Owner role instead, including in the model grounding block. This changes presentation and grounding, not who may approve or whether an approval occurred.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 3 canonical model: No data, approval, supplier, contract, or financial fact changes.
- Layer 4 Source: One live terminal-stage view field and its grounding disclosure change. The exemplar remains available as explicitly labeled sample content.

## Client Applicability

- All clients using the live Source Value-stage analytics view.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing live analytics selection; no new flag.

## Changes Included

- Replace the terminal live gate's sample person name with `Event Owner`, the Source V1 decision role.
- State accurately that remaining scaffold confirm and generated-artifact labels are examples, while an approver role is not proof of a named person's decision.
- Refresh the provenance measurement and destination-level tests.

## QA / Validation

- Pass: Red-first view, canvas-input, and model-grounding tests failed on the prior fixture name.
- Pass: Reinstating the fixture name failed destination tests naming the terminal stage; mutation restored.
- Pass: 104 adjacent Source suites, 1,080 tests; TypeScript no-emit and scoped ESLint.
- Not run: Signed-in terminal-stage readback; no eligible event has reached this stage in the frozen journey.
- Blocked: The frozen event still requires its separate governed Scope evidence and decision.

## Rollout Plan

Squash merge after applicable CI and review. Let only the repo-owned ACA main workflow deploy. Verify exact merge SHA, web template, serving 100%-traffic revision and required worker digests. Replay signed in on an eligible Value event when available, without manufacturing a completion decision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on `main`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: To be recorded after the workflow.
- ACA runtime invariant: Web template and 100%-traffic revision must match the approved digest.
- Worker image invariant: Both required delivery workers must match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Value-stage view.

## Rollback Plan

Revert through a PR and let the main workflow deploy the revert. No data rollback is needed.

## Audit Evidence

Focused and wider test output, provenance artifact, PR/CI, official deploy run, runtime readback and private signed-in smoke ledger.

## Known Gaps

The rest of the terminal gate still carries labeled scaffold content. Its final-completion wording needs an explicit product decision; this slice does not invent an onward stage or grant approval.
