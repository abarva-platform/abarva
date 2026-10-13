# Home Advisor Single Bounded Output Correction

## Release ID

`2026-10-13-home-advisor-single-correction`

## Status

`candidate`

## Plain-English Summary

An incomplete structured advisor response can use the existing one-time correction before returning a no-answer result. The same correction also enforces concise, cited and appropriately qualified answers. These are not separate retry chains.

## Layer Impact

Release lane: `global-control-lane`.

- Layers 1-3: no intake, schema, canonical data, retrieval, graph, corpus, approvals or serving changes.
- Layer 4: existing Home answer correction routing only. The model, prompt text, token budget and original shared deadline are unchanged.

## Client Applicability

- All clients: existing authorized Home advisor consumers.
- Specific clients: no identity inference or tenant exceptions.
- Internal only: no operator capability added.
- Public/demo only: no new public access or attestation.
- Feature flag: none.

## Changes Included

- Unparseable output reaches the existing audited correction, subject to its remaining-time checks.
- At most one correction across malformed output, compactness and reference qualification.
- Corrected answers still require admitted citations, valid qualification and concise points. Rejected partial text is not published.
- No new model, prompt, context source, shared Dock change or expanded output budget.

## QA / Validation

- PASS: 186 tests in seven focused answer, API, conversation, mounted chat, shared-dock, list-marker and tenant-name suites.
- PASS: scoped ESLint with Node 24.
- PASS: TypeScript with Node 24 and all eleven `release:check` gates.
- Tests include successful correction, repeated malformed output, unsafe or uncited correction, overlong correction, no third attempt and exhausted time budget.
- NOT RUN for this candidate: signed-in production acceptance after deployment. Earlier failures remain in private QA evidence.

## Rollout Plan

Exact-source review, new current-head CI, current-main and all-open-PR guard, protected squash merge and repo-owned ACA main deployment. No data refresh or serving activation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: that workflow only.
- Approved image digest: capture from the exact main deployment artifact.
- ACA runtime invariant: template and sole healthy 100% traffic revision match the approved pinned digest.
- Worker image invariant: both required workers match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: fresh original analytics answer, clicked CFO follow-up, citations, interview-basis challenge and mobile/scroll behavior.

## Rollback Plan

Protected revert and the same ACA main workflow. No data rollback required.

## Audit Evidence

Exact source decision, local tests and validation, full current-head workflows and reviewed conditional skips, fresh fetched-ref guard, official deploy artifact, independent full runtime invariant and private signed-in captures.

## Known Gaps

When the one correction also fails or the original deadline is exhausted, an honest no-answer result remains. This does not establish universal semantic entailment, enterprise accuracy, data freshness, full Home export or graph activation.
