# U-627 — The capture dock withholds a send aVa refuses

## Release ID

`2026-10-08-capture-dock-withholds-a-send-ava-refuses`

## Status

`candidate`

## Lane

`global-control-lane`

## Plain-English Summary

The redesigned Moves phase-capture screen puts the aVa advisor in a side rail
beside the capture questions. The person can type a question, press Enter, and
read the answer as it streams in.

While an answer was still streaming, the screen kept the composer open and the
three suggestion chips clickable, but the code behind them refuses in exactly
that state — it returns immediately while a turn is in flight. So a second
question went nowhere. Worse, the dock clears the box before handing the text
to the handler, so the typed question was erased on the way out: no turn
appeared, no sentence explained anything, and the words were gone. The
suggestion chips had the same shape — they looked clickable and did nothing.

The in-flight turn also showed as an empty advisor bubble rather than a working
indicator. The dock has a throbber for this, but it reads a shell-wide
streaming flag that this screen never sets, because this screen keeps its own.

The older chat rail on the same screen never had any of this: it reads the
streaming flag at seven places and switches off every control while a turn
streams. Only the redesigned path lost that reading. This change gives the
redesigned path one authority for the same question — a small module both the
control and the handler consult — so the screen cannot offer what the handler
will refuse. While a turn streams the composer is paused and says so in its
placeholder, the chips are withheld, the throbber shows, and a typed draft is
kept rather than destroyed.

One judgement call is worth stating. The shared advisor dock already had a
documented way for a host to pause its composer, and the handler behind its
suggestion chips already honoured that pause — but the chip buttons themselves
did not, so they stayed clickable while the composer was shut. That is
corrected in the shared component rather than worked around in this screen,
because it was the same defect one level down. No other surface in the product
passes that pause today, so the correction cannot change any other screen's
behaviour; the test suite pins both readings.

## Layer Impact

Release lane: `global-control-lane` — shared product-surface behaviour,
identical for every client, not feature-gated beyond the existing capture flag.

- **Layer 4 (Products)** — presentation and control availability only. Which
  controls the capture dock offers, and the sentence it shows while they are
  withheld. No product gains or loses data.
- **Layer 3 (Canonical model)** — unchanged. No schema change, no migration, no
  read path and no write path touched. The streaming flag this reads is
  component state that already existed.

## Client Applicability

- All clients: yes for the shared dock correction, which is inert until a host
  pauses its composer.
- Specific clients: the capture dock itself renders only where
  `moves_capture_v2` is enrolled, which today is the demo tenant.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_capture_v2` already gates the surface. The fix is not
  separately flagged — gating it would preserve the defect behind the same flag
  that exposes it.

## Changes Included

- `src/components/strategic-moves/ava-composer-availability.ts` — new. The pure
  authority: resolves whether the composer may be offered, the sentence to show
  while it is withheld, and whether the dock should show its throbber, all from
  the one streaming flag the send handler guards on.
- `src/components/strategic-moves/MovesCaptureWorkspace.tsx` — takes the host's
  streaming flag (absent means idle, which is the current behaviour) and hands
  the dock `composerDisabledReason` and `isAgentBusy` derived from the module.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — passes its
  own `avaStreaming` state, the same value its send handler reads.
- `src/components/agent/AgentDock.tsx` — one line: the suggestion chips are
  disabled while the composer is paused, matching the handler behind them,
  which already returned early in that state.
- `src/components/strategic-moves/__tests__/moves-capture-composer-streaming.test.tsx`
  — new, 21 cases.
- `.github/workflows/ai-surface-control-catalog.yml` — registers the new suite
  in the required step.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No new runtime dependency, no new network call, no change to the send handler's
own logic.

## QA / Validation

- **PASS** — `npx jest src/components/strategic-moves/__tests__/moves-capture-composer-streaming.test.tsx`
  — 21/21. The cases render the **real** shared dock, not a stub, because the
  sibling host suite stubs it down to its workspace slot and therefore cannot
  see a disabled control or a dropped send.
- **PASS** — `npx jest src/components/strategic-moves src/components/agent` —
  65 suites / 924 tests, no regression.
- **PASS** — the other hosts of the shared dock:
  `npx jest src/components/source src/components/admin src/components/ava-chat src/components/engagement`
  — 138 suites / 918 tests, no regression. This is the evidence that the shared
  component's one-line correction is inert elsewhere.
- **PASS** — mutation sweep, **11 mutations, 11 killed**, each with a named
  failing case. Covers: the authority always reporting the composer open; the
  throbber flag dropped; the sentence dropped; the sentence reduced to an empty
  string (which would silently re-open the composer, since the dock treats the
  reason's truthiness as the pause); the send-permission field inverted; the
  workspace dropping each of the two dock props; the workspace defaulting to
  streaming instead of idle; the workspace ignoring the prop and hard-coding
  idle; the host dropping the flag; and the shared dock's chips ignoring the
  pause.
- **PASS** — the host-wiring case is source-anchored with a sentinel: renaming
  the anchor fails the case loudly rather than asserting against an empty
  slice (verified by mutation).
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` on all five changed source files: **0 errors**. Three
  warnings are reported and all three are pre-existing — confirmed by running
  the same command in a clean checkout of the base commit, which reports the
  same three.
