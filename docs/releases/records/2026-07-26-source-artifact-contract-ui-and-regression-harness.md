# 2026-07-26-source-artifact-contract-ui-and-regression-harness — UI eligibility explanations and stage × artifact regression harness (PR 4D)

## Release ID

`2026-07-26-source-artifact-contract-ui-and-regression-harness`

## Status

`released` — merged, deployed, ACA runtime invariant verified, and live-verified on
`app.abarva.ai`. **Important scope correction found during live verification**: see the new
"Live component reachability" note below and Known Gaps — a real, material finding about which
of this PR's edited files are actually reachable in production today.

## Plain-English Summary

PR 4D of the Source stage/artifact governance workstream (`ADR-0013`, `ADR-0015`), the final PR
in the original PR 4 sequencing. PR 4C made every blocked action (generate, accept, export)
return a real, structured reason. This release closes the loop on the UI side and adds an
exhaustive regression harness for the contract/authority logic itself.

1. **Every blocked action now shows every reason, not just the first sentence.** A shared,
   client-safe module (`src/lib/source/contracts/blocker-copy.ts`) normalizes either real route-
   response shape (a `blockers[]` array, or a single flattened `{error, detail}`) into one
   consistent list, rendered by a new shared `ArtifactBlockerList` component used identically by
   DocumentTab's generate flow, `ArtifactAcceptancePanel`'s accept flow, and every export link.
2. **Blocked exports are no longer silently downloaded as broken files.** Every export/download
   anchor across DocumentTab and File Cabinet was a bare `<a href download>` with zero error
   handling — a real `409 export_not_eligible` (shipped in PR 4C) just downloaded or opened the
   JSON error body as if it were the file. A new `ExportLink` component fetches first and only
   ever triggers a real save/open on a real 2xx byte response; a blocked response reports its
   blockers instead.
3. **Acceptance now tells the user whether it actually finished the job.** `ArtifactAcceptancePanel`
   reads the accept route's `authority` field (returned since PR 4C, read by no client before this
   release) and shows a real status line: cleared for export, authoritative but not yet cleared
   (a client-facing artifact needs `approved_for_external_use` separately from acceptance — a
   real distinction, proven live in PR 4C), or accepted but not yet authoritative — with any
   remaining blockers listed.
4. **A full stage × artifact regression harness** — PR 4A-4C's own suites are example-based
   (a handful of representative cases). The new
   `stage-artifact-regression-matrix.test.ts` is exhaustive: every registered code × all 11
   canonical stages, and every code × every stage × every real `{status, lifecycleState,
   hasActiveAcceptance}` combination for the authority resolver, asserting universal invariants
   (terminal states are never authoritative regardless of acceptance claims; `isFinal ⇒
   isAuthoritative ⇒ isAccepted`; empty blockers only alongside a fully clean decision; nothing
   throws).

## Live component reachability (found during live verification, not known when this PR was scoped)

Live browser verification against `app.abarva.ai` surfaced a real, material fact this PR's
initial scoping (based on an Explore-agent code audit of files that trigger generate/accept/
export) did not catch, because the audit found real call sites for every file it looked at
without checking whether THOSE call sites are themselves reachable from a live route:

- **`src/components/source/canvas/analytics/ArtifactAcceptancePanel.tsx` is genuinely live** —
  mounted by `SourceAnalyticsCanvas.tsx`, which `src/app/(maestro)/source/events/[eventId]/page.tsx`
  renders. This is the real, current Source event canvas. Points 3 (accept-flow blocker/authority
  rendering) of the Plain-English Summary is real and live-proven below.
- **`src/components/source/canvas/UniversalCanvasShell.tsx`, and therefore
  `src/components/source/canvas/workspace-tabs/DocumentTab.tsx` (only ever mounted by it), are not
  imported by any live route today** — confirmed by `grep` finding zero call sites for
  `UniversalCanvasShell` outside its own file anywhere in `src/`. The event canvas users actually
  see (`SourceAnalyticsCanvas.tsx`) is a separate, newer component tree that supersedes it.
- **`src/components/source/canvas/workspace-tabs/ExportLink.tsx` is only ever used by DocumentTab
  and `FileCabinetPanel.tsx`** — both unreachable (see below) — so it is currently dead code too,
  despite being real, correct, and unit-tested.
