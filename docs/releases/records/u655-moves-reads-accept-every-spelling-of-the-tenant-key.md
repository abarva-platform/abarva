# u655 — Moves reads accept every spelling of the tenant key

## Release ID

`2026-10-16-moves-tenant-key-alias-reads`

## Status

`candidate`

## Plain-English Summary

Rows that belong to one Moves tenant are stored under more than one spelling of
that tenant's key: older code paths persist the application client key, newer
ones persist the canonical key, and the tenant-key canonicalization cleanup
rewrites legacy spellings to the canonical one. Several Moves read paths
filtered on exactly one spelling, so a deliverable, evidence item, evidence
review, or review decision stored under any other spelling read back as
"none" — the surface reported an absence that was really a key mismatch, and
any canonicalization pass on the live database would have made every existing
Move's deliverables disappear from those readers.

This change makes those reads accept the tenant's whole alias set, which is
defined per tenant and cannot reach another tenant's rows. The post-read
tenant checks that guard file downloads use the same set, so a row stored
under the canonical spelling is served and a row from a different tenant is
still refused.

## Layer Impact

This change ships in the **global-control-lane**: it is shared product read
behaviour, with no client-scoped schema, seed, or data change.

- **Products (layer 4):** Moves deliverable, evidence, review-decision, and
  gate-integrity reads now match on the per-tenant alias set instead of one
  spelling. No product computes or owns new data.
- **Canonical model (layer 3):** unchanged. No table, column, or migration
  changes. Writers still persist the key they persisted before; this change
  only widens what readers accept within one tenant.
- **Source adapters / intake (layers 1–2):** none.

## Client Applicability

- All clients: yes — every tenant's Moves reads use the same alias dictionary.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- New `src/lib/programs/tenant-key-filter.ts` exporting the per-tenant read
  value set, built on the existing tenant alias dictionary.
- `src/lib/programs/deliverables/move-artifacts.ts`,
  `src/lib/programs/deliverables/diagnose-intake.ts`,
  `src/lib/programs/deliverables/artifact-review-decisions.ts`,
  `src/lib/programs/current-state-doc-ingest.ts`, and
  `src/lib/programs/governance.ts`: nine `tenant_key` equality filters become
  set membership; two post-read equality checks and one gate-integrity
  equality check become set membership.
- New suite `src/lib/programs/__tests__/tenant-key-filter.test.ts`; the
  existing `move-artifacts` suite's query mock learns the set filter.
- Regenerated `docs/architecture/test-ci-coverage-census.json`.

## QA / Validation

- `npx jest` on the new suite plus the Moves programs suites that exercise
  the edited modules: PASS (17 suites, 275 tests).
- Mutation check, filter reverted to single-spelling equality: new suite
  FAILS as intended (PASS for the check).
- Mutation check, post-read guard reverted to equality: new suite FAILS as
  intended (PASS for the check).
- `tsc --noEmit` on the full project: PASS (exit 0).
- `eslint` on every changed file: PASS.
- `audit:lib-orphans`: PASS — no change against the baseline; the new module
  is reached by product code.
- `audit:test-ci-coverage:write`: PASS — the new suite lands in a directory
  the required catalog workflow already sweeps; census regenerated.
- Live signed-in Moves walk on the deployed revision: NOT RUN (post-deploy
  lane; see Deployment Authority).

## Rollout Plan

Merge to `main` by squash; the repo-owned ACA main deploy workflow builds and
deploys the image automatically. No migration, flag, or environment change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none run by this change.
- Approved image digest: the digest the main deploy workflow records for the
  squash-merge commit.
- ACA runtime invariant: template image, 100% traffic revision image, and
  worker job images must match that digest before any "live" claim.
- Worker image invariant: unchanged; this change ships in the web image only.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — the read-only Moves step pages live
  walk on the deployed revision for the synthetic demo tenant.

## Rollback Plan

Revert the squash commit and let the main deploy workflow redeploy the prior
image. There is no data to roll back; no row was written or rewritten.

## Audit Evidence

- The pull request and its CI runs.
- The main deploy run for the merge commit and its recorded digest.
- The Moves step pages live walk run after deploy.

## Known Gaps

- Writers still persist the application client key while other writers
  persist the canonical key, so the persisted-alias verifier keeps reporting
  those rows until a canonicalization pass runs. That pass is an operator
  data decision outside this change; this change makes it safe for Moves
  readers.
- One existing Moves read path already used the alias set; this change brings
  the remaining programs-library reads to the same rule. Reads outside the
  programs library were not audited here.
