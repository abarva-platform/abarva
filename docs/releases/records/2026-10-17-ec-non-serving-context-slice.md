# 2026-10-17-ec-non-serving-context-slice — Isolated Context Contract

## Release ID

`2026-10-17-ec-non-serving-context-slice`

## Status

`candidate`

## Release Lane

`client-data-lane`

## Plain-English Summary

Rehearse a source-linked enterprise context contract in a disposable database. Objects, competing assertions, qualified relationships, observation grains and deterministic rule evaluations remain distinct. This is non-serving infrastructure: it does not refresh tenant data or alter a product page.

## Layer Impact

Release lane: `client-data-lane`.

- Source adapters: pure candidate-to-canonical transformation and refusal tests.
- Canonical model: disposable-only schema draft, deterministic evaluation and shadow graph contracts.
- Governance: advisory exclusion tests and unsigned manifest proposal helper. No approval contract weakened.
- Products: no change to readers, routes, prompts, Home, Tower, or serving selection.

## Client Applicability

- All clients: no activation.
- Specific clients: none selected for loading or serving.
- Internal only: isolated contract proof and test fixtures.
- Public/demo only: no public surface change.
- Feature flag: no runtime flag or environment update.

## Changes Included

See `docs/architecture/ec-slice-acceptance.md`, the semantic map, pure adapter/rules/shadow tests and the disposable-only SQL draft. No automatic migration or executable production loader is added.

## QA / Validation

- Pass: 53 pure contract tests and 236 focused rule/governance Jest tests on Node 24.
- Pass: full typecheck and focused ESLint.
- Pass: Home ratchet, no movement; existing 12 failing suites remain baselined, not fixed by this candidate.
- Pass: full context/corpus and manifest validation; pre-existing manifest warnings remain.
- Pass: release check, all 11 gates.
- Pass: isolated schema draft applied twice with zero business/source rows.
- Pass: generic disposable physical admission on local Postgres 18, effective-role read RLS, cross-tenant endpoint rejection, independent raw-byte readback, replay refusal, unverified excerpt persistence and exact shadow comparison. No product projection rows changed.
- Pass: independent technical clearance to execute the generic fixture only. Private dataset approval remains held.
- Pass: operator-only rule placement and unchanged library-orphan baseline; reader-view grain, canonical assertion references, null-safe subjects and UTC-only QA guards.
- Pass: final independent code-local generic review, with the isolation inventory corrected to the operator-only rule path.
- Pending: Postgres 16 CI. No private dataset load or product proof claimed.

## Rollout Plan

Squash PR to main after local and CI gates. Code may be packaged by the repo-owned main deploy workflow, but no source dataset, database migration, load, index or serving path activates. Production adoption requires a separate reviewed release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only, if main deploy is triggered.
- Shared runtime mutators: none in this candidate.
- Approved image digest: not applicable to disposable proof; no deployment claim yet.
- ACA runtime invariant: required before any later runtime claim.
- Worker image invariant: required before any later runtime claim.
- Feature/env flag update path: none.
- Live signed-in proof required: before later product activation, not claimed here.

## Rollback Plan

Revert the PR. Disposable SQL is not in the automatic migration directory and rejects databases other than the named test database. No tenant state or serving selection needs rollback.

## Audit Evidence

Focused test output, CI physical admission, semantic mapping and slice acceptance record. Private source-quality receipts remain outside the public repository.

## Known Gaps

Production schema adoption, source-owner ratification, signed manifest declaration, exact-version load approval, index/retrieval/cite-render proof, serving approval and signed-in product acceptance are deliberately not granted by this release.
