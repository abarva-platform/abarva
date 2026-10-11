# Source Targeted Data Repair

## Release ID

`2026-10-11-source-targeted-data-repair`

## Status

`applied`: two exact-scope transactions committed and passed independent
read-only after-image checks. Signed-in observations are recorded separately;
this is not certification of financial values or full workflow readiness.

## Plain-English Summary

Correct recorded measurement units without changing the underlying measurements
or source evidence. Separately withdraw unsupported completed monetary
calculation states while retaining the authored proposal as source provenance.
This is a targeted repair, not a package reload or financial certification.

## Layer Impact

- Layer 1: unchanged input files, hashes and declared identities.
- Layer 2: source adapter evidence remains unchanged.
- Layer 3: exact-ID canonical measurement and calculation-state corrections.
- Layer 4: consumes corrected canonical records; no UI code or readiness override.

## Client Applicability

- Release lane: `client-data-lane`.
- All clients: no bulk or automatic change.
- Specific clients: only the synthetic scope in private approval record
  `SOURCE-DATA-REPAIR-20261011`.
- Internal only: operator execution and private proof artifacts.
- Public/demo only: not a public data publication.
- Feature flag: none changed.

## Changes Included

- Record the exact-scope operator repair and independent readback.
- Preserve the import correction merged in PR #9389 as a deployment prerequisite.
- No new migration, data package, approval, finance decision or calculated value.

## QA / Validation

- Seventeen local guard tests pass, including complete before-image drift,
  protected source/numeric/text columns, target identity and operator entry point.
- Two guard-removal mutations are killed by the negative fixtures. Independent
  review exercised ten local mock scenarios, including unknown COMMIT outcome,
  trigger side effects, protected evidence/finance changes and saved-run recovery.
- Live preflight matched whole before-images and parsed all proposed updates
  without executing them. Two transactions corrected 36 measurement-unit rows
  and six unsupported monetary/calculation-state rows, respectively.
- Independent read-only Jobs matched the committed whole after-images. Non-target
  rows and protected evidence, approvals and finance records remained unchanged.
- Business-column changes were limited to the hashed plans. The reviewed
  automatic timestamp trigger remained enabled. Historical dates, source
  payloads and numeric measurements were preserved.
- Private Blob archives hold before-images, validated precommit snapshots and
  final sealed proofs. Both successful applications left the operator idle and
  its template unchanged.
- Fresh runtime inspection matched the digest-pinned web template, healthy
  100%-traffic revision and both required worker images. The serving main
  ancestry includes the import-code correction; no branch deployment was used.
- The first application attempt encountered a SQL parameter-binding error and
  confirmed a rollback before commit. A new read-only preflight validated the
  corrected binding before retry; no partial data change was accepted.
- Signed in, the measurement view no longer asserts false percentage units;
  it still uses bare numbers where legacy formatted text disagrees. The repaired
  opportunity view states that no value has been sized; its workbench shows
  pending inputs and no claimed amount. These are bounded observed behaviors,
  not certification of the rest of either page.

## Rollout Plan

Run the existing private ACA operator Job with a digest-pinned approved image and
start-time overrides. Bind the direct user instruction to the exact plan and
before-image hashes. Fail on any new scope or drift. Preserve the idle template
and reject overlapping operator or migration executions.

This rollout is complete for the two reviewed scopes. Do not rerun the repairs
blindly: saved execution identity and whole before-image predicates refuse a
duplicate application. No package reload was performed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this repair.
- Approved image digest: recorded privately with exact deployed commit proof.
- ACA runtime invariant: digest-pinned web template and healthy 100%-traffic revision.
- Worker image invariant: both required workers match the approved web image.
- Feature/env flag update path: none used.
- Live signed-in proof required: affected contract screens; not inferred from data readback.

## Rollback Plan

Before commit, any failed validation rolls back the transaction. After commit,
restore only the archived exact IDs under a separately approved rollback plan
and fresh after-image predicates. Do not reload a whole package, disable audit
triggers, overwrite concurrent changes or fabricate approvals.

## Audit Evidence

Private record `SOURCE-DATA-REPAIR-20261011` holds the direct instruction, input
hashes, whole before-images, planned column diffs, code hash, job identity, image
digest, private Blob locations, validation, after-readback and idle proof.
Public records intentionally omit tenant identities and source contents.

## Known Gaps

Formatted legacy text, baseline-versus-coverage readiness and lineage reader
tenant context are outside the unit-only business change. One preserved
requirement explanation still describes the repaired proposal as quantified;
the authoritative amount and calculation states are no longer quantified.
No financial figure, industry benchmark, recommendation or model citation is
certified by this repair.