- **PASS** — formatting measured per file, in place. The two new files are
  clean. All three pre-existing files already warn at the base commit, and none
  of the reformats the formatter proposes falls on a line this change adds, so
  they are left alone rather than swept into this diff.
- **PASS** — census regenerated honestly. A clean checkout of the base commit
  regenerates to `2878 / 2714`, while the committed file reads `2877 / 2713`, so
  the base carries one file of inherited drift this branch does not cause. This
  branch reads `2879 / 2715` — base regen **+1**, the one new suite — with
  `uncoveredTestFiles` unchanged, which is what proves the suite is registered
  rather than dark.
- **PASS** — `node scripts/quality/check-named-suite-requiredness.mjs`, exit 0,
  50 directories swept.
- **NOT RUN** — live signed-in walk. Observable only in a signed-in session on
  the capture surface for an enrolled tenant, by asking aVa a question and
  trying to send a second one before the first finishes. This record does not
  claim `live-proven`.

## Rollout Plan

Merge to main. The change is presentation-side inside components that already
render, and becomes active with the next repo-owned ACA main deploy. No
migration, no new flag, no env var, no worker job, no traffic shift.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none. This change performs no Azure operation.
- Approved image digest: not applicable at merge; the main deploy workflow pins
  the digest it builds.
- ACA runtime invariant: unchanged by this PR; the standing invariant proof is
  owed by whichever deploy carries it, not by this record.
- Worker image invariant: unchanged — no worker job touched.
- Feature/env flag update path: none required. `moves_capture_v2` enrolment is
  unchanged.
- Live signed-in proof required: **yes**, before this is called `live-proven`.

## Rollback Plan

Revert the PR. Every change is additive: the new module has one caller, the new
prop defaults to the old behaviour when absent, and the shared component's one
line reduces to its previous expression because no other host passes the pause.
No migration to unwind, no written data to reconcile, no flag to flip.

## Audit Evidence

- PR URL and its CI run, including the required **AI surface control catalog**
  check that runs the new suite.
- The mutation sweep summary in this record's QA section.
- Base-versus-branch census readings above, reproducible by regenerating the
  census on a clean checkout of the same base commit.
- The seven places the older chat rail on the same screen reads the same
  streaming flag, which is the asymmetry this change closes.

## Known Gaps

- **The host's own send path is not rendered in a test.** The handler's refusal
  and the flag it guards on are pinned by source assertions with a sentinel,
  and the dock half is rendered for real, but the host component is large
  enough that standing up its fixture is separate work. The sibling host suite
  that could carry it stubs the dock and so cannot observe this behaviour at
  all — see the standing note on stubs that drop props.
- **The handler still returns silently on an empty message.** With the control
  withheld during a stream, the remaining way to reach the silent return is an
  all-whitespace message, which the dock already refuses on its own side. No
  sentence was added for that arm because no control can reach it.
- **The in-flight promise is still not threaded back to the dock.** The dock
  awaits whatever the host's handler returns, and the capture path returns
  nothing, so the dock's own in-flight flag drops immediately. Measured and
  deliberately not changed: the streaming flag is set before the handler's
  first suspension point, so there is no window in which the composer is open
  while the handler would refuse, and threading the promise would add a second
  mechanism for the same question. It remains the more honest contract.
- **The throbber's shell-wide fallback is unchanged.** Any other surface that
  keeps its own streaming state and does not pass the flag will show an empty
  advisor bubble the same way. Only the capture dock is corrected here.
- Not `live-proven`. See QA and Deployment Authority.
