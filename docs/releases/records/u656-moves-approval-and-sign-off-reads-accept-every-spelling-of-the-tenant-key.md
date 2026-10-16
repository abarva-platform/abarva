# u656 — Moves approval and sign-off reads accept every spelling of the tenant key

## Release ID

`2026-10-16-moves-tenant-key-alias-reads-approval-signoff`

## Status

`candidate`

## Plain-English Summary

Rows that belong to one Moves tenant are stored under more than one spelling of
that tenant's key, and the tenant-key canonicalization cleanup rewrites legacy
spellings to the canonical one. Release u655 widened the deliverable, evidence,
review-decision and gate-integrity reads in the programs library to the
per-tenant alias set. This change brings the remaining exact-spelling reads and
guards on the Move walk to the same rule:

- the in-Move P0 brief approval, which refused with "no pending brief approval"
  when the pending request was stored under another spelling of the caller's
  own tenant, so P0 could not be crossed;
- the approvals queue and approvals audit list, which reported an empty queue
  under the same condition;
- the Move context extract lookups that the P3 sign-off and client-approval
  preconditions depend on, which reported "no extract" and refused;
- the approved inputs-pack read, the artifact trace route's tenant check, and
  the review-decision route's paired-record lookup.

Each read now accepts the tenant's whole alias set, which is defined per tenant
and cannot reach another tenant's rows. A row from a different tenant is still
refused on every one of these paths.

## Layer Impact

This change ships in the **global-control-lane**: it is shared product read
behaviour, with no client-scoped schema, seed, or data change.

- **Products (layer 4):** Moves approval, sign-off precondition, inputs-pack,
  trace and review-decision reads match on the per-tenant alias set instead of
  one spelling. No product computes or owns new data.
- **Canonical model (layer 3):** unchanged. No table, column, or migration
  changes. Writers still persist the key they persisted before.
- **Source adapters / intake (layers 1–2):** none.

## Client Applicability

- All clients: yes — every tenant's Moves reads use the same alias dictionary.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/approval.ts`: the approvals queue and audit-list tenant
  filters become set membership.
- `src/app/api/v1/programs/[programId]/approve-brief/route.ts` and
  `.../artifacts/[artifactId]/trace/route.ts`: the post-read tenant checks
  become set membership.
- `.../artifacts/[artifactId]/review-decision/route.ts`,
  `src/lib/programs/move-context-extract-freshness.ts`,
  `src/lib/programs/move-context-extract.ts`, and
  `src/lib/programs/approved-inputs-pack-store.ts`: one `tenant_key` equality
  filter each becomes set membership.
- New suites: `src/lib/programs/__tests__/moves-alias-tolerant-tenant-reads.test.ts`
  (a filter-aware in-memory store, so a single-spelling read fails by returning
  nothing), `src/app/api/v1/programs/[programId]/approve-brief/__tests__/route.test.ts`,
  and `.../artifacts/[artifactId]/trace/__tests__/route.test.ts`.
- Existing suites extended: `approval`, `move-context-extract`,
  `move-context-extract-freshness-basis`, and the review-decision route suite
  learn the set filter and pin it.
- The phase-templates governance source-scan (`enterprise-promotion` suite) now
  pins the inputs-pack read to the alias-set filter instead of the single-spelling
  equality it pinned before.
- Regenerated `docs/architecture/test-ci-coverage-census.json` and
  `docs/security/tenancy-fence-coverage.json` (the P0 brief-approval route is now
  behaviourally covered: 89 behavioural, 137 none).

## QA / Validation

- `npx jest` on the nine affected suites (new, extended, the alias helper, and
  the worker-leaf import boundary for the freshness module): PASS (9 suites,
  81 tests).
- Mutation sweep, 18 mutants across the eight edited sites (each set filter or
  guard reverted to single-spelling equality; each alias lookup replaced by the
  bare key; each guard removed): 18 killed, 0 survived (PASS).
- `tsc --noEmit` on the full project: PASS (exit 0).
- `eslint` on every changed file: PASS.
- `audit:lib-orphans`: PASS — no change against the baseline.
- `audit:test-ci-coverage:write`: PASS — the three new suites land in
  directories existing workflows already sweep; covered-file count rises by
  three; census regenerated.
- `audit:tenancy-fence-coverage:write`: PASS — one route improves from none to
  behavioural; census regenerated (a first CI run on the stacked head caught
  the stale artifact and the stale scanner pin; both fixed before merge).
- Live signed-in Moves walk on the deployed revision: NOT RUN (post-deploy
  lane; see Deployment Authority).

## Rollout Plan

Merge to `main` by squash after u655; the repo-owned ACA main deploy workflow
builds and deploys the image automatically. No migration, flag, or environment
change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none run by this change.
- Approved image digest: the digest the main deploy workflow records for the
  squash-merge commit.
- ACA runtime invariant: template image, 100% traffic revision image, and
  worker job images must match that digest before any "live" claim.
- Worker image invariant: the freshness module is a worker-safe leaf and the
  new import was verified under the worker import condition; the worker image
  is rebuilt by the same workflow.
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

- The authored-document upload's own prior-upload lookup still filters on one
  spelling; it sits in an active sibling change and is left for that owner.
- The learning write-back read-back filters compare one spelling; they are
  outside the Move walk and not changed here.
- Writers still persist the application client key; the persisted-alias
  verifier keeps reporting those rows until a canonicalization pass runs. That
  pass is an operator data decision outside this change; with u655 and this
  change, the Moves readers on the walk are safe under it.
