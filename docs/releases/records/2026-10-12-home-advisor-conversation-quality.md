# Home Advisor Conversation Quality

## Release ID

`2026-10-12-home-advisor-conversation-quality`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Home advisor responses gain a clear bottom line, structured supporting points and a visible record basis. Three relevant follow-up questions stay available after an answer. Bounded conversation continuity uses earlier questions and references to claims resolved from the current record, never unverified prior assistant prose. Home anchors a completed answer near its question and provides a jump-to-latest control.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 product presentation and its existing Home answer API only.
- Layer 3 canonical objects, graph, metrics, source lineage and readiness remain unchanged.
- Earlier claim references are resolved against the current tenant/record bundle. The existing full record-token fence remains required.

## Client Applicability

- All clients: existing authorized Home advisor consumers.
- Specific clients: none; no tenant-specific exception.
- Internal only: no new administrative capability.
- Public/demo only: no new public access.
- Feature flag: Home opts into answer-start scrolling; other chat surfaces retain follow-end behavior.

## Changes Included

- Home answer API validates a bounded conversation and returns three follow-ups with the same record marker.
- Prompt distinguishes partial value validation, exposure and modelled testimony from stronger assertions.
- Qualitative readouts do not automatically include inventory exhibits; exhibit labels are reader-friendly.
- Home clears old context and cancels in-flight responses when its selected record changes.
- Existing aVa branding, evidence display, approval controls and audited reasoning path are preserved.

## QA / Validation

- Focused Home answer, API, conversation, record-parity, list-marker and shared-dock tests: 153 passing.
- Full TypeScript validation passed with Node 24 and a 12 GiB heap ceiling; the initial default-heap attempt exhausted its 4 GiB limit.
- Scoped ESLint passed. All eleven release controls passed.
- No data-plane load, model regeneration, sign-off, or operator job is part of this release.
- Signed-in answer, follow-up and scroll proof remains a post-deployment requirement, not a local-test claim.

## Rollout Plan

Open a PR from a clean main-based branch, validate, squash merge, then deploy exclusively through the repo-owned ACA main workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: workflow only; no local web or worker updates.
- Approved image digest: workflow output for the exact merged SHA.
- ACA runtime invariant: template, traffic-holder revision and required workers must use the approved pinned digest.
- Worker image invariant: verify through the existing runtime-invariant checker.
- Feature/env flag update path: no flag or environment mutation required.
- Live signed-in proof required: Home answer, three clickable follow-ups, same-record continuation, answer-start positioning and preserved reader scroll.

## Rollback Plan

Revert the code-only merge through a controlled PR and redeploy using the same ACA workflow. No schema or tenant-data rollback is needed.

## Audit Evidence

PR diff, focused test output, type/lint/release output, ACA run for the exact merged SHA, runtime-invariant proof and signed-in captures. Private proof must stay outside public release records.

## Known Gaps

This is not a data refresh or complete Home acceptance. Full walkthrough PDF visual parity and governed data/insight activation remain separate. Answers are validated before publication; raw model JSON is not streamed to the user.
