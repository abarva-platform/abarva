# 2026-10-13-moves-existing-contact-confirmation — Existing P1 contact confirmation

## Release ID

`2026-10-13-moves-existing-contact-confirmation`

## Status

`candidate`

## Plain-English Summary

The normal P1 sponsor/scope page lets an authorized reviewer explicitly choose an existing declared participant as sponsor progress contact and day-to-day lead. Both choices and a rationale are reviewed before a separate confirmation command. Current operational contact bindings are shown separately from the preserved signed origination roles. Automated contacts carry delegated synthetic attribution.

## Release Lane

`experimental`

## Layer Impact

Release lane: `experimental`.

- Layer 2 source adapter: a scoped read-only preview and one serializable canonical write command.
- Layer 3 canonical model: only the existing engagement sponsor and lead person pointers change, with a required audit. The existing engagement trigger maintains its system timestamp.
- Layer 4 Moves projection: the normal P1 page and chrome consume the same authoritative participant readback. Saved capture and evidence keep their existing handlers.

## Client Applicability

Feature flags: only active registry-declared synthetic-demo scopes with all three existing flags receive the capability.

- Existing `moves_step_pages_v3`, `moves_step_pages_p0p1_v1` and `moves_extended_intake_fields_v1` flags must all be enabled.
- The active tenant-input registry must declare at least one packet and classify every packet as synthetic-demo.
- The Move must currently be at P1, with verifiable approved P0 snapshot and signed version-one origination bindings.
- Existing behavior for flag-off, private and undeclared scopes is preserved.

## Changes Included

The owned participant-binding adapter, the existing phase-capture GET/POST route, the P1 page preload, host, contact controls, shared readiness predicate and narrow ID wrapping style. The existing feature description and generated manual describe this gated capability.

The preview derives choices from actual same-Move participant/person identity bindings. Placeholders, missing identities, duplicate participant bindings and arbitrary IDs are refused. Selecting a contact preserves participant roles, approval authority, client rights and the original operator's approval permissions.

Confirmation requires the exact current revision and a unique reviewed request ID. The transaction locks and verifies the engagement, participant rights, historical signed records, all capture modules and source records. It updates the two canonical pointers, requires one audit with separately typed program/engagement SQL identifiers, and compares protected readback before commit. Exact idempotent repeats return the same stored audit; conflicting requests refuse. Unknown commit and wrapper-proven rollback or failure to start remain distinct.

## QA / Validation

PASS: 793 fresh affected assertions across seventeen N/contact/capture, upstream document and Tower projection suites after genuine main reconciliation. The earlier 176 Source admission assertions remain recorded separately for their unchanged source. Fourteen individual guard, SQL and outcome mutations were detected and restored. Twelve actual component/style variants at 390 and 1440 in light and dark themes pass labels, contrast, keyboard scrolling and overflow checks. Node 24 typecheck and lint, reachability, all six corpus validators and generated checks pass. Immutable current-main regeneration gives 2861 covered suites; the candidate's 2863 adds two genuine required adapter/hook suites. Runtime execution and full acceptance are not run for this candidate.

Focused in-memory tests exercise the real transaction wrapper without a database connection. They cover explicit selection, individual flags, declaration, identity, permission, phase, CAS, idempotency, concurrent requests, mandatory audit, preservation and outcome reporting. Existing route, host, contact UI and preceding correction suites are included. Source mutations and real component/style checks at 390 and 1440 in light and dark themes are required before publication. Node 24 typecheck, lint, reachability, six corpus validators, genuinely regenerated manual/coverage/tenancy checks and all release gates are required.

Exact local results, final source hashes, current-head CI and the fetched contender guard are retained in the private owner receipt. This candidate record does not assert runtime execution or acceptance.

## Rollout Plan

After exact delegated source review, complete current-head checks and the fresh fetched all-open contender guard, squash this candidate through its own PR before the Moves cutoff. The repo-owned main deployment builds and deploys the approved image. Observe its official artifacts and independently verify serving identity and runtime digest invariants. The existing sole runtime writer then submits a fresh normal contact preview for a separate exact delegated execution decision.

## Deployment Authority

- Repo-owned workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared web traffic, template and worker changes remain exclusively in that workflow.
- Approved image digest: supplied by the actual main deployment, then independently verified.
- Web template, sole 100-percent latest-ready healthy traffic revision and every required worker must match the approved pinned digest.
- Feature flags, environment, credentials and schema are unchanged.
- Live signed-in confirmation, mandatory audit and complete native preservation readback are required separately from source and deployment proof.

## Rollback Plan

A pre-commit refusal leaves contact pointers unchanged. Any post-commit restoration of prior contacts requires another exact reviewed normal command and its own audit. Source rollback uses a governed PR and repo-owned main deployment. Signed historical records and participant permissions remain preserved.

## Audit Evidence

Inspect the exact source/local QA receipt, mutation detections with source restored, component/style fixtures, immutable-main census regeneration, own current-head CI, stable all-open fetched guard, actual squash, deployment artifact, independent serving/digest proof and separately reviewed runtime audit/native readback. All public evidence remains mechanism-only.

## Known Gaps

This candidate is unpublished. No live contact appointment, new phase progression or independent human/client attestation is proven. Full 29-view speed and non-speed acceptance, readiness adoption, intake reload and independent deck acceptance remain separate open requirements. Existing protected-fixture approval-display and scrolling failures are outside this narrowly reviewed candidate.
