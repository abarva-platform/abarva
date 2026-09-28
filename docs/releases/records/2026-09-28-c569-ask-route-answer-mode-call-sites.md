# 2026-09-28-c569-ask-route-answer-mode-call-sites — Ask route answer-mode call sites, proved per site

## Release ID

`2026-09-28-c569-ask-route-answer-mode-call-sites`

## Status

`candidate`

## Plain-English Summary

The Intelligence Ask API answers a reader's question in eight different places,
depending on what was asked and which surface asked it. Each of those eight
places hands the answer through one shared guard, and each one decides whether
the product may append its own deterministic wording to the model's answer or
must leave the model's words exactly as written. An earlier change proved three
of the eight by running them. The other five were covered by nothing at all, so
nothing would have reported it if one of them had started rewriting a model
answer it is supposed to leave alone.

This change adds a test suite that drives four of those five places through the
real exported route handler and reports on each one separately, and it settles
the fifth by search: no request a reader can make reaches it, because an
identical tenant-safety check earlier in the same handler answers first. Nothing
in the product changed. No behaviour changed for any client.

Two things were measured rather than assumed, and both are recorded here because
they are the kind of claim that is easy to state and hard to check later:

- Before writing a line of the new suite, all eight places were instrumented and
  the earlier suite was run. It enters three of them and no others, which is
  exactly what the backlog item claimed and is now confirmed on current `main`.
- Every new case was deliberately broken to prove it is not blind. Flipping the
  "leave the model's words alone" flag at each place fails exactly the one case
  that answers for that place and no other case.

## Layer Impact

Release lane: **`global-control-lane`** — the change is shared control-plane
tooling (a test suite and its CI step) and is not gated to any client or flag.
It ships for everyone in the sense that it runs on every pull request; it alters
no client-visible behaviour.

- **Products** — Intelligence (the Ask route). Test coverage and CI wiring only;
  no product file changed, so no product surface behaves differently.
- **Canonical model / Client intake / Source adapters** — not touched.

## Client Applicability

- All clients: no behavioural change. The suite is test-only.
- Specific clients: none.
- Internal only: yes — CI coverage.
- Public/demo only: no.
- Feature flag: none added. One existing flag is *read* by the suite's
  reasoning and is documented below, not changed.

## Changes Included

- `src/app/api/intelligence/ask/__tests__/c569-ask-route-answer-mode-call-sites.test.ts`
  — new. Eight cases: one premise check, one case per call site under test, and
  two non-vacuity controls.
- `.github/workflows/intelligence-ask-route-suites.yml` — one new step naming
  the suite by exact file, beside the existing step, for the reason the file's
  own header records.

Nothing else. The route is unchanged; `git diff` over
`src/app/api/intelligence/ask/route.ts` is empty, verified after every mutation.

## QA / Validation

**Which call sites the earlier suite reaches — measured, not read.** All eight
call sites were instrumented with a marker and the earlier suite was run. It
enters sites 419, 874 and 1417, and no others. The five the item names as
undriven — 550, 668, 785, 1079 and 1581 — were reached by nothing. The
instrumentation was removed afterwards and the route confirmed byte-identical.

**Per site, never in aggregate.** An aggregate count of sites covered is what
let five hide behind three, so each row is its own case with its own identifying
assertion on the packet the route emits.

| site | location | side of the opt-out | how the case identifies the site | verdict |
|---|---|---|---|---|
| 550 | `route.source_contract_optimization_export.answer` | opts out | packet `intent` is `source_contract_optimization_export`; no other site composes it | driven, absence asserted |
| 668 | `route.source_visual.agent_answer` | opts out | packet `intent` is `source_contract_visual` | driven, absence asserted |
| 785 | `route.home_know_tenant_fence.answer` | applies | not reached by any request — see below | unreachable, pinned |
| 1079 | `route.sentinel.agent_answer` | opts out | a `classified` event with the Sentinel intent and an `ava-stage` precede the packet | driven, absence asserted |
| 1581 | `route.agent_answer.exhibits` | opts out | packet carries no `decisionFrame` and is not the tabbed intent | driven, absence asserted |

**Site 785 is reached by no request, and that is a finding rather than a gap.**
Its guard is a two-part disjunction and both parts are answered by reading the
handler rather than by sampling one request. The first part compares the aliases
of the resolved tenant against the aliases of the requested tenant, but the
requested key *is* the resolved tenant's own key — the same object under another
name — so the overlap always holds and the negation is always false; when no
tenant resolves, the guard's own length check fails instead. The second part is
the identical cross-tenant predicate the handler already ran at site 419 over
the same four values, and that site returns first. So whenever the second part
would be true, site 419 has already answered.

Two cases pin that, and the second exists so the first is not vacuous: a
Home-tab request naming another tenant is answered with the *Intelligence*
wording, which only site 419 can produce for that request shape, and the *Home*
wording the first case excludes is shown to be reachable at site 419 too when
the request declares the Home module. Deliberately disabling the site 419 guard
fails the first case and leaves the second passing — the asymmetry that shows
the first case is doing the work.

