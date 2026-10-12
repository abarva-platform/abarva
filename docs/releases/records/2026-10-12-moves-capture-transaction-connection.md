# 2026-10-12 — Connection selection for retained capture correction

## Release ID

`2026-10-12-moves-capture-transaction-connection`

## Status

`candidate`

## Plain-English Summary

The retained-input correction uses the existing configured Postgres transport when the active tenant registry explicitly declares synthetic demo data and the deployment has no tenant binding. Configured tenant URLs take precedence. Private or unknown tenants still require their own configured connection; an environment switch cannot enable a shared fallback for them.

This changes connection selection before the correction transaction. The original transaction and every input, permission, approval and preservation check remain unchanged.

## Layer Impact

- Release lane: `global-control-lane`, within the existing tenant feature gates.
- Layer 2 adapter: select the existing transport using declared canonical tenant identity and synthetic classification.
- Layer 3: retain the existing serializable capture transaction, mandatory audit and readback. No schema, seed, source input or stored record is changed by preparing this release.
- Layer 4: no new surface, control, label or layout.

## Client Applicability

- All clients: configured tenant URLs remain preferred; private and unknown tenants receive no shared fallback.
- Specific clients: only active registry declarations whose packets all classify as synthetic demo, in an unscoped deployment and already enrolled in the existing correction flags, can use the existing compatibility transport.
- Internal only: no.
- Public/demo only: the compatibility branch is synthetic demo only.
- Feature flags: existing `moves_extended_intake_fields_v1`, `moves_step_pages_p0p1_v1` and `moves_step_pages_v3`. Enrollment is unchanged.

## Changes Included

- Resolve canonical tenant-key and client-ID URLs first, with shared fallback explicitly disabled.
- Retain a configured scoped alias URL as compatibility for declared historical aliases.
- Use the existing normal Postgres compatibility transport only after the active registry classification and unscoped deployment checks both pass.
- Preserve the entire transaction body: original approver, current permission, exact tenant/program, actual P1, capture/source/snapshot/signed-version binding, mandatory audit, complete preserved-row checks and honest uncertain-outcome reporting.

## QA / Validation

- PASS: the real tenant resolver reproduced the pre-transaction unavailable result before this fix. The new regression failed on the preceding source.
- PASS: 263 assertions across fourteen existing suites after reconciling the genuine deck and Tower landings. The additional Home narrative boundary runner passes its three behavior suites with database credentials removed. These include the real resolver and real serializable transaction wrapper supplied an in-memory connection, plus route, transaction outcome, operator policy SQL and capture contracts. No database was contacted.
- PASS: eight individually detected connection-boundary mutations; every source was restored. They cover the declared transport, synthetic classification, deployment binding, both strict scoped resolutions, canonical normalization, scoped precedence and alias compatibility.
- PASS: official Node 24 typecheck and changed-file lint.
- PASS: actual landed deck/Tower main `1b8f8548` and later Home main `6bc68d73` were merged without rebasing. Manual/coverage/tenancy artifacts were regenerated. Independent immutable source regeneration gives 2856 and matches every candidate count field, with zero new test files and genuine delta zero.
- PASS: the transaction body is byte-identical to the preceding deployed source. Existing UI/model/CSS sources are unchanged; their prior visual proof is retained as local proof only.
- PASS: saved deployment metadata confirms the existing transport projection and absence of explicit deployment-scope environment names. Credential values were not inspected and runtime settings were not changed.
- PASS: final library/route/export reachability, regenerated manual/coverage/tenancy checks, all six corpus validators and all eleven release gates after the actual Home reconciliation. Complete new exact-head CI and an immediate stable fetched guard remain required before merging.
- PENDING: actual deployed correction, mandatory audit and independent native preservation readback. Unit transaction results are not runtime proof.

## Rollout Plan

Keep this candidate unpublished while an applicable open contender carries the same genuinely regenerated census. After its genuine eligible landing, reconcile actual main without rebasing, regenerate manual/coverage/tenancy artifacts, rerun affected QA and required gates, publish the controlled candidate and require complete checks on its exact new head. Immediately fetch all open Moves PRs including drafts and current shared-census candidates before any own squash.

Only the automatically triggered repo-owned ACA main deploy workflow may promote the image. Verify its artifact and the independent serving SHA/digest invariant, then inspect the normal correction preview. The authorized journey owner performs any approved correction; independent audit and preserved-binding evidence must precede downstream progression.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this candidate.
- Approved image digest: pending the successful main deployment artifact.
- ACA runtime invariant: web template and sole 100%-traffic latest-ready revision match the approved digest.
- Worker image invariant: every required worker matches the same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; the normal preview, transaction audit and stored readback remain unproven for this candidate.

## Rollback Plan

Revert through a controlled squash PR and the repo-owned main deploy workflow. Preserve stored input, existing approvals, signed versions and immutable audit records. Reverting code does not reverse any separately approved correction that has already committed.

## Audit Evidence

The exact source diff, real-resolver before/after regression, eight restored mutation receipts, focused test and local gate output, immutable-source census reconciliation, fetched guard, exact-head CI, actual squash commit, approved deployment artifact, fresh runtime invariant and independent native audit/readback.

The preceding release is [#9452](https://github.com/abarva-platform/abarva/pull/9452), squash `847782ee6e36cc7ff48c23e0cca8fd91170c0d0b`. Its valid [after walk](https://github.com/abarva-platform/abarva/actions/runs/38298423936) failed speed/non-speed acceptance; this connection candidate does not waive that result.

## Known Gaps

- This candidate has no deployed correction or stored-readback proof.
- The preceding step walk still has a slow Validate view, an absent-versus-failed approval presentation issue and a keyboard-scrolling accessibility issue. Those repairs are tracked separately from this minimum transaction-entry change.
- Full 29-view acceptance, native intake/reload and independent deck acceptance remain pending.
- No retry or downstream clearance is implied by local code, tests or a successful image deployment.
