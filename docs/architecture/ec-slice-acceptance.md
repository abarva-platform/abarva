# Non-Serving Context Slice Acceptance

Status: implementation in progress. No product or tenant-data activation.

## Decisions

- A1: admit `capability` and `initiative` as catalog objects; map a declared role to `persona`. A string initiative attribute is not an object. Preserve narrower semantic types when sharing a physical grain.
- A2: registered v3 remains the default intake authority. This slice accepts only the explicitly declared private candidate contract, not an alias for any production workbook. Source owners, native namespaces and per-field locators travel with each assertion. Compound values remain intact. Production owner ratification remains owed.
- A3: schema and test fixtures run only in disposable loopback Postgres. No shared database, ACA Job, serving selection, tenant refresh, or production migration is authorized by this slice.

## Architecture Boundary

Layer 1 is source-owner intake; clients supply native exports and declare authority. Layer 2 emits typed, source-linked objects, assertions, measurements and edges. Layer 3 owns identity, relationships and deterministic evaluations. Products remain unchanged projections. No model generates facts or numeric results. This slice changes no presentation or product reader.

## Progress Denominator

Twelve steps: decisions; clean worktree; semantic map; isolated schema delta; unsigned manifest and release record; pure adapter; rules and invalidation; isolated physical proof; advisory readiness; V6 shadow comparison; release gates and merge; final acceptance. Report completed steps separately from partial work and gates. Implementation progress is not product or data readiness.

## Proven

- Fresh branch from committed `origin/main`; unrelated primary-checkout changes left untouched.
- Current baseline already defines `ecl_source.source_file`, `source_record`, `document`, `document_extraction` and `ecl_review.review_event`. The older claim that these exist only in a draft is not current.
- Final schema draft applies twice to a fresh disposable database with zero source records, objects and assertions. Unknown source receipt times stay null rather than using the current clock.
- Pure adapter compatibility against both frozen private builds passes in memory with identical outputs. This is not persistence or load approval; the private producer is unchanged.
- 53 pure contract tests and 236 focused rule/governance tests pass locally. The Home ratchet has no movement from its existing baseline. Full corpus governance, manifest validation and all 11 release checks pass. Typecheck and focused lint pass.
- Canonical assertions without source access scope explicitly retain `unknown`/`deny`. All adapter rows parse as governed objects, block, and remain excluded under strict and non-strict bundle options.
- Generic-only physical proof passes on local Postgres 18: 23 objects, 15 relationships, three logical applications, one module and four deployments; independent raw-byte object/edge/payload reconstruction; occupied-assessment replay refusal; non-owner/non-BYPASSRLS tenant reads; cross-tenant endpoint foreign-key rejection; exact V6 shadow identity comparison. Source excerpts remain unverified. Product projection counts are unchanged. Postgres 16 CI evidence is pending.
- The shadow records name their actual origin `ecl_context_object`, rather than mislabeling them as V6 business records. The corresponding enum extension is disposable-only.
- Typed assertion references resolve to canonical UUIDs, while original source references remain in lineage. Capability and Initiative retain separate catalog grains. The actual application reader view is tested, not only object table filters.
- Rehearsal rules live under `scripts/ecl`, not an unreachable product library. The library-orphan gate remains unchanged. Non-UTC QA calendar conversion abstains until separately admitted. Unknown earlier assertion-table drafts are refused, not silently upgraded.

## Still Owed

Final independent adoption review, Postgres 16 CI and merge evidence remain pending. Full private-package persistence is not proven by the generic fixture. Production migration, source-owner review, signed declaration and exact-version load approval, indexing, retrieval, serving approval and signed-in browser proof are outside this slice. No unsigned draft may enter the active dataset registry.

An extra audit found defects in the private producer's temporal selection, scope revision identity, QA guards and qualifier checks. The new integration has targeted guards and tests; that does not retroactively correct the producer or grant authority to load its output. Its private dataset remains held and unchanged. Test-fixture proof is separate from admission of a governed dataset.

The private contract enumerates eight result states although the brief calls them seven. Keep `not_comparable` distinct from `unknown`; do not erase a state to match the prose count.