**Site 1581 is reachable, but only under a condition worth recording.** With the
companion-canvas flag off — and its registry entry declares an empty tenant
list, so it is off for every tenant unless an environment list names one — the
handler injects any missing companion card and derives the main answer from a
helper that never returns empty. So an ordinary answer always arrives at the
tabbed site with at least one card and a non-empty main answer, and the tabbed
site takes it. The only way past it is a model answer that already satisfies the
card mandate while beginning at its first card marker, which leaves the main
answer empty. The suite drives exactly that, and a companion case shows the same
question with an ordinary model answer landing at the tabbed site instead.

**Six mutations, six caught, one-to-one, each verified with
`git diff --numstat` to have changed the file before the run** — because a
no-op mutation reads exactly like a caught one:

| mutation | case that failed | other cases affected |
|---|---|---|
| site 550 stops preserving model output | the site 550 case | none |
| site 668 stops preserving model output | the site 668 case | none |
| site 1079 stops preserving model output | the site 1079 case | none |
| site 1581 stops preserving model output | the site 1581 case | none |
| site 1417 stops preserving model output | the tabbed-site control | none |
| the site 419 cross-tenant guard is disabled | the site 785 case | none |

Each run reported `1 failed, 7 passed, 8 total`, so no mutation was absorbed by
a second case and none of the four opting-out sites shares a case with another.

**Baselines, measured over the same scope from a separate clean worktree at the
base rather than from a stash:**

- `src/app/api/intelligence/ask/__tests__` — 4 suites / 45 tests / 0 failing
  before; 5 suites / 53 tests / 0 failing after.
- The new suite does not exist on the base, so its own before-count is not a
  number: 1 suite / 8 tests / 0 failing after.
- `src/__tests__/behaviors/product-directory-ci-coverage.test.ts` — 4 passed.
  The directory was already named in CI, so the census baseline is unchanged and
  no coverage floor is charged: the suite is not in `src/__tests__/behaviors`,
  which is the directory the behaviour coverage floor runs under `--coverage`.
- `npm run audit:named-suite-requiredness` — OK, 21 directories swept by a
  required job; no required job sweeps this directory, so naming the file in a
  non-required job is how it runs at all.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  exit `0`, judged by exit code rather than by grep.
- `npx eslint` on the new file — 0 errors, 0 warnings.

**Boundaries, reviewed on the same terms as the sibling route suites.** The
retrieval-and-model pipeline, Clerk, the Maestro person, tenant resolution,
session memory, Sentinel intent and reasoning, and synthesis telemetry are all
replaced, as they are in the sibling suites. One seam is new to this file: the
governed Source answer-context assembly, which checks tenant access and reads
the Source read models — an auth-and-data boundary the two Source sites cannot
be reached without. The answer-mode helpers are deliberately NOT replaced; they
are the subject, and a suite that replaced them could not fail when the route
stopped calling them. Nothing in the suite can reach Postgres, a model, or an
outbound send.

**Observed, not fixed, and asserted neither way.** On the exhibits site the
packet's direct answer still carries the raw companion-card markers from the
model's own output, because that site composes its answer from the unsplit text.
A reader would see `<<<TAB: ...>>>` in the answer body on that path. It is a
product question about which text that site should compose from, it is not this
change's to take, and no case here asserts either the presence or the absence of
those markers.

## Rollout Plan

Merge to `main`. Test-only, so there is no runtime rollout, no image change, and
no flag change. The repo-owned deploy workflow will build and deploy the merge
commit as it does for every merge; that deploy carries no behavioural change
from this record.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is part of this change.
- Approved image digest: not applicable — no runtime image behaviour changes.
- ACA runtime invariant: to be proven after the merge deploy as standard
  practice, not because this change alters the runtime.
- Worker image invariant: unaffected.
- Feature/env flag update path: none. The companion-canvas flag is read for
  reasoning and is not modified.
- Live signed-in proof required: **no.** No product file changed, so there is no
  client-visible surface to prove.

## Known Gaps

- **Site 785 is pinned, not covered.** No case executes that call site, because
  no request reaches it. If the handler's tenant resolution is ever changed so
  the resolved and requested keys can differ, or the site 419 check is narrowed,
  the site becomes live and needs a case of its own. The two cases here fail if
  either of those facts stops holding, which is the closest thing to coverage an
  unreachable branch can have.
- **The exhibits site is covered on one reachable shape only.** The suite drives
  the shape reachable with the companion-canvas flag off. The same site is also
  reachable with that flag on for a tenant, and no case drives that
  configuration; the flag's registry entry declares an empty tenant list and the
  summary says to leave it off, so this is the state the product is in rather
  than a shape being skipped.
- **The raw companion-card markers in the exhibits site's answer body are
  observed and left alone.** See the note under QA / Validation. It is a product
  question about which text that site should compose from, and no case here
  asserts it either way.
- **No signed-in proof is owed or claimed.** No product file changed. This
  record does not assert a post-deployment signed-in check, and none is owed.

## Rollback Plan

Revert the single squash commit. The suite and its CI step are additive, so a
revert removes coverage and changes no product behaviour. No migration is
involved.

## Audit Evidence

- The pull request for this branch, with the per-site and per-mutation tables
  above reproduced in its body.
- The CI run of `Intelligence Ask route suites`, whose two steps name the
  earlier suite and this one by exact file.
- The suite itself: every expected string is derived from the answer-mode
  registry at run time rather than copied, so a registry edit moves the
  expectation with it.
