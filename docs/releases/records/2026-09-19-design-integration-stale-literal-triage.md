# 2026-09-19-design-integration-stale-literal-triage — Design integration directory: triage the red suites, then wire it

## Release ID

`2026-09-19-design-integration-stale-literal-triage`

## Status

`candidate`

## Plain-English Summary

One directory of design regression tests had four of its seven files failing, thirty
assertions in total, and no workflow ever ran it. Every one of the thirty turned out to
be the same thing: the test was holding the product to a literal that a deliberate change
had since moved — a retired page path, a superseded font name, a ticket id in a comment,
a module that stopped being the canonical one. None had found a product defect.

They are repaired the same way throughout: each expectation is now derived from the
authority the product code itself consults, so the next rename or retirement travels into
the test instead of arriving as a false defect. Where that was not possible without
answering a product question, the question is recorded for the owner rather than answered
by editing one list to match another.

The repair widened what the directory actually checks rather than narrowing it. The
largest suite used to name twenty-one route files by hand; it now enumerates the route
tree, which is ninety-four pages under the same roots, so a page added tomorrow is covered
the day it lands. The directory is green and is now wired into CI, where it had never run.

## Layer Impact

Release lane: `global-control-lane` — shared CI and test tooling for all clients, behind no
feature gate. No client-scoped data-plane path is touched.

- **Products:** none. No route, component, prompt, schema, API or data-plane path changed.
- **Test / CI tooling:** four integration test files rewritten or amended; one workflow
  command gains one directory; the coverage census refreshed.

## Client Applicability

- All clients: no behaviour change.
- Specific clients: none.
- Internal only: yes — CI coverage and test correctness.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/integration/design/abarva-nav-shell-alignment.test.ts` — hand-written page
  inventory replaced by enumeration of the canonical route roots; the "every page imports a
  canonical shell" check replaced by one that resolves the Next.js layout chain; a
  nav-destination check added; every enumeration guarded against returning nothing.
- `src/__tests__/integration/design/abarva-ui-primitives.test.ts` — the body-font and
  agent-list assertions stop pinning superseded literals; the canonical logo import path is
  derived.
- `src/__tests__/integration/design/admin1-foundation.test.ts` — the layout font assertion
  now reads the family from the theme and asserts the stylesheet declares it.
- `src/__tests__/integration/design/app-shell-brand-lock.test.ts` — the ticket-id comment
  assertion replaced by properties of the component product code declares canonical.
- `.github/workflows/integration-suites.yml` — `src/__tests__/integration/design` added to
  the green directory command.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.

## QA / Validation

Baseline taken by execution on the pristine checkout at the exact base commit
`4dd5fafb2fdbb041821f33479558df0b397640e3` before any edit, same command both sides.

- **Item scope**, `npx jest src/__tests__/integration/design`:
  **4 failed of 7 suites, 30 failed / 249 passed of 279 tests → 0 failed of 7 suites,
  490 passed of 490.** The test count rises because enumeration covers 94 pages where the
  literal list named 21.
- **The wired CI step**, run verbatim from the workflow file:
  **167 passed of 168 suites, 4,822 passed of 4,842 tests**, same single pre-existing skip.
- **Coverage census**, measured with and without the one-line wiring so the delta is
  attributable: test files run by a workflow **873 → 880** (+7, exactly the seven design
  suites); directories with no coverage **365 → 364**. The committed census was already
  stale by +5/-4 before this change, from merges that landed after it was last written;
  refreshing it folds that in, and the +7 above is the part this PR caused.
- `npm run test:behaviors`: 44 suites / 448 tests, 0 failed.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
  `tsconfig.tsbuildinfo` removed first: **exit 0**, judged by exit code, zero lines of output.
- `npx eslint src/__tests__/integration/design`: exit 0.
- The directory-collision guard `integration-directory-ci-coverage.test.ts`: 13 passed. The
  new path pattern selects exactly the seven design suites and nothing else, confirmed with
  `--listTests`.

**Eight mutations, eight caught**, with the control passing again after each revert:

| Mutation | Result |
|---|---|
| Page enumeration made to resolve nothing | 6 failed — the anti-vacuity cases |
| `<AppChrome>` mount removed from the group layout | 94 failed |
| Banned token added to a real page | 1 failed |
| Hand-coded wordmark added to a real page | 1 failed |
| A nav href pointed at a route that does not exist | 1 failed |
| Canonical logo component repointed at the module with no product importer | 1 failed in each of three suites |
| An agent name declared with no accent entry | 1 failed |
| Theme display face renamed without updating the stylesheet | 1 failed in each of two suites |

The chrome mutation is the one worth reading. The check was first written as a substring
scan for the shell symbol anywhere in the layout file, and it **survived** its own
mutation: removing the `<AppChrome>` mount left the import statement and a comment
mentioning another shell symbol behind, and both satisfied the scan. It was rewritten to
match the JSX opening tag before it counted as a control. The same class of weakness is
already recorded against the route-ownership map.

The canonical-logo mutation is the second. Repointing the declaration at the orphan copy
was caught in two suites but **not** in the third, because every brand assertion there was
satisfied by either of the two near-identical modules. A case was added asserting the
declared component has at least one product importer — a declaration naming a module
nothing imports is a declaration about nothing — and that case alone now catches it.

## Rollout Plan

Merge to `main`. The repo-owned ACA workflow builds and deploys on merge as usual. No
migration, no flag, no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none.
- Approved image digest: produced by the main deploy run for the merge SHA.
- ACA runtime invariant: to be proven after merge with
  `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: same run.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no** — four test files, one workflow line and one
  generated census. No product code path changed.

## Rollback Plan

Revert the PR. The only runtime-visible effect is that one CI step stops running seven test
suites again; nothing a user can reach is affected.

## Audit Evidence

- The PR, its checks, and the CI job log for the integration-suites step showing the seven
  design suites executing on a real runner.
- The before/after figures above, reproducible with the same two commands against the base
  commit and the head.
- The mutation table above, each row reproducible by applying the named edit.

## Known Gaps

Three findings surfaced by this triage are **not** fixed here, because each needs an owner
decision and the rule is not to guess:

1. **Two `AbarVaLogo` modules exist.** Product code declares one canonical; the other has
   no product importer and is reached only from tests. Whether it is retired or kept is a
   retire-versus-repair decision.
2. **Two agent-name lists disagree.** The design theme declares five agent names; the
   cross-surface consistency module declares four. Whether the fifth is a canonical agent is
   a product question. The tests now hold both lists to the properties that are true either
   way rather than picking a side.
3. **One suite still asserts against the module with no product importer** in a single
   passing case. Left in place pending decision 1, since removing it pre-empts that decision.

All three are recorded in the execution backlog.
