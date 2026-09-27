# 2026-09-27-source-event-self-policy - Event Owner approval policy

## Release ID

`2026-09-27-source-event-self-policy`

## Status

`candidate`

## Plain-English Summary

New Source events explicitly record a SELF approval policy. The Event Owner may make an auditable same-person stage decision without a separate sponsor/EA signer dependency, while work evidence, approved artifacts, criterion states, and human rationale remain mandatory. Historical or missing policy retains the signed-scope behavior. An event-creation retry returns the original event instead of resetting its stage or approval policy.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source workflow authority and event-view projection only. No supplier identity, commercial value, evaluator score, contract, or other canonical Layer 3 fact is authored by this change.

## Client Applicability

- All clients: new Source events after the prerequisite schema migration is applied.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Explicit per-event `self_v1`; existing and missing policy remain legacy.

## Changes Included

Event creation/read mapping, the common criterion and stage-gate evaluator, both stage-advance routes, the criterion-state route, and a policy-aware event view. The separate schema prerequisite is release `2026-09-27-source-event-approval-policy-schema`.

## QA / Validation

- Pass: red-first tests reproduced missing policy persistence, duplicate-create overwrites, external signer checks under SELF, and route policy omission.
- Pass: 14 focused Source, route, canvas and adapter suites, 204/204 tests. Red-first cases caught false sponsor-role attribution, unsupported external sign-off labels, and a sponsor task restored by the canvas fallback.
- Pass: removing the missing-policy fallback made the historical-authority test fail; restoration returned it to green.
- Pass: TypeScript no-emit with an 8 GB heap and scoped ESLint. Final release control and diff checks are run before PR.
- Not run: live migration apply or schema readback. Separate specific authorization is required.
- Not run: positive human Event Owner decision or signed-in SELF event acceptance.

## Rollout Plan

Do not merge this code PR until the schema-only PR is merged, the governed database migration is separately authorized and applied, and read-only schema/ledger proof is recorded. Then squash merge through a reviewed PR. Only `.github/workflows/aca-main-deploy.yml` may deploy the merged code. Verify immutable digest, healthy 100%-traffic revision, workers, and a signed-in eligible SELF event. No external email or supplier action is part of this candidate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after schema readback.
- Shared runtime mutators: That workflow only.
- Approved image digest: Determine from the completed main workflow.
- ACA runtime invariant: Verify template and healthy 100%-traffic revision match the digest.
- Worker image invariant: Verify required delivery workers match the digest.
- Feature/env flag update path: No environment flag; policy is event-scoped.
- Live signed-in proof required: One authorized Event Owner decides an eligible new event, with persisted approval and activity readback. Historical signed-scope event must remain blocked without its genuine evidence.

## Rollback Plan

Revert the application PR and redeploy through the official main workflow. The additive policy column can remain unused; do not drop it while application revisions may still read it. Do not rewrite historical policies.

## Audit Evidence

The schema and code PRs, CI checks, red/green and mutation output, official migration preflight/apply and ledger, official ACA deploy, independent digest proof, and signed-in decision readback are distinct evidence layers.

## Known Gaps

The schema is not yet applied and this code is not live. Human decision and event-owner participant readback remain owed. Later-stage organizational-approval assumptions require policy-aware review before claiming the complete CPO journey. SELF Scope criterion titles and append-only actor-role notes now name the Event Owner; historical titles and controls are retained.
