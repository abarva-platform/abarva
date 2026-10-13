# Home Advisor Leadership Reference Qualification

## Release ID

`2026-10-13-home-advisor-leadership-qualification`

## Status

`candidate`

## Plain-English Summary

Home's existing reference-answer check also recognizes collective leadership wording and counted leadership claims, not just a limited set of interview verbs. A modelled response cannot become apparent actual testimony by using a synonym or placing it in the opener.

## Layer Impact

Release lane: `global-control-lane`.

- Layers 1-3: no source input, canonical data, schema, load, graph, corpus or approval changes.
- Layer 4: expand the existing Home answer qualification predicate only. The same declared record basis, audited correction, deadline and fail-closed output remain.

## Client Applicability

- All clients: existing authorized Home advisor consumers.
- Specific clients: qualification applies only to bundles explicitly declared synthetic reference; no identity inference or tenant exception.
- Internal only: no operator capability added.
- Public/demo only: no public access or attestation added.
- Feature flag: none.

## Changes Included

- Recognize collective leadership reporting, flagged concerns and counted leadership assertions in the existing reference check.
- Successful and failed correction cases for opener and point wording, including a counted assertion without an enumerated interview verb.
- No prompt expansion, new context, chat-layout change or extra model call beyond the existing single correction.

## QA / Validation

- PASS: 169 tests across seven focused answer, API, conversation, mounted chat, shared-dock, list-marker and tenant-name suites.
- PASS: TypeScript and scoped ESLint with Node 24. All eleven release gates are rerun with this record before publication.
- NOT RUN for this candidate: signed-in wording after deployment. Existing local tests do not clear product quality.

## Rollout Plan

Exact-source review and full current-head CI, protected squash merge and repo-owned ACA main deployment. No data refresh or serving activation is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: that workflow only.
- Approved image digest: capture from the approved exact main deployment artifact.
- ACA runtime invariant: template and sole 100% traffic revision match the approved pinned digest.
- Worker image invariant: both required workers match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: qualified analytics and CFO answers, preserved citations, distinct follow-ups and conversation behavior.

## Rollback Plan

Protected revert and deploy through the same main workflow. No data rollback required.

## Audit Evidence

PR diff, focused tests, validation gates, exact-head CI and source review, official deploy artifact, independent runtime invariant and private signed-in captures.

## Known Gaps

This is a bounded wording check, not universal semantic entailment or full Home/data/PDF acceptance. The selected record and its independent serving and admission gates are unchanged.
