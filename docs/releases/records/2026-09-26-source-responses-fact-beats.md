# Source Responses Stage Fact-Derived Beats

## Release ID

`2026-09-26-source-responses-fact-beats`

## Status

`candidate`

## Plain-English Summary

The Responses-stage task and gate now use the event's observed vendor-by-lever response coverage and the resolved archetype's value levers. Missing response cells stay missing; the view no longer presents a sample person's name or a sample response-summary deliverable as event authority.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no schema or data change; reads the existing tenant-scoped response signal.
- Layer 4 Source: derives the Responses-stage task and gate view from that signal and archetype. Existing approval policy remains authoritative.

## Client Applicability

- All clients using the Source event analytics canvas.
- No client-specific data, migration, feature-flag or external delivery change.

## Changes Included

- Pass the existing tenant-scoped vendor response read into the live stage builder.
- Derive the coverage task, observed-cell counts, approver role and declared deliverables without asserting that every invited supplier responded.
- Preserve the response coverage upload template and governed approval route.
- Refresh the per-stage provenance measurement for the third derived stage.

## QA / Validation

- Pass: red-first Responses tests failed on scaffold content and unchanged coverage, then passed on the implementation.
- Pass: deliberate removal of the page's response-signal handoff failed the AST wiring test; a misspelled Responses key failed three behavioral tests; both were restored.
- Pass: six affected builder suites, 148 tests; full Source canvas component suite, 267 tests; scoped ESLint; TypeScript no-emit with an 8 GB Node heap.
- CI: pending PR creation.
- Signed-in product proof: pending post-deploy replay of the affected Responses view; no gate advancement is planned.

## Rollout Plan

Merge through a PR after applicable CI and review. Only the repo-owned ACA main workflow may deploy the merge. Verify the immutable digest on web template, 100%-traffic revision and required worker jobs, then inspect the Responses view signed in.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: verify after deploy.
- ACA runtime invariant: verify template, traffic revision and workers after deploy.
- Live signed-in proof required: yes, for the Responses view.

## Rollback Plan

Revert through a PR. No data or schema rollback is involved.

## Audit Evidence

Focused behavioral tests, provenance JSON, mutation results, local checks, PR/CI and post-deploy runtime and signed-in records.

## Known Gaps

Observed vendor IDs come from response facts, not a complete invited-supplier roster. The task and gate therefore disclose missing cells and require independent review; they do not certify response completeness. This change does not advance the frozen synthetic event past its genuine Scope approval gate.
