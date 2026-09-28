# 2026-09-28-t495-ask-anything-bar — Rewrite one source-text scanner suite as behaviour, and wire it

## Release ID

`2026-09-28-t495-ask-anything-bar`

## Status

`candidate`

## Plain-English Summary

One test suite checked the bottom "Ask" composer by reading two source files as
text: it looked for the words `event.key === 'Enter'`, `MAX_HEIGHT_PX`,
`Live ask deferred` and a colour hex in the component, and for a padding string
in the Program detail page. Half of it was red on `main` — not because the
composer was broken, but because those words had been renamed or retired while
the behaviour stayed. A suite that is red for a rename cannot tell anyone when
something real breaks, and it ran in no workflow anyway.

All ten cases are deleted, not repaired with new strings. Twenty-three cases
replace them. They render the composer and use it the way a person does: Enter
sends the trimmed question once and clears the box; Shift+Enter inserts a
newline instead; blank text and questions typed mid-response are not sent; the
Send button is enabled only when there is something to send; with no shared
page state the composer falls back to its own stream, bound to the right
surface; the text box grows to a ceiling and then scrolls, and shrinks after a
send; the response panel appears only after a send and closes on dismiss; and
the component never calls the network itself. Two more render the Program
detail page and check that it mounts exactly one composer for the right agent
and leaves room at the bottom so the fixed bar does not cover the footer.

The suite now runs in CI. It never did.

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

- `src/__tests__/integration/agents/ask-anything-bar.test.ts` — ten
  file-reading cases deleted; twenty-three behavioural cases that render
  `AskAnythingBar` (jsdom, Testing Library) with the two model-reaching hooks
  replaced by recorders and a throwing global `fetch`, and render
  `ProgramCanonicalDetail` from the real seed plan.
- `.github/workflows/integration-suites.yml` — the suite is added by exact
  file path to the existing per-file agents step, in the same change as the
  rewrite. Named individually because its directory still holds one red suite
  and four more scanners.
- `docs/architecture/t495-ask-anything-bar-triage.json` — the triage record
  declaring the rewrite, its thirteen mutations, what was dropped and why, and
  its residuals.
- `docs/architecture/test-ci-coverage-census.json` — refreshed with the repo's
  own writer. The committed census matched the base before this change, so the
  whole diff is this suite moving from uncovered to covered (+1 / −1).

## QA / Validation

- Suite: 5 failing of 10 on the base `2fcaa8b3f9`; 23 of 23 passing after.
- `src/__tests__/integration/agents` as a directory: 2 failing suites / 23
  failing tests of 322 on the base; 1 / 18 of 335 after. The remaining red
  suite is another item's scanner and is untouched.
- `src/__tests__/behaviors`, measured in a separate clean worktree at the base
  and again after: 154 suites / 1671 tests / 0 failing on both sides.
- Thirteen mutations (eleven against `AskAnythingBar.tsx`, two against
  `ProgramCanonicalDetail.tsx`), each confirmed by `git diff --numstat` to have
  changed the file before any suite ran: the new suite caught **13 of 13**.
  The deleted scanner, restored beside it, is red at 5 on the base; its failure
  count rose on only 4 of the 13 and did not move on 9, including Shift+Enter
  sending, sends while streaming, a permanently disabled Send button and spell
  check turned off. One first attempt did not change the file; it was recorded
  as a no-op, corrected and re-run.
- The scanner-wiring control (`t770-scanner-wiring-refusal`) was proven to
  refuse this wiring: with the workflow step extended and the triage record
  absent it fails 2 of 7 and names this suite. With the record present, it and
  `t492-stale-suite-triage-record` pass 28 of 28.
- `check-integration-ci-visibility` passes: 1 changed suite registered in CI.
- `test-ci-coverage-census --check` matches the committed census.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`:
  exit 0. `eslint` on the suite: exit 0.

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

Revert the squash commit. That restores the file-reading suite and removes it
from the workflow step. No data, flag or runtime state to unwind.

## Audit Evidence

- Triage record: `docs/architecture/t495-ask-anything-bar-triage.json`
  (mutations, deleted-scanner comparison, dropped cases with reasons).
- Backlog item: `T-495`, claimable half, suite 7 of 11.

## Known Gaps

- `ProgramCanonicalDetail` is imported by no route, so the two Program-page
  cases prove what that page renders, not that anyone sees it. The composer's
  route-reachable mount is `SourceAnalyticsCanvas`, which its own suites
  render. Delete-versus-mount is a product call and not taken here.
- The composer's accent for the `nexus` key is a colour the Program page's own
  comment calls banned. The deleted palette case asserted over that, by bytes,
  and was red. It is recorded as an observation, not asserted either way.
- No signed-in proof is owed: no product file changed.
