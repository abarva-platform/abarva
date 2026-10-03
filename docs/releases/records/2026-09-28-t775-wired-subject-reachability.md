# 2026-09-28-t775-wired-subject-reachability — Refuse a wired render suite whose subject no user can reach

## Release ID

`2026-09-28-t775-wired-subject-reachability`

## Status

`candidate`

## Plain-English Summary

When a source-text scanner suite is rewritten into a behavioural suite, a
triage record declares the rewrite and the suite is wired into CI. The
scanner-wiring control (`t770-scanner-wiring-refusal`) reads those records.
It checked that no scanner is wired. It never checked whether the code a
rewritten suite exercises is code a user can reach.

Four rewrites merged earlier today render components that no route mounts, or
drive view builders that only tests import. Each record said `verdict: wired`
with `rendersComponent: true`, and the coverage census counted the four files
as covered. The mutation scores in those records are real. They prove the
tests bind the component. But the component is one no user can see, so the
coverage is coverage of dead code. The triage schema had no reachability
field, and no control consulted either reachability register.

This change adds that check to the same control. For every wired row that
renders a component or names a production entry point, it walks the suite's
import closure. It computes whether each non-test file there is reachable. It
uses the two walks the repository's reachability audits already share: the
route walk for `src/components` and `src/app`, and the referrer classes for
`src/lib`. The committed registers are not read, because a record could agree
with a stale one. A row whose subject includes an unreachable component, or a
`src/lib` module only a test reaches, is refused.

The four merged rows are the known positives. Each is amended with a
`subjectReachability` field that states the computed answer. The control
checks that field against the live computation in both directions. The four
are held in a pending set that may only shrink until the owner decides to
retire or mount the mission component family. `recordedAt` is not changed on
any record: this is an amendment, not a restamp.

## Layer Impact

Release lane: `internal-admin`, test and CI governance. No product surface,
tenant dataset or runtime artifact is touched.

- **Layer 4 (Products): no behaviour change.** No product file changed.
- **Test and CI governance.** The scanner-wiring control gains a second
  describe block with six cases. Four triage records gain one row field and
  one `amendments` entry each.

## Client Applicability

- All clients: no runtime change reaches any client.
- Specific clients: none.
- Internal only: yes, CI and test governance.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/behaviors/t770-scanner-wiring-refusal.test.ts`: six new cases.
  The first is a vacuity guard: route roots and product entry points were
  found, and at least 10 rows are in scope (13 today). The second is the
  refusal itself. The third is the positive control: with the pending set
  withheld, exactly the four known positives are refused. Each is pinned to
  the file that makes it dead, and the reachable `AskAnythingBar` is pinned as
  not dead. The fourth checks declared against computed, both ways. The fifth
  keeps the pending set shrink-only. The sixth measures the fixture exclusion.
- `docs/architecture/t495-agent-hidden-drawer-triage.json`,
  `t495-agent-inline-recommendation-triage.json`,
  `t495-agent-mission-panel-triage.json` and
  `t495-ask-anything-bar-triage.json`: each gains
  `suites[].subjectReachability`, with `reachable: false`, the pending
  decision, the unreachable files at amendment and a note. Each also gains an
  `amendments` entry.

## QA / Validation

- Scanner-wiring control: 7 of 7 passing on the base `23c02c05b2`. With the
  new cases and no record amendment: 12 passing, 1 failing. The failing case
  is declared-versus-computed, and it names all four rows. With the amendments:
  13 of 13.
- Real known positives, measured before any code was written: of the 13 wired
  render or entry-point rows, exactly the four filed are refused. The other
  nine have no unreachable subject. One test-only fixture appears in an
  unrelated suite's closure. It is excluded as test data, and a case pins that
  exclusion.
- Nine mutations, each confirmed by `git diff --numstat` to have changed the
  file, and all nine caught:
  - reachability made blind: 3 failed
  - component half dropped: 3 failed
  - `src/lib` half dropped: 1 failed
  - fixture exclusion removed: 4 failed
  - earliest record instead of latest: 3 failed
  - one pending entry removed: 3 failed
  - one record amendment reverted: 1 failed
  - a declared `reachable` flipped to true: 1 failed
  - the `wired` verdict filter removed: 3 failed
- `src/__tests__/behaviors`: 154 suites / 1671 tests / 0 failing on a clean
  base worktree at `23c02c05b2`. After the change: 154 / 1677 / 0. The
  difference is the six new cases.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`:
  exit 0, with `tsconfig.tsbuildinfo` removed first. `eslint` on the changed
  test file: exit 0.

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

Revert the squash commit. That removes the six cases and the four row fields.
There is no data, flag or runtime state to unwind.

## Audit Evidence

- Backlog item: `T-775`, part (1), the control.
- The four amended triage records carry the computed unreachable files at
  amendment time.

## Known Gaps

- Part (2) of `T-775`, whether to retire or mount the mission component
  family, is an owner decision. It is not taken here. No merged suite is
  deleted or changed.
- The item allows a row to pass by citing an owner decision, meaning a
  backlog id marked decided. That backlog is outside the repository, so CI
  cannot read whether an id is decided. A citation would be a declaration the
  control takes on trust. Instead, a row leaves the refusal by the decision's
  effect: a retire deletes the suite, and a mount makes the subject reachable.
  A future decision to keep a subject unmounted but tested has no
  representation yet. That needs its own control change.
- Subjects are what the suite's import closure reaches. A module reached only
  through `jest.mock` factories or `jest.requireActual` is not counted. This is
  the same import grammar the reachability audits use.
