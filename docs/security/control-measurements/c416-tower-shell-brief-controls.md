# C-416 — the live Tower shell, measured against the pressure brief's five controls

**Suite:** `src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.brief-controls.test.tsx`
**Wired:** `.github/workflows/ai-surface-control-catalog.yml`, step *Measure Tower shell against the pressure brief controls*, which runs in the required `AI surface control catalog` context.
**Catalog entry:** `tower-atlas-program-pressure-brief` (`docs/security/ai-surface-control-catalog.json`).

## Why this exists

The catalog entry declares five controls on a component that no route mounts
(`routeReachable: false`). The Tower route renders
`src/components/tower/command-center/TowerCommandCenterAvaShell.tsx`. Until this
record, each of the five `behavioralTest.reason` strings rested on "nothing mounts
the component" — true, but it said nothing about what a reader of the Tower route
actually sees. This record answers that by execution.

Which surface should own the brief — mount its accountability block in the shell,
or move the five controls to the shell and retire the entry — is an **open owner
decision** and is not taken here. The suite asserts the measured state, not the
desired one: every absence is a green case, and it goes red the day that control
starts rendering.

## What was searched

Sixteen states, not a sample:

- all **14** tab / sub-tab views `TowerCommandCenter` declares, each mounted through
  the shell with the aVa dock collapsed (the suite asserts the 14 renders are
  pairwise distinct, so this is not one view counted 14 times);
- the dock **opened** (the opening advisor turn);
- an **answered** turn whose server response carries a trace key, a server gap and
  a table. The response is deliberately rich so an absence is an absence of
  rendering, not of data: each case asserts, on the packet the shell builds from
  that same response, that the data for its control is present.

## Results

| Control | Live Tower shell today | Precondition on the packet |
|---|---|---|
| `ai-label` | **Absent** in all 16 states. No `AILabel` element, no "AI-assisted" / "AI Draft" text, including on the answered turn. | an AI answer is on screen (question, answer and its table all render) |
| `citation` | **Absent** in all 16 states. No evidence-basis element and no citation label. | packet carries one citation, "Tower governed answer trace" |
| `confidence` | **Absent** in all 16 states. No confidence text anywhere. | that citation is graded `high` |
| `human-approval-gate` | **Absent as a statement** in all 16 states. **Partial:** the opening advisor turn says aVa explains "without approving anything on its own" — present in the two dock states, absent from all 14 views. It does not say a person must approve. | — |
| `risk-caveat` | **Absent** in all 16 states. Neither the server's gap text nor the packet's "Decision-support boundary" caveat reaches the answer. | packet carries the gap and the caveat |

Adjacent, and not counted as any of the five: the dock's generic "aVa can make
mistakes. Check important info." disclaimer (dock states only), and per-field "Not
loaded" markers on the deterministic read-model panels (9 of 14 views). Neither is
attached to AI output as the brief's controls are.

## The mechanism, found by mutation rather than by reading

The shell mounts `AtlasChatPanel` with `variant="focused"`. In `AgentDock`,
`showReviewChrome = !focused && !quietReviewChrome`, and the answer renderer is
given `showChrome={!focused}`. So one prop suppresses the shared review chrome on
the Tower route.

**M1 — `variant="focused"` → `"standard"` in the shell** (`git diff --numstat`: 1/1
on the shell before the run). Result **3 failed, 3 passed**, and exactly these:
`ai-label`, `confidence`, `human-approval-gate`. With the standard chrome the same
answered turn shows an "AI Draft · Review before acting" label, "high confidence",
and "Human approval required: agent-suggested actions are proposals only…".
`citation` and `risk-caveat` stayed green: even in standard chrome the shell's
thread mapping passes no citations to the dock and the renderer shows neither the
gap nor the caveat. That is a second, independent reason those two are absent.

**M2 — the "without approving anything on its own" clause removed from the
opener.** 1/1 on the shell. **1 failed, 5 passed**: `human-approval-gate` only.

## Inversions, for the two controls no source switch turns on

For a control nothing renders, an absence assertion has no reachable positive, so
each was inverted (`.toEqual([])` → `.not.toEqual([])`), `git diff --numstat` 1/1 on
the suite before each run, and the suite restored after:

| Inversion | Result | Case that fired |
|---|---|---|
| I1 — citation, evidence-basis element count | 1 failed, 5 passed | `citation` |
| I2 — citation, visible text | 1 failed, 5 passed | `citation` |
| I3 — risk-caveat, server gap text | 1 failed, 5 passed | `risk-caveat` |
| I4 — risk-caveat, decision-support caveat text | 1 failed, 5 passed | `risk-caveat` |

## The preconditions are load-bearing

| Mutation of the response | Result | Cases that fired |
|---|---|---|
| P1 — `traceKey: null` | 2 failed, 4 passed | `citation`, `confidence` |
| P2 — `gaps: []` | 1 failed, 5 passed | `risk-caveat` |

## What this does not settle

- Which surface owns the brief. The measurement makes one input to that decision
  concrete: three of the five controls exist in the shared dock and are switched off
  by the shell's `variant` prop; the other two would need the shell to pass the
  packet's citations and caveats through, in either variant.
- A signed-in check of the deployed route. No product file changed, so none is owed
  by this record; the suite is jsdom against the design fixture.
