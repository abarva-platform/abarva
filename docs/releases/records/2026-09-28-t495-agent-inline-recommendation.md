# 2026-09-28-t495-agent-inline-recommendation — Rewrite one source-text scanner suite as behaviour, and wire it

## Release ID

`2026-09-28-t495-agent-inline-recommendation`

## Status

`candidate`

## Plain-English Summary

One test suite checked the inline "Agent recommendations" card by reading its
source as text: it looked for a data attribute, the word `aria-label`, the
absence of `useState`, and an import path in the component, and it stripped the
view module's strings and comments and grepped what was left for `Date.now`,
`Math.random` and `fetch`. Its builder cases were real, but every one of them
ran over the built-in seed, in which all four recommendations are critical or
high priority. So nothing ever exercised a medium- or low-priority
recommendation — the quiet row, the missing urgent chip, the lower confidence.
The suite was green and ran in no workflow.

All 42 cases are replaced by 27. The view builder now runs both over the real
seed and over recommendations each case supplies, so every priority is checked
for its label, confidence and urgency, and the card's urgent flag is checked
for "any" rather than "all". The card is rendered: one row per recommendation
with its action, rationale, priority, state and confidence; the urgent chip
only when something is urgent; the navy accent only on urgent rows; the
supplied view rather than the seed; an empty-state line when there is nothing
to show; and the disclaimer always. The "no hooks, no clock, no randomness"
rules are now checked by behaviour — the component is called outside any
render, and the builder is run under a moved clock with the random-number
generator and the network made to throw.

The suite now runs in CI. It never did.

## Layer Impact

Release lane: `internal-admin` — test and CI governance. No product surface,
tenant dataset or runtime artifact is touched.

- **Layer 4 (Products) — no behaviour change.** No product file changed.
- **Test and CI governance.** One suite changes classification from
  source-text scanner to behavioural, declared in a new triage record so the
  repository's scanner-wiring control resolves it from the latest record
  rather than from the historical draw. That control's anti-vacuity floor is
  lowered in the same change, because this discharge took the live count
  below it.

## Client Applicability

- All clients: no runtime change reaches any client.
- Specific clients: none.
- Internal only: yes — CI and test governance.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/integration/agents/agent-inline-recommendation.test.ts` — 42
  cases (seven reading the component file, five grepping the view module)
  replaced by 27 behavioural cases. The builder's one input,
  `buildAgentMissionPanelSeedView`, is wrapped so the real seed flows through
  unless a case supplies its own missions. The component is rendered in jsdom
  with Testing Library.
- `.github/workflows/integration-suites.yml` — the suite is added by exact
  file path to the existing per-file agents step. Named individually because
  its directory still holds one red suite and three more scanners.
- `docs/architecture/t495-agent-inline-recommendation-triage.json` — the
  triage record: the rewrite, its eighteen mutations, what was dropped and
  why, and its residuals.
- `src/__tests__/behaviors/t770-scanner-wiring-refusal.test.ts` — the
  live-scanner floor goes from 25 to 20. The live count was 25 on the base and
  is 24 after this change, so the floor went red because the corpus improved.
  The floor exists to catch a resolver change that empties the set; 20 still
  does that, and leaves room for T-495's three remaining planned discharges.
  The comment records both measured counts.
- `docs/architecture/test-ci-coverage-census.json` — refreshed with the repo's
  own writer; `--check` matches.

## QA / Validation

- Suite: 42 of 42 passing on the base `64abe65ea2` (green, over source text);
  27 of 27 passing after.
- `src/__tests__/integration/agents` as a directory: 1 failing suite / 18
  failing tests of 335 on the base; 1 / 18 of 320 after. The remaining red
  suite is another item's and is untouched; the total falls by 15 because 42
  cases became 27.
- `src/__tests__/behaviors`, measured in a separate clean worktree at the base
  and again on the branch: 154 suites / 1671 tests / 0 failing on both sides.
- Eighteen mutations (nine against the view module, nine against the
  component), each confirmed by `git diff --numstat` to have changed the file
  before any suite ran: the new suite caught **18 of 18**. The deleted suite,
  restored beside it, is 0 of 42 failing on the base; it caught 6 and missed
  12, including a medium recommendation raised as urgent, three of four rows
  silently not rendered, the urgent chip shown on a quiet queue, the supplied
  view ignored, and a hook added to the server component.
- The scanner-wiring control (`t770-scanner-wiring-refusal`) was proven to
  refuse this wiring: with the workflow step extended and the triage record
  absent it fails 2 of 7 and names this suite. With the record present and the
  floor lowered, it and `t492-stale-suite-triage-record` pass 28 of 28.
- `check-integration-ci-visibility`: 1 changed suite registered in CI.
- `test-ci-coverage-census --check` matches the committed census.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`:
  exit 0. `eslint` on both changed test files: exit 0.

## Rollout Plan

Merges through the normal PR path. The repo-owned ACA main deploy workflow
builds and rolls the image as for any merge; the image carries no product
change from this PR.

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

Revert the squash commit. That restores the file-reading suite, removes it
from the workflow step and puts the floor back at 25. No data, flag or runtime
state to unwind.

## Audit Evidence

- Triage record: `docs/architecture/t495-agent-inline-recommendation-triage.json`
  (mutations, deleted-suite comparison, dropped cases with reasons).
- Backlog item: `T-495`, claimable half, suite 8 of 11.

## Known Gaps

- `AgentInlineRecommendation` is imported by nothing outside its own test —
  no route and no other component mounts it — so these cases prove what the
  card renders, not that anyone sees it. Delete-versus-mount is a product call
  and not taken here.
- The `"use client"` absence case is dropped without a direct replacement: a
  directive changes neither what the card renders nor whether it can be called
  outside a render. The hook-free case covers the property it stood for.
- No signed-in proof is owed: no product file changed.
