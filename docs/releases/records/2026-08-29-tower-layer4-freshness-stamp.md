# 2026-08-29-tower-layer4-freshness-stamp — Layer 4 stamps the freshness the surface reports

## Release ID

`2026-08-29-tower-layer4-freshness-stamp`

## Status

`candidate`

## Plain-English Summary

The Tower header reads `as_of_period` and `refresh_timestamp` off the executive summary row and,
finding neither, reports *"As-of date not recorded · build date not recorded"*. That is honest, and
it is also unnecessary: `as_of_date` is in the Layer 1 package and reaches canonical. It was simply
not carried into the Layer 4 projection.

Layer 4 now stamps both. `as_of_period` comes from the package — the period the figures cover.
`refresh_timestamp` comes from the loader run — when the projection was built.

These are two different facts and neither may stand in for the other. An earlier version of this
surface rendered a `new Date()` evaluated at page render as though it were the age of the data, so
it claimed "refreshed today" on every load regardless of how old the rows were. Stamping a real
build time is what retires that; using it as the reporting period would reintroduce the same lie in
a new place.

An absent period is stamped `null`, never substituted, so the surface can still report a gap.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- **Layer 4 (products):** two fields added to the executive summary payload. No metric, value or
  gate rule changes.
- **App:** unchanged. The reader already looks for both fields.

## Client Applicability

- All clients: yes, once the Layer 4 job re-runs for a tenant.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `scripts/tower/load-healthcare-demo-layer4-products.mjs` — stamp `as_of_period` and
  `refresh_timestamp`; add `builtAt` to the parsed options.
- `scripts/tower/__tests__/run-layer4-freshness-stamp-tests.mjs` (new)
- `package.json` — `test:layer4-freshness-stamp`

## QA / Validation

- `npm run test:layer4-freshness-stamp` → 4/4. The guards that matter: the period comes from the
  package and not the clock; an absent period is `null` with no `||` fallback; the build time comes
  from the loader run; and build time can never be stamped as the reporting period.
- Dry run of the loader → `dry_run_ready`, and both values verified in the emitted SQL:
  `"as_of_period":"2026-08-24"` and a real ISO `refresh_timestamp`.
- `node --check` on the loader → clean.
- `eslint` on both changed scripts → clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` → passes with this record.

## Rollout Plan

Merge to `main` by squash; the deploy workflow builds the image carrying the loader. **The values
appear on the surface only after the Layer 4 job re-runs** for the tenant — via the documented
purge → Layer 3 → Layer 4 sequence, or a Layer 4 load alone if canonical has not changed.

## Rollback Plan

Revert the squash commit. No schema or data change; already-written rows keep the extra payload
keys, which older readers ignore. Reverting returns the header to "not recorded".

## Deployment Authority

- Repo-owned deploy workflow, unchanged. No `az` command in this release.
- Data-plane job: a Layer 4 load, digest-pinned, with
  `--secret-env DATABASE_URL=azure-postgres-control-database-url`.
- Live signed-in proof required: yes — a capture showing a real as-of date in the Tower header
  instead of "not recorded".

## Audit Evidence

- The three-file diff.
- `test:layer4-freshness-stamp` output and the dry-run SQL excerpt above.

## Known Gaps

- Not live-proven; `candidate`. The header keeps saying "not recorded" until the job runs.
- Only the healthcare-demo Layer 4 loader stamps these. Other loaders feeding the same surface will
  still produce rows without them.
- `refresh_timestamp` records when the **projection** was built, not when the client's source data
  was extracted. Those can diverge, and the surface currently presents only the projection's.