- **`src/components/source/FileCabinetPanel.tsx` is a confirmed, already-known-retired
  component** — the repo's own `src/__tests__/integration/source/source-legacy-route-archive.test.ts`
  explicitly asserts the route that used to mount it
  (`src/app/(maestro)/source/events/[eventId]/file-cabinet/page.tsx`) now redirects to `/workspace`
  and does **not** contain `FileCabinetPanel` — this is intentional, tracked legacy-route archival
  from an earlier slice, not something this PR discovered as a surprise regression.

**Net effect**: points 1 and 3 of the Plain-English Summary (shared blocker rendering, the
post-accept authority readout) are real and live today via `ArtifactAcceptancePanel`. Point 2
(the `ExportLink` fetch-first export fix) and the DocumentTab/FileCabinetPanel wiring are real,
correct, tested code with **zero live-traffic impact** until/unless `UniversalCanvasShell` or
`FileCabinetPanel` are ever remounted. This mirrors this session's own prior finding pattern for
Moves ("5 real-but-unmounted components") — the code isn't wrong, it just isn't reachable. Flagged
here plainly rather than silently claiming full live coverage; a follow-up task has been spawned
to decide whether `UniversalCanvasShell`/`DocumentTab`/`FileCabinetPanel` should be deleted as
confirmed-dead code or are genuinely planned for future remounting.

## Layer Impact

- `global-control-lane`: UI-only change to three Source components + one new shared module + one
  new shared component pair; plus a new, additive test file. No server route behavior changed —
  PR 4C's routes are read differently by the client, not modified.

## Client Applicability

- All clients: yes — no tenant-specific behavior. Internal only: no (live canvas/File Cabinet
  surfaces). Public/demo only: no. Feature flag: none.

## Changes Included

- `src/lib/source/contracts/blocker-copy.ts` (new) — client-safe blocker normalizer/labeler.
- `src/lib/source/contracts/__tests__/blocker-copy.test.ts` (new, 10 cases).
- `src/components/source/canvas/ArtifactBlockerList.tsx` (new) — shared blocker-list renderer.
- `src/components/source/canvas/__tests__/ArtifactBlockerList.test.tsx` (new, 2 cases).
- `src/components/source/canvas/workspace-tabs/ExportLink.tsx` (new) — fetch-first export/download
  component replacing bare anchors.
- `src/components/source/canvas/workspace-tabs/__tests__/ExportLink.test.tsx` (new, 5 cases).
- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx` — generate/export blockers now
  render through the shared list; export anchors replaced with `ExportLink`.
- `src/components/source/canvas/workspace-tabs/__tests__/DocumentTab.test.tsx` — +2 cases
  (multi-blocker generate failure; blocked export attempt), 6 pre-existing cases unmodified.
- `src/components/source/canvas/UniversalCanvasShell.tsx` — `handleArtifactGenerate` now carries
  `blockers` through additively.
- `src/components/source/canvas/analytics/ArtifactAcceptancePanel.tsx` — blocker rendering +
  post-accept authority-status readout.
- `src/components/source/canvas/analytics/__tests__/ArtifactAcceptancePanel.test.tsx` — +2 cases
  (real `stage_not_eligible` 409 detail rendering; post-accept authority status), 5 pre-existing
  cases unmodified.
- `src/components/source/FileCabinetPanel.tsx` — both download/export anchor patterns replaced
  with `ExportLink`; per-row blocker readout.
- `src/lib/source/contracts/__tests__/stage-artifact-regression-matrix.test.ts` (new, 6 cases,
  exhaustive over the full registry × 11 stages × representative authority state space).
- `docs/architecture/adr/ADR-0015-source-artifact-contract.md` — PR 4D amendment.

## QA / Validation

- `pass` — `blocker-copy.test.ts` (10 cases): every known blocker code label resolves correctly;
  an unrecognized code falls back to a title-cased reading rather than throwing; a real
  `blockers[]` array (render/download/accept-route shape) passes through unchanged; a real
  single-flattened response (AI-generate route shape, including the real `upstream_required`
  body with `missingUpstream` in meta) normalizes to a one-item array with the server's real
  detail sentence preserved verbatim; null/non-object/no-blocker payloads return `[]` or the
  fallback; malformed blocker entries in an array are dropped rather than crashing the whole list.
- `pass` — `ArtifactBlockerList.test.tsx` (2 cases): renders nothing for an empty list; renders
  every blocker's full detail sentence and short label, not just the first.
- `pass` — `ExportLink.test.tsx` (5 cases): a real 2xx byte response downloads the blob and
  reports no blocker; a real `409 export_not_eligible` response reports the full blocker list and
  never creates a download; view mode opens the blob in a new tab instead of downloading; a
  network failure reports a network-error blocker without crashing; the object URL is revoked
  after a delay rather than leaked.
- `pass` — DocumentTab test suite: 6 pre-existing tests green unmodified + 2 new (every blocker
  from a blocked generation renders, not just the first; a real 409 export attempt shows its
  blockers instead of downloading the error body).
- `pass` — ArtifactAcceptancePanel test suite: 5 pre-existing tests green unmodified + 2 new (a
  real single-flattened `stage_not_eligible` 409's detail sentence renders correctly; the real
  authority decision after a successful accept shows "authoritative but not yet cleared for
  export" with its blocker, proving the client actually reads the field PR 4C added).
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
  tsconfig.json` — zero errors.
