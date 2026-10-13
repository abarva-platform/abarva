# Home Advisor Reference Basis and Recovery Guard

## Release ID

`2026-10-13-home-advisor-recovery-basis`

## Status

`candidate`

## Plain-English Summary

Explicit questions about whether interview material is real or modelled are answered from an existing declared reference basis, not from unrelated enterprise claims. Reference recovery answers also pass the existing concise-answer and testimony-qualification gate before prose is shown.

## Layer Impact

Release lane: `global-control-lane`.

- Layers 1-3: no source input, canonical data, schema, ingestion, graph, corpus or approval changes.
- Layer 4: existing Home advisor reference-answer routing and recovery output only. No new prompt, model, context source, chat design or model call.

## Client Applicability

- All clients: existing authorized Home advisor consumers.
- Specific clients: deterministic reference-basis answers require an explicit synthetic declaration. Missing or false declarations do not imply either synthetic or real interviews.
- Internal only: no operator capability added.
- Public/demo only: no new public access or client attestation.
- Feature flag: none.

## Changes Included

- Cite the selected record declaration and preserve its canonical version when explaining reference material.
- Do not substitute general enterprise facts for an interview-authenticity question.
- Withhold unsafe or overlong reference recovery prose while preserving its inspectable citations.
- Tests cover model failure, missing citations, declared and undeclared basis, and qualified recovery.

## QA / Validation

- PASS: 178 tests across seven focused answer, API, conversation, mounted chat, shared-dock, list-marker and tenant-name suites.
- PASS: scoped ESLint with Node 24.
- PASS: TypeScript with Node 24 and all eleven `release:check` gates.
- NOT RUN for this candidate: signed-in production acceptance after deployment. Local tests do not establish live answer quality.

## Rollout Plan

Exact-source review, full current-head CI and current-main applicability check, protected squash merge, then the repo-owned ACA main workflow. No data refresh or serving activation is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: that workflow only.
- Approved image digest: capture from the exact main deployment artifact.
- ACA runtime invariant: template and sole 100% traffic revision match the approved pinned digest.
- Worker image invariant: both required workers match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: original analytics answer, clicked CFO follow-up, citations, explicit interview-basis challenge and mobile/scroll behavior.

## Rollback Plan

Protected revert and the same ACA main workflow. No data rollback required.

## Audit Evidence

PR diff, exact-head source decision, local validation, current-head workflows and all-open-PR guard, official deployment artifact, independent runtime invariant and private signed-in captures. Earlier failed outputs remain in the private QA receipt.

## Known Gaps

Malformed model output can still yield an honest no-answer result. This bounded release does not prove universal semantic entailment, full enterprise accuracy, data freshness, full Home export or graph activation.
