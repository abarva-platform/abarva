# 2026-09-28-t495-agent-hidden-drawer — Rewrite one source-text scanner suite as behaviour, and wire it

## Release ID

`2026-09-28-t495-agent-hidden-drawer`

## Status

`candidate`

## Plain-English Summary

One test suite checked the agent-activity hidden drawer partly by reading two
source files as text: it grepped the component file for attribute spellings,
import lines and the absence of `useState`, and grepped the view-model file for
the absence of `Date.now`, `Math.random`, `new Date` and `fetch`. It passed. It
also stayed green through eight of ten deliberate breakages — a badge rendered
for an inactive agent, the component ignoring the view it was handed, the
honest disclaimer removed, and even a plain `Date.now()` added to the view,
which its own "does not call Date.now" case missed because its
string-stripping pattern ran across lines and erased the call.

Those fifteen text cases are deleted, not repaired with tighter patterns.
Thirteen cases replace them that render the component and run the builder: the
drawer renders its marker, collapsed state, label, priority badge, disclaimer,
portfolio line and one badge per active agent; it renders a view it is given
rather than the default; it works as a server component with no React runtime;
and the view is identical under two different clocks and random streams, never
calls the network, and derives its panel and portfolio counts from the modules
it names. The 36 cases over the view builder were already sound and are kept
unchanged.

The suite also now runs in CI. It never did.

## Layer Impact

Release lane: `internal-admin` — test and CI governance. No product surface,
tenant dataset or runtime artifact is touched.

- **Layer 4 (Products) — no behaviour change.** No product file changed.
- **Test and CI governance.** One suite changes classification from
  source-text scanner to behavioural, declared in a new triage record so the
  repository's scanner-wiring control resolves it from the latest record
  rather than from the historical draw.

## Client Applicability

- All clients: no runtime change reaches any client.
- Specific clients: none.
- Internal only: yes — CI and test governance.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/integration/agents/agent-hidden-drawer.test.ts` — fifteen
  file-reading cases deleted; thirteen behavioural cases that render
  `AgentHiddenDrawer` with `react-dom/server`, call it with no React
  dispatcher, and run `buildAgentHiddenDrawerView` under fake clocks, a
  mocked `Math.random` and a throwing `fetch`. The 36 builder cases are kept
  byte-for-byte.
- `.github/workflows/integration-suites.yml` — one step naming the suite by
  exact file path, in the same change as the rewrite. Named individually
  because its directory holds two red suites and five more scanners.
- `docs/architecture/t495-agent-hidden-drawer-triage.json` — the triage record
  declaring the rewrite, its mutations and its residuals.
- `docs/architecture/test-ci-coverage-census.json` — refreshed with the repo's
  own writer. It also absorbs two unrelated test files of drift that were
  already on the base (see Known Gaps).

## QA / Validation

- Suite: 51 of 51 passing on the base (fifteen of them file-reading); 49 of 49
  passing after.
- `src/__tests__/integration/agents` as a directory, from a separate clean
  worktree at the base: 2 failing suites / 23 failing tests of 324 before,
  2 / 23 of 322 after — the same two red suites, untouched; the −2 is this
  suite's 51 → 49.
- The new CI step, run locally with its exact arguments: absent before; 1 suite
  / 49 tests / 0 failing after.
- `src/__tests__/behaviors`: 154 suites / 1671 tests / 0 failing on both sides.
- Scanner-wiring control: with the workflow step added and the triage record
  absent, `t770-scanner-wiring-refusal` fails 2 of 7 and names this suite; with
  the record present it passes 7 of 7.
- Integration CI-visibility gate: 1 changed suite registered in CI.
- Ten mutations — six against `src/components/agents/AgentHiddenDrawer.tsx`,
  four against `src/lib/agent/agent-hidden-drawer-view.ts` — each confirmed by
  `git diff --numstat` to have changed the file first: all ten caught by the
  new suite. The deleted suite, run against the same ten, caught two and
  missed eight.
- `tsc --noEmit` exit 0; `eslint` on the suite exit 0;
  `node scripts/release-check.mjs` exit 0.

## Rollout Plan

Merge through the normal PR path. The suite runs in the Integration suites
workflow on the next pull request that touches its paths.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on
  merge as usual; nothing here changes what it builds.
- Shared runtime mutators: none. No `az` command, Container App, revision,
  traffic weight, flag or environment variable is touched.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: unchanged by this release; it is read after merge and
  reported with the deploy, not claimed here.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing reaches a product surface.

## Rollback Plan

Revert the squash commit. That restores the file-reading cases and removes the
workflow step; no data, schema or runtime state is involved.

## Audit Evidence

- Triage record: `docs/architecture/t495-agent-hidden-drawer-triage.json`
  (mutation table, including what the deleted cases missed).
- Backlog item: `T-495`, claimable half, suite 6 of 11.

## Known Gaps

- `src/__tests__/integration/agents` still cannot be wired as a directory: two
  of its suites are red on the base and five remain scanners.
- Observed and not changed here: `AgentHiddenDrawer` is imported by no route or
  component, so no user sees it today. The suite proves what it renders, not
  that it is mounted. Keeping or removing it is a product call.
- The committed coverage census on the base was two test files behind the
  tree. The refresh here includes that unrelated drift as well as this
  change's own movement.
- Five suites remain in T-495's claimable half; the gated rows are untouched.
