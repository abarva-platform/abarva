# 2026-09-28-t495-agent-mission-panel — Rewrite one source-text scanner suite as behaviour, and wire it

## Release ID

`2026-09-28-t495-agent-mission-panel`

## Status

`candidate`

## Plain-English Summary

The agent mission panel has five variants. They are a compact strip, a right
panel, an inline recommendation, an executive brief and a collapsed drawer.
Three product components mount the panel. Its test suite checked the panel by
reading source as text. It looked for attribute strings, the literal
`view.honestDisclaimer` and `aria-expanded="false"` in the component file. It
also banned `useState`, `Date.now`, `fetch`, `<img`, emoji and some import
paths in both files. 28 of its 41 cases did this, and none of them rendered the
panel. So a right panel that quietly dropped a mission would pass, and so would
a variant that dispatched to the wrong layout or a stat that read the wrong
count. The suite was green and ran in no workflow.

The 13 cases that already called the view builder are kept unchanged. The 28
text cases are replaced by 28 behavioural cases:

- Every variant is rendered, over missions each case controls. The cases check
  that each mission renders with every field and chip, that the counts match
  the list, and that the executive-brief stats read the right buckets. That
  fixture has 5 queued, 1 critical, 2 high and 3 agents, so no two stats
  coincide. They also check the singular and empty cases, and that only the
  drawer is collapsed.
- The builder is checked for the exact missions each variant receives and for
  the surface-label override. The summary is checked bucket by bucket, not
  only for sums that reconcile.
- The "no hooks, no clock, no randomness" rules are now checked by behaviour.
  Every component in each variant's tree is called outside a render. The
  markup must be byte-equal across two system clocks, with the random-number
  generator and the network made to throw.

The suite now runs in CI. It never did.

## Layer Impact

Release lane: `internal-admin`, test and CI governance. No product surface,
tenant dataset or runtime artifact is touched.

- **Layer 4 (Products): no behaviour change.** No product file changed.
- **Test and CI governance.** One suite moves from source-text scanner to
  behavioural. A new triage record declares this, so the repository's
  scanner-wiring control reads the latest record, not the historical draw.
  The control's live-scanner floor (20) is not touched; the live count goes
  from 24 to 23 and stays above it.

## Client Applicability

- All clients: no runtime change reaches any client.
- Specific clients: none.
- Internal only: yes, CI and test governance.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/integration/agents/agent-mission-panel.test.ts`: 28 text
  cases replaced by 28 behavioural cases; the 13 builder and label cases are
  kept byte-for-byte. The component is rendered in jsdom with Testing Library
  and with `react-dom/server`.
- `.github/workflows/integration-suites.yml`: the suite is added by exact file
  path to the existing per-file agents step. It is named individually because
  its directory still holds one red suite and one more scanner.
- `docs/architecture/t495-agent-mission-panel-triage.json`: the triage record.
  It covers the rewrite, its eighteen mutations, what was dropped and why, and
  its residuals.
- `docs/architecture/test-ci-coverage-census.json`: refreshed with the repo's
  own writer. It moves by exactly one covered file, this one.

## QA / Validation

- Suite: 41 of 41 passing on the base `b50ad84da0` (green, over source text);
  41 of 41 passing after.
- `src/__tests__/integration/agents` as a directory: on the base, 1 failing
  suite and 18 failing tests of 320. After the change: 1 failing suite and 18
  failing tests of 320. The remaining red suite belongs to another item and is
  untouched.
- `src/__tests__/behaviors`: 154 suites / 1671 tests / 0 failing on the base
  and on the branch.
- Eighteen mutations: fourteen against the component, four against the view
  module. `git diff --numstat` on the product file confirmed each one changed
  it before the suite ran. The new suite caught **18 of 18**. One mutation
  first survived: the Critical stat reading the high bucket. The fixture had
  equal critical and high counts, so the fixture was changed and the mutation
  is now caught. The deleted suite was restored beside the new one; it has 0
  failing of 41 on the base. It caught 2 of the 18 mutations, the two whose
  tokens it grepped for (`aria-expanded="true"` and `new Date()`), and missed 16.
  The misses include a right panel dropping a mission, a variant dispatching
  to the wrong panel, a hard-coded disclaimer, a `useMemo` hook, and missions
  filed in the wrong summary bucket.
- The scanner-wiring control (`t770-scanner-wiring-refusal`) was shown to
  refuse this wiring. With the workflow step extended and no triage record, it
  fails 2 of 7 and names this suite. With the record present it passes 7 of 7.
- `test-ci-coverage-census --check` matches the committed census.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`:
  exit 0. `eslint` on the changed test file: exit 0.

## Rollout Plan

Merges through the normal PR path. The repo-owned ACA main deploy workflow
builds and rolls the image as it does for any merge. The image carries no
product change from this PR.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on
  merge as usual. Nothing here changes what it builds.
- Shared runtime mutators: none. No `az` command, Container App, revision,
  traffic weight, flag or environment variable is touched.
- Approved image digest: not applicable, because there is no runtime image
  change.
- ACA runtime invariant: unchanged by this release. It is read after merge and
  reported with the deploy, not claimed here.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing reaches a product surface.

## Rollback Plan

Revert the squash commit. That restores the file-reading suite and removes it
from the workflow step. There is no data, flag or runtime state to unwind.

## Audit Evidence

- Triage record: `docs/architecture/t495-agent-mission-panel-triage.json`. It
  holds the mutations, the deleted-suite comparison, and the dropped cases with
  reasons.
- Backlog item: `T-495`, claimable half, suite 9 of 11.

## Known Gaps

- The `"use client"` and import-path cases are dropped without a direct
  replacement. A directive or an import path changes neither what the panel
  renders nor whether it can be called outside a render. The tree-walk and
  determinism cases cover the properties those cases stood for.
- These cases prove what the panel renders. They do not prove that a route
  reaches its three mounts; that is the subject of
  `agent-mission-surface-wiring`, which is still red and is not touched here.
- No signed-in proof is owed, because no product file changed.