- `pass` — `npx eslint` on all touched/added files — zero errors, zero warnings (one pre-existing
  unrelated unused-var warning set in `UniversalCanvasShell.tsx`, confirmed identical before and
  after this change via `git stash`).
- `pass` — `stage-artifact-regression-matrix.test.ts` (6 cases) against the real, full contract
  registry: eligibility monotonicity for every code across all 11 stages; `evaluateGenerationEligibility`
  agrees with `isArtifactEligibleAtStage` for every code/stage when nothing is missing upstream; a
  non-empty missing-upstream list always blocks regardless of stage; `contractsForStage` partitions
  the registry with no gaps or overlaps; nothing throws for any code at any stage; the full
  authority-resolver invariant sweep (every code × 11 stages × 5 statuses × 3 lifecycle states × 2
  acceptance values — thousands of calls) holds with zero violations, completing in under 1 second.
- `pass` — regression sweep, `src/lib/source/**` + `src/app/api/v1/source/**` +
  `src/components/source/**` (2740 tests): 2706 passing. 12 pre-existing failing suites — the same
  10 confirmed unrelated during PR 4A-4C's sweeps, plus 2 more (`SourcingReactivePanel.test.tsx`,
  `StrategyStage.test.tsx`) newly confirmed unrelated in this sweep via `git stash` (both fail
  identically with none of this PR's changes present).
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD` — all gates passed.
- `pass` — CI on PR #5653 (all 20 checks).
- `pass` (with the scope correction above) — live signed-in browser proof against `app.abarva.ai`,
  real "Healthcare Demo" tenant, real event `c03ffe14-49fb-403e-8d47-ed23c9fea9e2`:
  - Located the real, live `d05_scope_memo` "Accept as authoritative" control inside
    `ArtifactAcceptancePanel` under the event canvas's Files & deliverables → Artifact lifecycle
    section (`data-testid="source-shell-artifact-accept-toggle-d05_scope_memo"`, confirmed present
    in the live DOM alongside 11 sibling artifact toggles for the same event).
  - Filled and submitted the real accept form via genuine DOM events (React-compatible
    `HTMLTextAreaElement` value setter + `input`/submit dispatch, not a direct fetch bypass).
    `read_network_requests` confirmed the real request fired:
    `POST https://app.abarva.ai/api/v1/source/c03ffe14-49fb-403e-8d47-ed23c9fea9e2/artifacts/d05_scope_memo/accept → 200`.
  - Confirmed via a follow-up `GET .../d05_scope_memo/body` that the real artifact content is
    intact and the event/tenant state is healthy post-accept.
  - **Could not visually capture the authority-readout element mid-render**: `onAccepted` in the
    live canvas triggers a full data refresh that resets the client-side Files-tab selection back
    to the default Steps tab before a screenshot could be taken, and the readout is ephemeral
    client state (by design — it reflects the just-completed action, not a persisted field) that
    does not survive that remount. The route call, response code, and the component's rendering
    logic for that exact response shape are independently proven (network log above; component
    unit tests in this PR asserting the exact rendered text for the same response shape) — the
    only thing not directly screenshotted is the few-hundred-millisecond browser-side render
    before the refresh. Noted honestly rather than claimed as fully screenshotted.
  - `DocumentTab`/`ExportLink`/`FileCabinetPanel` verification was not attempted beyond code
    review and unit tests, per the live component reachability finding above — there is no live
    route to verify them against today.

## Rollout Plan

Merge to `main` via PR, deploy through the repo-owned ACA main deploy workflow. UI-only behavior
change — no new server routes, no change to any route's response shape (only additive: nothing
that returned `blockers`/`authority` before stops doing so). No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none directly (a normal code deploy).
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:d6a04362d1ab88efac5724c142f46c69a594b8a4464a44060859cc88054fb645`
  (merge SHA `937218c19b10d57e9449d93ecaff23d293198d8f`, ACA revision
  `ca-abarva-web-lab-eastus--m937218c1`).
- ACA runtime invariant: verified — deploy run
  [30204720470](https://github.com/abarva-platform/abarva/actions/runs/30204720470)'s "Verify
  ACA runtime invariant" step passed.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — see QA / Validation.

## Rollback Plan

Revert the merge commit. All three components return to their pre-PR behavior (raw `detail`
string on blocked generate/accept, bare `<a href download>` export anchors with no blocked-export
handling) — no data migration involved either direction, no server route changes to revert.

## Audit Evidence

- PR: [#5653](https://github.com/abarva-platform/abarva/pull/5653) (merge commit
  `937218c19b10d57e9449d93ecaff23d293198d8f`).
- Deploy run: [30204720470](https://github.com/abarva-platform/abarva/actions/runs/30204720470).
- Live proof: signed-in browser session against `https://app.abarva.ai` — see QA / Validation and
  "Live component reachability" above.
