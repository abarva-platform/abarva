# 2026-07-06-source-analytics-parse-validate — vendor-document parse → candidate facts → human validate → commit

## Release ID

`2026-07-06-source-analytics-parse-validate`

## Status

`candidate`

## Plain-English Summary

The **untrusted intake edge** of the Source value-analytics layer — the counterpart to the
already-merged structured-map extractor (`2026-07-06-source-analytics-extraction`, the "our
templates → facts" path). This slice adds the "vendor documents → **candidate** facts, human-
validated → committed facts" path. A parsed fact is never trusted blind: it is PROPOSED with a
citation `{doc, locator}`, a human confirms / edits / rejects it, and only confirmed/edited
candidates are committed to `source_event_facts` with `source_method = 'parsed'`.

- **`src/lib/source/facts/extraction/parse-validate.ts`** — the candidate-fact model + pure logic:
  - `parseDocumentToCandidates(doc, rules, ctx)` — takes a document already extracted into
    **located text blocks** (`{ text, locator }`, produced upstream — this module never touches
    bytes) plus catalog-typed locator rules, and PROPOSES `CandidateFact[]`. A value must be
    **located in the document with a locator** (regex capture over the block text) or it is **not
    proposed** — no hallucinated numbers. Every candidate's `fact_key` is typed against
    `factSpecByKey` (unknown/mistyped keys are **rejected, not coerced**); the located token must
    coerce to the catalog unit (reusing `coerceNumericCell` from the sibling extractor);
    entity attachment follows the FACT's `entityKind`.
  - `applyValidationDecisions` + `selectCommittableInserts` + `commitValidatedCandidates` — the
    validate → commit path. Confirm keeps the located value; edit overrides the number but
    **preserves the citation**; reject drops it. Only `confirmed`/`edited` candidates are
    persisted (rejected and still-`proposed` are dropped), through the **merged**
    `sourceFactWriteAdapter` seam — no new persistence code.
  - `groundModelProposals` — an audited-egress seam. When a value is worded too variably for a
    regex, an optional Claude-assisted locate step (through the audited egress path in
    `src/lib/integrations/ai-egress`, never a raw provider client) may PROPOSE which block+token a
    value lives in. Every proposal is **re-grounded against the actual document** (the locator must
    exist AND the raw token must literally appear in that block) before it becomes a `proposed`
    candidate a human still validates. The model **locates; it does not invent the number.** Live
    adapter wiring is a follow-on slice; this slice ships the deterministic path + the grounding
    contract.
- **`src/app/api/v1/source/[eventId]/facts/parse/route.ts`** — `POST .../facts/parse`: accepts a
  document reference (located blocks) + locator rules, returns proposed `CandidateFact[]` +
  `rejected` for review. **Dark behind `source_analytics`** (404 `{ error: 'not_found' }` when off,
  matching the ingest route exactly).
- **`src/app/api/v1/source/[eventId]/facts/parse/commit/route.ts`** — `POST .../facts/parse/commit`:
  accepts the human's per-candidate decisions, **re-derives candidates server-side** (re-grounded
  against the document so committed values are never arbitrary client-supplied inserts), applies the
  decisions, and commits only confirmed/edited facts through the write seam. **Dark behind
  `source_analytics`** (404 when off).

## Layer Impact

- `experimental`: both routes are reachable only when `source_analytics` is on (off for all
  tenants) — no default behavior changes.
- `client-data-lane`: the commit route writes to `source_event_facts` (keystone migration
  `20260706120000`, **not run**); tenant-scoped by `client_key`; the write seam rejects
  mixed-tenant batches.
- `global-control-lane`: the `facts/extraction/parse-validate` library (inert until a route is
  called under an enabled flag).

## Client Applicability

- All clients: no behavior change — the flag is off; both routes 404 and nothing calls the parser.
- Specific clients: none enrolled.
- Feature flag: `source_analytics` (default off).

## Changes Included

- `src/lib/source/facts/extraction/parse-validate.ts` + `__tests__/parse-validate.test.ts`.
- `src/app/api/v1/source/[eventId]/facts/parse/route.ts` + `__tests__/route.test.ts`.
- `src/app/api/v1/source/[eventId]/facts/parse/commit/route.ts` + `__tests__/route.test.ts`.
- `docs/releases/records/2026-07-06-source-analytics-parse-validate.md` (this record).

## QA / Validation

- `npx jest` (slice) → **3 suites / 26 tests pass**: parse-validate pure logic (locatable value →
  cited + typed candidate; unlocatable value not proposed; unknown/mistyped key rejected;
  confirm/edit/reject → only confirmed+edited committed; model proposal cannot smuggle an absent
  number) = 15; the two route suites (flag-off 404 with no write, happy path, tenant-fence 404,
  malformed body 400) = 11. **pass.**
- `npx tsc --noEmit` (full project, 8 GB heap) → **0 errors**. **pass.**
- `npx eslint` on changed files → clean. **pass.**
- `node scripts/release-check.mjs --base origin/main --head HEAD` → **pass.**
- Not live-proven: the flag is off; the migration is not run. **inert by design.**

## Rollout Plan

Merge to `main` via PR + squash. Both routes stay dark (`source_analytics` off). Before any tenant
is enabled, the keystone migration `20260706120000_source_event_facts.sql` must be applied via the
ACA VNet db-migrate job, then a live signed-in parse → validate → commit proof captured.

## Deployment Authority

- Repo-owned ACA main deploy per `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: the commit route writes `source_event_facts` — but only under an enabled
  flag (off for all), so no shared runtime behavior ships.
- Migration run path: ACA VNet db-migrate job (keystone `source_event_facts` table, shared with the
  extraction slice).
- Feature/env flag update path: `includeTenants` in registry or
  `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`.
- Live signed-in proof required: when the first tenant is enabled (not this slice — inert).

## Rollback Plan

Revert the PR. The parse-validate library + routes are unreferenced except by the flag-gated
routes; removing them has no runtime effect while the flag is off. The un-run migration is inert.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc, eslint, architecture-rules.
- Doctrine enforced by tests: no candidate without a located citation; catalog typing on every
  candidate; only human-validated (confirmed/edited) facts committed; `groundModelProposals`
  refuses a token not literally present in the cited block.

## Known Gaps

- `groundModelProposals` ships as the **contract** for Claude-assisted location; the live audited-
  egress adapter (calling `callModel` in `src/lib/integrations/ai-egress`) is a follow-on slice.
  The deterministic locator-rule path is fully wired and tested now.
- Vendor-level candidate facts are only proposed by the deterministic rule path (which carries an
  explicit `entityRef`); the model-grounding seam intentionally grounds event-level facts only
  (the model locates a value, it does not decide entity attachment).
- Parsed facts, like structured-map facts, are not yet consumed by the value-lever evaluators at
  runtime — that wiring (orchestrator → waterfall → UI) is the remaining fan-out, each behind
  `source_analytics`.
