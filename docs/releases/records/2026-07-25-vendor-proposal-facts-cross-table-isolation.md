# 2026-07-25-vendor-proposal-facts-cross-table-isolation — Cross-table isolation (PR B)

## Release ID

`2026-07-25-vendor-proposal-facts-cross-table-isolation`

## Status

`candidate` — local tests/lint/typecheck clean.

## Plain-English Summary

PR B of the RLS/tenant-isolation security workstream (`ADR-0013`, `ADR-0014`), sequenced
directly after PR A. PR A made `source_vendor_proposal_facts`/`source_vendor_proposal_fact_reviews`
real, RLS-enforced, tenant-scoped tables with immutable ownership — but neither guarantee
covers whether a row's ownership columns were internally CONSISTENT with each other at insert
time. This release closes that class of gap:

1. **Cross-table ownership-consistency triggers** (new migration): a fact's `client_key` must
   match the real `client_key` of the `source_events` row its `source_event_id` points at; its
   `proposal_artifact_id` must belong to that same tenant AND event (not just the same tenant);
   and — the headline check — `supersedes_fact_id` must reference a fact with the identical
   tenant, event, vendor, AND fact-key, so a fact can never be "superseded" by an unrelated fact
   from a different tenant, event, vendor, or logical key. Deliberately does NOT require the
   same `proposal_artifact_id` — a revision is expected to come from a different, newer
   document. A parallel trigger on the reviews table checks a review's own tenant/event match
   the fact it reviews. Plain foreign keys cannot express any of this (a FK only proves the
   referenced row exists, not that its tenant/event columns match) — hence `BEFORE INSERT`
   trigger functions, matching PR A's immutable-ownership triggers in style.
2. **A join-safety fix in `context-binder.ts`** (found during the original scope discovery):
   the uploaded-evidence read for artifact-generation prompts previously checked `tenant_key`
   only at the first join hop (`source_artifacts`) and trusted the resulting `artifactIds` with
   no independent check at the second hop (`source_artifact_chunks`/`source_artifact_facts`).
   Both hops now carry an explicit `tenant_key` filter — defense in depth, not a change in
   practical behavior today (the first hop was already correct), but closes a real gap that a
   future refactor or a different caller could otherwise silently reopen.
3. **A named, honest scope limitation**: this schema has no dedicated vendor/event-vendor
   authorization table — `vendor_key` is a free-text column, matching the rest of Source's
   vendor-lever fact model. There is therefore no vendor-authorization row to check beyond
   internal consistency (which the supersession check above already covers) — documented rather
   than fabricating a check against a table that doesn't exist.

## Layer Impact

- `global-control-lane`: a new migration (two `BEFORE INSERT` triggers) and a small,
  backward-compatible read-path fix in a shared context-binder function. No product-facing
  behavior change for any existing caller with a correctly-scoped request — the new triggers
  only reject requests that were ALREADY internally inconsistent, which the application layer
  never produces today.
- `client-data-lane`: `source_vendor_proposal_facts`/`source_vendor_proposal_fact_reviews` now
  have a database-enforced cross-table consistency guarantee in addition to PR A's per-table
  tenant isolation.

## Client Applicability

- All clients: yes — uniform, no tenant-specific behavior.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `supabase/migrations/20260726020000_vendor_proposal_facts_cross_table_consistency.sql` — the
  two `BEFORE INSERT` ownership-consistency triggers.
- `src/lib/source/agent-generation/context-binder.ts` — `listUploadedEvidenceForGeneration` now
  requires a `tenantKey` parameter and filters by it at both join hops.
- `docs/architecture/adr/ADR-0014-vendor-proposal-facts-rls-tenant-context.md` — amendment
  recording PR B's decision.
- `src/__tests__/integration/source/vendor-proposal-facts-cross-table-consistency-migration.test.ts`
  (new) — migration-structure dry-run test (this repo's established convention for asserting
  migration SQL shape without a live DB connection).
- `src/lib/source/agent-generation/__tests__/context-binder.test.ts` — new test proving the
  tenant_key filter is applied at both join hops.

## QA / Validation

- `pass` — new migration-structure test (7 cases): BEGIN/COMMIT wrapping, both trigger functions
  defined, the exact ownership-consistency checks present (event, artifact-tenant-AND-event,
  supersession tenant/event/vendor/fact-key match, review-fact match), confirms
  `proposal_artifact_id` is NOT part of the supersession match, confirms every mismatch branch
  raises an exception.
- `pass` — new context-binder test: asserts `tenant_key` filter reaches both the
  `source_artifacts` query and the `source_artifact_chunks`/`source_artifact_facts` queries.
- `pass` — regression sweep: `context-binder.test.ts` (7/8 — the 1 failure is the same
  pre-existing, unrelated tenantName-derivation bug confirmed present on unmodified `main` in
  the PR 3 release record), `prompt-registry.test.ts` — all passing.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  — zero errors.
- `pass` — `npx eslint` on all touched/added files — zero errors, zero warnings.
- `pending` — `node scripts/release-check.mjs` — to run before PR open.
- `pending` — governed migration lane (`status` then `apply`).
- `pending` — live proof: PR C's regression harness and the workstream's final live
  multi-tenant proof will exercise these triggers with real cross-tenant/cross-event fixtures
  (attempting to violate them) — this release's own tests prove structure and the read-path
  fix, not live trigger rejection with adversarial data.

## Rollout Plan

Merge to `main` via PR, deploy through the repo-owned ACA main deploy workflow. Separately, run
the governed migration lane (`status` then `apply`). No product-facing behavior changes for any
existing, correctly-scoped caller.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none directly; the migration lane is dispatched separately,
  `workflow_dispatch`-only.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be recorded after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — see QA / Validation.

## Rollback Plan

Revert the merge commit for the application code. The migration's triggers are additive and
reject only rows that were already internally inconsistent — reverting them removes a
defense-in-depth check, not functionality any correctly-behaving caller depends on. No existing
data is touched or migrated by this release.

## Audit Evidence

- PR: to be recorded on open.
- Deploy run, migration-apply run, and live proof: to be recorded after merge/deploy.
- Baseline audit this release closes items from:
  `docs/audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md`.
- Sequencing decision: `docs/architecture/adr/ADR-0013-source-modernization-baseline.md`.
- Design decision: `docs/architecture/adr/ADR-0014-vendor-proposal-facts-rls-tenant-context.md`
  (PR B amendment).

## Known Gaps

- **No vendor/event-vendor authorization table exists in this schema** — `vendor_key` remains
  free-text throughout Source. A real vendor registry with per-event vendor authorization is
  out of this release's scope, named explicitly.
- **This release's own tests prove structure, not live adversarial rejection.** The full
  cross-tenant/cross-event/cross-vendor negative-test suite (attempting real violations against
  a live or ephemeral Postgres) is PR C's explicit scope, immediately next in this workstream.
- **Accept/reject cross-boundary enforcement was already closed by PR A's SQL-level WHERE
  clauses** (not new in this release) — this release adds the DATABASE-level backstop
  (triggers) on top of that application-level check, for defense in depth.
