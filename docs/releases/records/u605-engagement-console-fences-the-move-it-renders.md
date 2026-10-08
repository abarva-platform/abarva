# u605 — The engagement console fences the Move it renders

## Release ID

`2026-10-08-engagement-console-tenant-fence`

## Status

`candidate`

## Plain-English Summary

The engagement console at `/engagements/[engagementId]` is a live Strategic
Moves surface — the path lights the Moves nav tab in both chromes. It loaded
the Move it renders by id alone. No client column was named in the query, the
data-plane compat client it reads through is not a per-request session so no
row-level policy narrowed it, and the route group's layout guards only the
responsible-AI acknowledgment and training. Any signed-in user who held an
engagement id therefore rendered that Move's console — its name, sponsor,
charter, phase rail, deliverables, topics, contradictions and recent turns —
whether or not the Move belonged to their own tenant.

Every sibling Moves surface already fences. The phase workspace resolves the
signed-in tenancy context; the program read path loads through a query that
filters on the tenancy client id. This console was the one that did not.

The fix adds the tenancy half of that fence, and only that half. A new module
decides the question and refuses in exactly one state: both the Move and the
request record a client, and the two differ. Two states deliberately fail open,
because refusing them would withdraw a surface that works today on something
other than evidence of a cross-tenant read — a Move that records no client (as
seeded and legacy rows do, and a null is not a different tenant), and a request
whose client did not resolve (the same helper throws for an unauthenticated
session, a missing active client and a lookup outage alike, and an outage must
not read as a mismatch).

A refusal is answered with the same not-found the console already gives an id
that resolves to no Move, so an id belonging to another tenant cannot be told
apart from one that does not exist and the surface confirms nothing.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior that applies to
every client and is not feature-gated.

- **Layer 4 (Products · Moves).** The engagement console refuses to render a
  Move recorded against a different client. No projection, read model or
  canonical object changed; this is a read authorization condition on one
  product surface.
- **Layer 3 (Canonical model).** Unchanged in substance. `EngagementRow` now
  declares the `client_id` column it has always carried — the loaders
  `select('*')`, so the field was present at runtime and merely undeclared,
  which is why the page previously issued a second query to read it.

Deliberately NOT changed: the per-Move authorization roster. The canonical
fenced loader applies tenancy *and* per-Move RBAC together; routing the console
through it would have added an authorization condition the page never had, and
a user whose roster does not list the Move would have lost a surface that works
for them today.

## Client Applicability

- All clients: yes — the fence applies to every tenant on the shared surface.
- Specific clients: none.
- Internal only: no. Operator sessions resolve their active client the same way
  every other fenced surface resolves it, so switching active client continues
  to work.
- Public/demo only: no.
- Feature flag: none. A read fence behind a flag is not a fence.

## Changes Included

- `src/lib/programs/engagement-tenant-fence.ts` — new. The decision, its four
  named outcomes, and the reasoning for the two that fail open.
- `src/app/(maestro)/engagements/[engagementId]/page.tsx` — resolves the
  tenancy client, asks the decider, answers a refusal with not-found. Placed
  before the canonical-path redirect, because redirecting on a Move the caller
  may not read would confirm that the Move exists.
- `src/lib/db/engagement.ts` — `EngagementRow` declares `client_id`.
- `src/lib/programs/__tests__/engagement-tenant-fence.test.ts` — new, 16 cases.
- `src/lib/programs/__tests__/engagement-console-tenant-fence-wiring.test.tsx`
  — new, 7 cases, hosting the page itself.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__/engagement-tenant-fence.test.ts
  src/lib/programs/__tests__/engagement-console-tenant-fence-wiring.test.tsx` —
  23 of 23.
- **PASS** `npx jest src/lib/programs/__tests__` — 175 suites, 2269 tests, the
  whole swept directory, no sibling regressed.
- **PASS** Mutation proof, 6 designed mutations, **6 of 6 killed**:
  removing the page's fence call (2 cases — this is the proof the host asks the
  decider rather than the decider merely being correct in isolation); inverting
  the client comparison (10); refusing an unrecorded Move client (7); refusing
  an unresolved request client (5); dropping case normalisation (1); dropping
  whitespace normalisation (2). Baseline green before and after.
- **PASS** Two vacuity defects found and fixed during that proof, both of the
  kind that leaves a green suite meaningless. The host helper swallowed every
  error but the not-found signal, so a failed module import would have returned
  "did not refuse" and passed three cases; it now rethrows and asserts the page
  produced a tree. And the fixture ids were digits only, so the
  case-normalisation mutation survived because `toUpperCase()` was a no-op on
  them; the ids now carry hex letters, and that mutation is killed.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` — exit 0, no diagnostics.
- **PASS** `npx eslint` on all five changed source files — exit 0.
- **PASS** Census regenerated honestly: `coveredTestFiles` 2693 → 2695 for the
  two new files, `uncoveredTestFiles` 164 unchanged, which is the proof both
  land in a directory a merge can fail on. `census drift: committed census
  matches this run`.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** Live signed-in walk. Out of this lane's authority; see Known Gaps.

## Rollout Plan

Merge to `main`. The change is served by the existing repo-owned ACA main
deploy workflow with no separate step — no migration, no flag, no env var, no
worker job, no traffic shift.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This release runs no Azure command.
- Approved image digest: not applicable — no runtime update is performed here.
- ACA runtime invariant: unchanged by this release; the main deploy workflow
  asserts it as usual.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: none; no flag is introduced.
- Live signed-in proof required: **yes** — see Known Gaps.

## Rollback Plan

Revert the merge commit. No migration, no data write and no flag state is
involved, so the revert is complete on its own and restores the prior read
behaviour exactly. If a narrower rollback is wanted, replacing the page's
`engagementReadIsCrossTenant(...)` condition with `false` disables the fence
while leaving the module and its tests in place.

## Audit Evidence

- The PR for this branch and its CI run.
- The mutation table above, reproducible from the two suites named in it.
- The census delta (+2 covered, uncovered unchanged) in
  `docs/architecture/test-ci-coverage-census.json`.

## Known Gaps

- **Not `live-proven`.** No signed-in walk has been performed. This release is
  `candidate`: merged and deployable, not proven on the live surface. A walk
  must confirm two things — that a user reading a Move of their own active
  client still renders the console unchanged, and that a Move of a different
  client now answers not-found. The first of those is the regression risk worth
  checking first, because this fence sits on the surface the demo walk uses.
- **The per-Move authorization half is deliberately not added here.** The
  console still applies no per-Move roster check, so a user of the owning
  tenant reads any of that tenant's Moves. Closing that is a separate decision:
  it would withdraw access that works today, and it needs a product call on who
  may read which Move rather than a code fix.
- **Other unfenced reads on this page are not audited by this release.** The
  fence refuses before the page's downstream queries run, so a refused read
  reaches none of them; whether each of those queries would fence correctly on
  its own was not measured.
- **The page's second `client_id` query is now redundant** — the engagement row
  carries the column and the type declares it. Left in place to keep this
  change to the fence; removing it is a tidy-up, not a fix.
