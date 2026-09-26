# Source contract context authority

## Release ID

`2026-09-26-source-contract-context-authority`

## Status

`candidate`

## Plain-English Summary

The Source contract chat path no longer labels figures or summaries supplied by a browser request as authoritative. It uses the selected contract ID only as a lookup hint, checks tenant access, and rebuilds the selected-contract prompt block from the matching server-side record. A missing or mismatched selected contract receives an explicit refusal before model generation. The existing direct page-context reader remains available to the formatter, but the chat route cannot feed it unverified request facts.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: read-only contract lookup; no schema or row change.
- Layer 4 Source: contract-answer prompt assembly and its destination inventory. No contract value is calculated by the model.

## Client Applicability

- All clients: yes, for Source contract chat requests.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added.

## Changes Included

- Reuse the tenant-checked server contract resolver at the Source agent route.
- Refuse an unverified selected contract before the portfolio fallback or model call.
- Remove the formatter's unconditional claim that page-local request context is authoritative.
- Update the existing contract packet destination inventory and CI-wired behavior suite.
- Refresh the C-406 route-reachability measurement: both routes now reach the contract resolver, but only the agent route reaches the event-chat classifier. The classifier fallback count retains its original scope.

## QA / Validation

- Pass: the red-first suite failed the missing agent resolver and old route wiring while the already-safe ask-path control passed.
- Pass: a conflicting-value request cannot replace the selected contract's server-read value or add request-supplied dataset/cube summaries; absent and opposite-tenant records fail closed.
- Pass: two deliberate mutations were caught: replacing the rebuilt packet with request context, and rewiring the agent route away from the authorized resolver.
- Pass: five focused Source packet/answer suites (93 tests); refreshed C-406 reachability suite (21 tests); TypeScript, scoped ESLint, release validation, test-coverage shape check and tenancy-fence check.
- Not run: a second full behavior sweep after refreshing C-406. The first sweep had 140 passing suites and one C-406 suite failing three assertions that intentionally described the former import graph; the refreshed suite passed separately. CI must prove the combined final tree.
- Not run: a live model-answer or signed-in browser replay at candidate creation.

## Rollout Plan

Squash merge after applicable CI/review. Only the repository-owned ACA main workflow may build and deploy the image. No migration, data build, environment flag or traffic mutation outside that workflow is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: pending main workflow.
- ACA runtime invariant: pending main workflow and independent readback.
- Worker image invariant: pending main workflow and independent readback.
- Feature/env flag update path: none.
- Live signed-in proof required: yes for the affected Source contract answer surface; report separately from runtime and code proof.

## Rollback Plan

Revert this commit through a new PR and the same main workflow. Do not restore request-supplied values to an authoritative prompt without a separately proven trust boundary.

## Audit Evidence

- Focused tests and two negative mutations are documented in the PR.
- `docs/architecture/c523-whole-contract-context-packet.json` records both destination paths and their provenance.
- PR, CI, deployment and signed-in readback: pending at candidate creation.

## Known Gaps

- This guards the selected-contract prompt block, not every other chat prompt fragment or the missing agreement-set/evidence objects measured under C-523.
- Live signed-in contract-answer behavior and canonical data readback are not yet proven.