- Sequencing decision: `docs/architecture/adr/ADR-0013-source-modernization-baseline.md`.
- Design decision: `docs/architecture/adr/ADR-0015-source-artifact-contract.md` (PR 4D
  amendment).
- Prior releases this follows: `2026-07-26-source-artifact-contract-registry.md` (PR 4A),
  `2026-07-26-source-artifact-contract-generation-enforcement.md` (PR 4B),
  `2026-07-26-source-artifact-contract-authority-enforcement.md` (PR 4C).

## Known Gaps

- **`UniversalCanvasShell.tsx`, `DocumentTab.tsx`, `ExportLink.tsx`, and `FileCabinetPanel.tsx`
  have no live route today** — see "Live component reachability" above. The code is real, correct,
  and unit-tested, but not reachable from any page a signed-in user can currently visit. A
  follow-up task has been spawned to determine whether these should be deleted as confirmed-dead
  code or are genuinely planned for future remounting, rather than leaving this ambiguous.
- **The post-accept authority readout's visible lifetime is very short** in the live canvas
  because `onAccepted` triggers a full data refresh — a real, working behavior (proven via network
  log), just not one that was screenshotted mid-render. Worth considering a toast/persisted
  confirmation instead of purely ephemeral inline state in a future pass, though this was not
  asked for in this workstream's scope.
- **The Gate Decision panel and Approvals page/queue are untouched.** They are a separate, older
  gap/criteria system (`GateCriterionAssessment`, `deriveGapLine` in `GateTab.tsx`) that predates
  `SourceArtifactContract` and never surfaced artifact-authority blockers — confirmed out of scope
  by the code-grounded audit this PR's UI scoping was based on, not silently skipped.
- **Governance-banner text inside successfully-exported files is still not normalized** (PR 4C's
  Known Gap, unchanged by this PR) — the export **gate** (blocking an ineligible export) is fully
  wired by PR 4C/4D; the banner *text* inside a file that does export is separate, tracked
  follow-up (PR 4C-2).
- **This was the last PR in the original PR 4 sequencing.** Governance-banner text normalization
  across the ~20 renderer kinds is the one concretely-named remaining item from this workstream.
