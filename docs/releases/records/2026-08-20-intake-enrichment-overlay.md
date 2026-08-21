# 2026-08-20-intake-enrichment-overlay — Intake enrichment as an approved overlay

## Release ID

`2026-08-20-intake-enrichment-overlay`

## Status

`candidate`

## Plain-English Summary

Client intake workbooks are going to start carrying columns filled in by a language model
— a classification of what a system is, what platform it runs on, how a data flow moves.
That content is useful and it is also, by construction, not something the client stated.

This release builds the boundary that keeps the two apart, and nothing else. No template
column has been added yet, no tenant has been enriched, and no snapshot has been promoted.

Four rules, in code rather than in a document:

1. **Recorded data stays immutable.** Model output never becomes a column on the recorded
   record. It arrives as a proposal overlay validated against the exact source version it
   was derived from.
2. **Review happens per cell, not per column.** A column routinely contains approved,
   rejected and still-pending content at once, so admitting or refusing the whole column
   cannot express the review that actually happened.
3. **Basis travels with the value.** Every merged attribute carries its basis, evidence,
   approver and run alongside it. Consumers read that metadata rather than guessing from
   a column name.
4. **Each surface declares what it may read.** Deterministic figures and structural edges
   take recorded and computed content only. Narrative surfaces may carry derived content
   precisely because they can label what it is.

The failure this prevents is specific and one-way: a model's classification that reads
exactly like a client's own statement. Once that reaches a client-facing document, nobody
downstream can tell them apart.

## Layer Impact

Release lane: `client-data-lane`. The change defines client-scoped intake schema and
ingestion behaviour. It is in this lane because of what it governs, not because any client
data moved — none did.

- **Layer 1, client intake** — introduces the reserved column prefixes (`det__`, `drv__`,
  `aug__`) and the rule that a workbook carrying them must be split at intake. No template
  file changed in this release; the contract is defined ahead of the first template that
  uses it.
- **Layer 2, source adapters** — both ingestion routes now screen for reserved columns and
  agree on the recorded column set. Previously one file could produce two different
  canonical results depending on which route processed it: the mapping adapter dropped
  unmapped columns while the canonical build admitted them generically.
- **Layer 3, canonical model** — adds `attributeMetadata` beside `attributes`, keyed by the
  same logical attribute, so every canonical value can state what kind of thing it is.
  Recorded values are unchanged and always outrank a proposal.
- **Layer 4, products** — no product surface changed. The consumer basis policy is defined
  and tested but not yet enforced at any render path; wiring it is a later change.

## Client Applicability

- All clients: no. Nothing in this release alters an existing tenant's data or any rendered
  surface.
- Specific clients: none. No tenant has been enriched or reprocessed.
- Internal only: yes — contract, schemas and validators only.
- Public/demo only: no.
- Feature flag: none required, because no runtime path yet produces or consumes an overlay.

## Changes Included

- PR #6572, four commits:
  - enrichment firewall and overlay contract (reserved prefixes, dependency hashing,
    content-level financial prohibition, deterministic reconciliation)
  - cell-level proposals, authenticated review, exact invalidation
  - canonical overlay merge, provenance, consumer basis policy
  - first three enrichment schemas with deterministic columns computed server-side
- New: `src/lib/enterprise-data/intake/` — `enrichment-firewall.ts`,
  `enrichment-proposals.ts`, `canonical-overlay-merge.ts`, `enrichment-schemas.ts`,
  `deterministic-recomputers.ts`
- Modified: `canonical-tenant-data-build.ts` (generic column passthrough now refuses
  reserved columns), `csv-source-adapter.ts` (reports the real problem instead of
  `source_field_unmapped`, and excludes reserved columns from mapping coverage)
- Tests: five suites under `tests/behaviors/`, 57 assertions

## QA / Validation

- `npx jest tests/behaviors/enrichment` — 57 passed, 5 suites
- `npx jest tests/behaviors src/lib/enterprise-data` — 299 passed, 34 failed; the same 34
  fail on the unmodified base commit. They belong to the in-flight tenant-inventory purge,
  not to this change. Verified by stashing only the two modified files and re-running.
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p tsconfig.json` — clean.
  The larger heap matters: at the default size the compiler exits without printing, which
  reads as success.
- `npx eslint` over all changed paths — clean
- Two defects were found by tests during the build and fixed:
  - an unparseable interface count banded as "isolated", because stripping non-digits
    turned an unreadable value into `Number("") === 0` — asserting a system had no
    integrations
  - a deterministic column declared with no implementation was silently omitted, leaving
    the workbook's own submitted value as the only candidate
- Not yet validated: no overlay has been produced from a real workbook, so the parser has
  not met model output. That is the proof step in a later release.

## Rollout Plan

Merge to main. No image build, no ACA deploy, no migration, no flag. Nothing in this
release executes on a request path or a build path until a template declares an enrichment
column, which no template does yet.

## Deployment Authority

Not applicable. This release cannot affect Azure Container Apps, deploy workflows, runtime
images, flags, environment variables, worker jobs, traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: not invoked
- Shared runtime mutators: none
- Approved image digest: n/a — no runtime update
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: no — no user-facing surface changed

## Rollback Plan

Revert the PR. The new modules have no callers outside their own tests, and the two
modified files gain only a refusal branch on columns that no current dataset contains, so
a revert restores prior behaviour exactly. No data migration, no state to unwind.

## Audit Evidence

- PR #6572 and its four commit messages, each stating the failure the change prevents
- Test suites under `tests/behaviors/enrichment*` — the acceptance criteria are written as
  assertions rather than prose, including the loader-path tests that drive a real CSV
  through the adapter
- `docs/governance/INTAKE_ENRICHMENT_AND_APPROVAL.md`
- Base-commit test run demonstrating the 34 unrelated failures pre-date this change

## Known Gaps

Open, in the sequence they are planned:

- No review interface exists. Approval is a function with no operator surface, so no
  overlay can actually be approved by a person yet.
- The consumer basis policy is defined and tested but not enforced at any render path.
  Until it is wired, a future overlay could reach a surface that has not consulted it.
- No freshness or promotion gate. Nothing yet prevents promoting a snapshot whose
  approvals were invalidated after the fact.
- No template declares an enrichment column, and the enrichment prompts have not been run
  against a real workbook.
- One fixture tenant's source files carry topology and join-key problems that must be
  repaired before its snapshot is promoted; enrichment would otherwise be layered over
  known-bad recorded data.
