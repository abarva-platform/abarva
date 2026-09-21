# Source New — design-to-runtime matrix

Backlog item **T-454**. Enumerates every tab and subview of the Source New surface and reports the
seven columns the Source quality gate asks for: reference frame, supported data/read model,
empty/blocked state, action destination, desktop screenshot, mobile screenshot, accessibility check.

**This document is read, render and report only.** No code was changed to produce it. It is a
statement about `main` as of the commit this file lands on, not a proposal.

**How to read the proof columns.** They are filled from harnesses that exist in this repository, not
from intent. Where no harness reaches a row the cell says `no harness`, and the section after the matrix names
what each missing harness would take. A guessed screenshot or accessibility verdict is worse than an
empty cell, so none is guessed.

`owed to Anand` — the marking for a verdict that is merely waiting on a signed-in render — **appears
in no cell**, and that absence is deliberate rather than an oversight. Not one of these columns is
blocked on someone signing in and looking; each is blocked on a harness that does not exist or
cannot reach a signed-in route. Writing `owed` would have described a scheduling problem where the
real one is capability.

**Fixture discipline.** Every row below whose runtime evidence comes from a test fixture is marked
`synthetic` **in the row itself**. That marking is not decoration — see
[Fixture discipline](#fixture-discipline-no-row-is-backed-by-a-tenant-scoped-shape), which is the
single largest finding in this matrix.

---

## Scope: what counts as a tab or subview

Source New is two routes. The event workspace has two navigations — a **phase rail** and a **view
tab strip** — and the view tabs are the "tabs" the gate means. Several subviews are conditional on
event state and never coexist, so they are enumerated separately rather than collapsed.

| Navigation | Declared at | Members |
|---|---|---|
| View tabs | `SourceNewWorkspace.tsx:33` (`type View`), `:61` (`VIEWS`) | `work`, `files`, `intelligence`, `approvals` |
| Phase rail | `phase-state.ts:15` (`SourceNewPhaseKey`), `:17` (`SOURCE_NEW_PHASE_ORDER`) | `request`, `define`, `suppliers`, `rfi` |
| Phase states | `phase-state.ts:45` (`SourceNewPhaseState`) | `current`, `review_needed`, `recorded`, `no_record`, `not_open` |
| File folders | `SourceNewFiles.tsx:77` (`PHASES`) | `request`, `define`, `suppliers`, `rfi`, `other` |

The phase rail is **not** a tab strip: selecting a phase also resets the view to `work`
(`SourceNewWorkspace.tsx:285`). The Work view therefore has one subview per phase state, not one per
phase, which is why rows W1–W4 are states rather than phases.

### Row census

**26 rows.** Stated as a breakdown rather than a bare total so it can be checked against the tables
below without counting them by hand:

| Section | Rows | Ids |
|---|---|---|
| Routes | 3 | `R1`–`R3` |
| Workspace chrome | 3 | `C1`–`C3` |
| Work view, one per phase state | 5 | `W1`–`W5` |
| Work view, conditional stage panels | 4 | `P1`–`P4` |
| Files view | 5 | `F1`–`F5` |
| Intelligence view | 3 | `I1`–`I3` |
| Approvals view | 2 | `A1`, `A2` |
| Agent dock | 1 | `D1` |
| **Total** | **26** | — |

**23** of those 26 sit inside the event workspace route `R3`; `R1` and `R2` are the other two
routes. Where a gap below is quoted as a proportion, it is against 26 unless it names `R3`.

Two rows are worth flagging as not ordinarily reachable, so the denominator is not read as 26
screens an operator sees: **`F5`** never renders at all (see the negative control), and **`R2`** is
reached only by query parameter.

---

## The matrix

`RF` = reference frame. `Desktop` / `Mobile` = screenshot harness. `A11y` = accessibility check.

### Routes

| # | Row | RF | Data / read model | Empty or blocked state | Action destination | Desktop | Mobile | A11y |
|---|---|---|---|---|---|---|---|---|
| R1 | `/source/new` — request-first workspace | `SourceNewRequestFirstPage.tsx:85` `main[aria-label="Source New request-first workspace"]` | `listSourcingEvents()` via `loadRequestFirstWorkspace` (`new/page.tsx:65`); status enum `loading \| unauthorized \| unavailable \| loaded \| empty` (`SourceNewRequestFirstPage.tsx:17`) | Four distinct states rendered, not one: `unauthorized` (`:190`), `unavailable` (`:197`), `empty`, `loading` (`:183`). Unavailable is separated from empty — a failed read is not "no requests" | Each workspace row links `/source/new/{eventId}` (`new/page.tsx:90`) | `no harness` — route is reached by `cxo-bible-acceptance.spec.ts:142` for a banned-string body assertion only; no capture | `no harness` | `no harness` |
| R2 | `/source/new?mode=intake` / `?intent=…` — originate | `SourceOriginatePage` (`new/page.tsx:57`) | Tenant from `resolveTenant()`; client display name from `client-config` | Not enumerated here — this is a separate surface reached by query param, out of the workspace scope this item names | `?intent=contract-optimization` server-redirects to the Optimize href (`new/page.tsx:32`) | `no harness` | `no harness` | `no harness` |
| R3 | `/source/new/[eventId]` — event workspace shell | `SourceNewWorkspace.tsx:259` `main.snw[aria-label="Source New event workspace"]`, inside `AppShell surface="source-detail"` (`:519`) | Six parallel server reads (`[eventId]/page.tsx:47`): artifacts, activity, authority, stage-04 panel, stage-05 NDA coverage, plus the event itself | `notFound()` on absent tenancy, on a tenant/active-client mismatch (`:37`), and on an unreadable event (`:44`) | Breadcrumb → `/source/new` (`:262`) | `no harness` — **no e2e spec navigates to this route** (verified: every `goto` in `tests/e2e/source/*.spec.ts` targets `/source`, `/source/portfolio`, `/source/queue`, `/source/events/…`, `/source/approvals` or `/source/new`) | `no harness` | `no harness` |

### Workspace chrome

| # | Row | RF | Data / read model | Empty or blocked state | Action destination | Desktop | Mobile | A11y |
|---|---|---|---|---|---|---|---|---|
| C1 | Heading — event name, client, type, lifecycle chip | `header.snw-heading` (`:267`) | `SourceNewEventView` fields direct from the event row | No empty state. `lifecycle` always renders a label via `sourceNewLifecycleLabel` | none (static) | `no harness` | `no harness` | `no harness` |
| C2 | Phase rail | `nav.snw-phases[aria-label="Event phases"]` (`:280`) | `phasesFor(event)` over `SOURCE_NEW_PHASE_ORDER`; per-phase state from `sourceNewPhaseState(item, event, evidence)` where `evidence` reads the event's own facts and filed artifacts, never rail position (`:82` doc comment) | No empty state — the rail always renders four phases. Where no phase is current, `advancedBeyondPhases` (`:243`) supplies an explicit note instead of leaving the rail silent | In-page only: `setPhase(...)` + `setView("work")` (`:285`). `aria-current="step"` marks the selected phase | `no harness` | `no harness` | `no harness` |
| C3 | View tab strip | `nav.snw-views[aria-label="Workspace views"]` (`:302`) | Static `VIEWS` constant (`:61`) | n/a | In-page `setView(...)`; `aria-current="page"` (`:308`) | `no harness` | `no harness` | `no harness` |

### Work view — one subview per phase state

| # | Row | RF | Data / read model | Empty or blocked state | Action destination | Desktop | Mobile | A11y |
|---|---|---|---|---|---|---|---|---|
| W1 | Current phase — "Confirm this request" / "Continue the governed event" | `section.snw-main-work` (`:317`) | `event.trigger`, `event.scope`, `event.decisionOwner` through `fact()` (`:100`) | `fact()` renders the literal **"Not recorded"** for a blank field — absence is shown, not hidden | Via W5 aside | `no harness` | `no harness` | `no harness` |
| W2 | Preview of a later phase — "This phase is not yet open" | `:351` (`stateOf(phase) === "not_open"`) | `PREVIEW_UNMET_CONDITIONS[phase]` (`:68`) — a per-phase sentence, not a generic lock | **This is the empty/blocked state**, and it names the specific unmet conditions per phase plus the explicit sentence "Browsing here does not advance the event." | W5 renders a `button`, not a `Link` — "Current work", `setPhase(current)` (`:468`). Previewing offers no forward destination | `no harness` | `no harness` | `no harness` |
| W3 | Passed phase, nothing recorded — "Nothing is recorded in this phase" | `:364` | `phaseEvidence` returned false for this phase | States the gap explicitly: "That is a gap in the record, not completed work" — a missing record is not rendered as completed work | Conditional panels P1–P4 may render beneath | `no harness` | `no harness` | `no harness` |
| W4 | Passed phase with a record — "Recorded earlier in this event" | `:398` | `phaseEvidence` returned true | n/a | "Viewing it does not mark it complete, approve any gate, or change the current stage." Conditional panels P1–P4 may render beneath | `no harness` | `no harness` | `no harness` |
| W5 | Next action / Event status aside | `aside.snw-next` (`:433`), `aria-label` switches between `"Next action"` and `"Event status"` (`:435`) | `nextAction(event)` (`:158`) keyed on lifecycle then `currentStage` | Completed events render **Event status**, not a next action, and no link at all (`:458`) | `Link` → `/source/events/{id}/approval` when intake review is pending, else `/source/events/{id}` (`:249`). Off-current-phase renders the in-page `button` instead | `no harness` | `no harness` | `no harness` |

### Work view — conditional stage panels

These four render inside W3/W4 only, gated on stage or phase. They never all appear together.

| # | Row | RF | Data / read model | Empty or blocked state | Action destination | Desktop | Mobile | A11y |
|---|---|---|---|---|---|---|---|---|
| P1 | Stage 04 vendor readiness | `section[aria-label="Stage 04 vendor readiness"]` (`:565`); gated `isResponsesStage` (`:110`) | `hasAcceptedSolicitationMotion(event)` + response-typed artifacts via `responseEvidenceRows` (`:119`) | **Blocked state is itemised**: a `blockers` list built at `:553`, rendered under "Open blockers"; when clear it says so rather than rendering an empty list | None. Explicit: "Vendor contact, send, and notification actions stay unavailable until a verified participant authority record exists" | `no harness` | `no harness` | `no harness` |
| P2 | Stage 04 vendor panel | `section[aria-label="Stage 04 vendor panel"]` (`:639`); gated `phase === "suppliers"` | `readSourceNewStage04VendorPanel` — `status: available \| empty \| blocked` (`stage04-vendor-panel.ts:58`) | All three statuses have distinct copy (`:632`); `blocked` renders the projection's own `blockers`, and a `notRecorded` list is always rendered | None — read-only by declaration: "It sends nothing, contacts nobody, and selects no respondent" | `no harness` | `no harness` | `no harness` |
| P3 | Stage 05 NDA readiness | `section[aria-label="Stage 05 NDA readiness"]` (`:711`) | `readSourceNewStage05NdaCoverage` — `status: ready \| blocked \| empty \| unavailable` (`stage05-nda-coverage.ts:28`); per-supplier `state: covered_by_nda \| covered_by_waiver \| not_covered \| unavailable` (`:20`) | **The strongest empty-state handling on the surface.** `unavailable` is rendered as a distinct sentence from `empty` (`:799`): "Candidate-panel authority is unavailable; an empty result is not assumed." Unreadable authority is never collapsed into zero | `Link` → `/source/events/{id}` "Open governed event" (`:807`) | `no harness` | `no harness` | `no harness` |
| P4 | Stage 07 scorecard authority | `section[aria-label="Stage 07 scorecard authority"]` (`:826`); gated `evaluation \| bafo` (`:114`) | `buildScorecardAuthorityView` — `state`, `criteria`, `scoreRows`, `vendorRows`, `blockers`, `guardrail` | Each of the four lists renders an explicit "none loaded" item rather than an empty `<ul>` (`:879`, `:892`, `:915`) | None. Declares it "does not rank vendors, send BAFOs, approve an award or turn an AI suggestion into a final score" | `no harness` | `no harness` | `no harness` |

### Files view

| # | Row | RF | Data / read model | Empty or blocked state | Action destination | Desktop | Mobile | A11y |
|---|---|---|---|---|---|---|---|---|
| F1 | Files toolbar — search, "Older versions" | `.source-new-files__toolbar` (`:300`); search `input[aria-label="Search files"]` | Client-side over the `rows` prop | n/a | In-page state only | `no harness` | `no harness` | `no harness` |
| F2 | Folder rail | `nav[aria-label="File folders"]` (`:321`) | `PHASES` (`:77`); the `other` folder appears only when such files exist, and the comment at `:82` records why they are never hidden | n/a | In-page `setPhase` + clears selection; `aria-current="true"` | `no harness` | `no harness` | `no harness` |
| F3 | File list | `div[role="listbox"][aria-label="Files in folder"]` (`:358`) | `displayRows(rows, includeHistory)` (`:90`) | **Three distinct empty messages, not one** (`:203`): "No matching files" under an active search; "No current version here. N older version(s) hidden — turn on Older versions…" when the toggle is what is hiding them; "No files here yet" otherwise. The middle case is the one that prevents a hidden-by-filter folder reading as empty | Selecting a row opens F4 | `no harness` | `no harness` | `no harness` |
| F4 | File detail pane | `aside[aria-label="Selected file details"]` (`:398`) | The full `SourceNewFileRow` — approval state, lineage, client-final fields, blob digest | Renders nothing until a row is selected | Download → `window.location.href = sourceNewFileDownloadHref(file)` = `/api/v1/source/artifacts/{id}/download`, with `?includeHistory=1` for a non-current version (`SourceNewWorkspace.tsx:151`) | `no harness` | `no harness` — **and this row has mobile-only behaviour no harness can reach**; see [Mobile](#mobile-no-harness-exists-and-two-subviews-have-mobile-only-behaviour) | `no harness` |
| F5 | Files "Upload" command | `button.source-new-files__command` (`:343`), gated `{onUpload && …}` | — | — | **None — this affordance never renders on Source New.** See [Negative control](#negative-control-the-row-originmain-does-not-satisfy) | n/a | n/a | n/a |

### Intelligence view

| # | Row | RF | Data / read model | Empty or blocked state | Action destination | Desktop | Mobile | A11y |
|---|---|---|---|---|---|---|---|---|
| I1 | Fallback — "What can inform this event" | `section.snw-panel.snw-plain` (`:963`), rendered when the `intelligence` prop is absent | `sourceNewCategoryDisplay(event.category)` only | **This is itself the blocked state** and it says so: "Evidence readiness is not available on this view yet", plus the guardrail "A category alone is not a benchmark, savings claim or supplier recommendation" | `Link` → `/source/events/{id}` "View current stage" | `no harness` | `no harness` | `no harness` |
| I2 | Event intelligence workspace | `section[aria-label="Event intelligence workspace"]` (`:991`) | `buildSourceNewEventIntelligence` — `posture: ready \| limited \| blocked` (`event-intelligence.ts:76`), `stageEvidenceContract: available \| not_defined \| unresolved` (`:84`), `requiredEvidence[]`, `governedContext` counts | Empty `requiredEvidence` branches on the contract state (`:1050`) and distinguishes "no separate evidence contract for this stage" from "needs a resolved archetype" — two different facts, not one blank list | `Link` → `/source/events/{id}`; "What is missing" and "next question" panels are read-only | `no harness` | `no harness` | `no harness` |
| I3 | Industry reference requirements | `section[aria-label="Industry reference requirements"]` (`:1136`) | Conditional on the intelligence view carrying them | Section omitted when absent | none | `no harness` | `no harness` | `no harness` |

### Approvals view

| # | Row | RF | Data / read model | Empty or blocked state | Action destination | Desktop | Mobile | A11y |
|---|---|---|---|---|---|---|---|---|
| A1 | Governed decision panel | `section.snw-panel.snw-plain` (`:496`) | `awaitsIntakeReview(event.lifecycle)` | n/a | `Link` → approval or event href. Guardrail rendered: "This overview does not approve or advance anything… approving happens in the governed event flow" | `no harness` | `no harness` | `no harness` |
| A2 | Decision trail | `ol[aria-label="Decision trail"]` (`:1214`) | `listSourceEventActivityEntries(event.id)` → `SourceEventActivityResult` | **Four states, each with its own `data-decision-trail` value** (`:1168`): `not-loaded`, `unavailable` (twice — `!ok`, and `entries` not an array), `empty`, `entries`. The unavailable copy is explicit that it "is not a statement that no decisions were recorded" — an unreadable trail is never rendered as an empty one | Actor / body / timestamp per entry; `"Actor not recorded"` where absent | `no harness` | `no harness` | `no harness` |

### Agent dock

| # | Row | RF | Data / read model | Empty or blocked state | Action destination | Desktop | Mobile | A11y |
|---|---|---|---|---|---|---|---|---|
| D1 | aVa dock | `AgentDock surface="source/new-workspace"` (`:1260`, `surface` at `:1268`) | `useAtlasPageState()` conversation | Empty thread renders the dock with `initialQuote` only | `pageState?.ask(message)`; attachments are appended to the message text as `[Attached evidence: …]` | `no harness` | `no harness` — **mode switches to `collapsed` below 900px** (`:1242`), unreachable by any harness in this repo | `no harness` |

---

## Rows that could not be filled, and why

Three of the seven columns are empty for every row. They are empty for two distinct reasons, and
the distinction matters more than the count.

### Desktop: no harness reaches the workspace route

One Playwright project is configured — `chromium` / `Desktop Chrome` (`playwright.config.ts:15`) —
and a screenshot harness exists (`tests/e2e/source/_audit-harness.ts`, consumed by three Source
specs). Neither reaches this surface. Every `page.goto(...)` in `tests/e2e/source/*.spec.ts` targets
`/source`, `/source/portfolio`, `/source/queue`, `/source/events/{id}`, `/source/approvals`, or
`/source/new` — **never `/source/new/{eventId}`**. R1 is the one route touched, by a banned-string
body assertion that captures nothing.

*What would be needed:* an audited spec that signs in, opens an event workspace, and steps the four
view tabs and the five phase states, capturing through the existing `step()` helper. The harness
supports this today; nothing calls it here.

### Mobile: no harness exists, and two subviews have mobile-only behaviour

There is **no mobile project at all** — `playwright.config.ts:14` declares a single-element
`projects` array. No viewport override appears in any Source spec. So `no harness` here is not "the
spec was not written", it is "the runner has no mobile configuration to write it against".

This is load-bearing rather than cosmetic, because two rows change behaviour below a breakpoint and
nothing can observe either:

- **F4** — at `max-width: 760px` the Files pane becomes a single-column push/pop flow. The detail
  pane is hidden by media query, `openFile` sets `mobileDetailOpen` (`SourceNewFiles.tsx:232`), a
  "Back to files" button appears, and focus and both scroll positions are saved and restored
  (`:209`, `useLayoutEffect`). That is a distinct interaction model, with focus management, that exists only below the
  breakpoint.
- **D1** — at `max-width: 900px` the dock switches to `collapsed`, disables stored mode, and is
  remounted under a different React key (`SourceNewWorkspace.tsx:1242`; remount key `:1261`).

*What would be needed:* a second Playwright project using a `devices[...]` mobile descriptor, or an
explicit `viewport` on a mobile-tagged spec.

### Accessibility: the axe harness covers two public routes

`tests/accessibility/public-axe.spec.ts` is the only axe harness in the repository. Its route list
is literally two entries — `/` and `/sign-in` (`:4`) — tagged `wcag2a wcag2aa wcag21a wcag21aa`.
Every row in this matrix is behind a signed-in tenancy check, so **no row is covered**.

Marked `no harness` rather than `owed to Anand` throughout, and the difference is deliberate: an
a11y verdict here is not waiting on someone to sign in and look, it is waiting on a harness that can
reach a signed-in route at all. `owed to Anand` would misdescribe the blocker as a scheduling one.

What the rows *do* carry, from reading the markup rather than from a checker — landmark roles and
`aria-label` on every navigation and section, `aria-current` on both navigations, `role="listbox"` /
`role="option"` with `aria-selected` on the file list, `:focus-visible` outlines
(`SourceNewFiles.tsx:251`), and explicit focus restoration on the mobile pop. **None of that is an
accessibility check.** It is unverified structure, and is recorded here as such.

---

## Fixture discipline: no row is backed by a tenant-scoped shape

The gate asks for real tenant-scoped fixture shapes and for synthetic evidence to be marked in the
row. Having enumerated the rows, the honest report is that **the marking applies to all of them**,
so it is stated once here rather than repeated 26 times:

> **Every row in this matrix is `synthetic`.** No row's runtime evidence comes from a tenant-scoped
> fixture shape.

Measured, not assumed. `CANONICAL_TENANT_KEYS` (`src/lib/tenant/aliases.ts:153`) is derived in code
from `TENANT_ALIAS_PROFILES` and holds **six** canonical keys. The client keys used by every Source
New rendering fixture are:

| Fixture | Client key used | In `CANONICAL_TENANT_KEYS`? |
|---|---|---|
| `SourceNewWorkspace.test.tsx:41` | `example-client` | No |
| `SourceNewRequestFirstPage.test.tsx:66` | `example-client` | No |
| `source/new/[eventId]/page.test.tsx:23,45` | `tenant-a`, `tenant-b` | No |

*(Keys are named here because they are invented test strings. The six canonical keys are not
listed — this file is in a public repository, and tenant names do not belong in one even while the
tenants are synthetic.)*

The `page.test.tsx` pair is the defensible case: `tenant-a` / `tenant-b` exist precisely to assert
that a cross-tenant mismatch is refused, and an arbitrary pair is the right shape for that. The
rendering fixtures are the gap — `example-client` carries none of the field shapes, alias forms, or
display-name resolution a canonical key would exercise, so **no row above has been rendered against
a shape the live product would produce.**

---

## Negative control: the row `origin/main` does not satisfy

The gate requires at least one row to record a real gap, on the grounds that a matrix coming back
complete has been filled from design intent. Four gaps are recorded above. The sharpest is **F5**,
because it is the only one where the design and the runtime disagree about a row that exists.

`SourceNewFiles` accepts `onUpload?: (phase) => void` (`:73`) and renders an "Upload" command button
gated on it (`:343`). **No production caller passes it.** `SourceNewWorkspace.tsx:477` constructs
`<SourceNewFiles>` with `rows`, `initialPhase`, `marketPackageLabel` and `onDownload` — and no
`onUpload`. A repository-wide search for the prop finds exactly one caller supplying it:
`SourceNewFiles.test.tsx:251`, which asserts the button calls back with the current folder.

So the Files subview has an upload affordance that is **exercised by a test and reachable by no
operator**, and the test passes precisely because it supplies the prop the product does not. This is
the shape the two-lane effort exists to catch: a control that looks covered because its only caller
is its own test.

*Not resolved here, and deliberately.* Whether Source New should offer upload at all is a product
call with an owner — the adjacent Files authority question (instruction 2, E11) is already held open
as an owner decision. The finding is recorded; it is not repaired inside a read-only item.

The other three gaps, restated as rows rather than as harness commentary:

| Gap | Rows affected | Kind |
|---|---|---|
| No screenshot harness reaches `/source/new/{eventId}` | R3 and all 23 rows inside it — **24 of 26** | Missing harness coverage |
| No mobile project exists; F4 and D1 have mobile-only behaviour | **26 of 26**; F4 and D1 materially | Missing runner configuration |
| Axe covers two public routes; none is signed in | **26 of 26** | Missing harness capability |

---

## Measured counts, and how to re-run them

Every harness claim above is a count, not an impression. Each is reproducible from the repository
root on the commit this file lands on.

| Claim | Command | Result |
|---|---|---|
| No test of any kind references the event-workspace route | `grep -rn "source/new/" tests/ \| grep -v '\.jsonl'` | **0 matches** |
| Playwright has one project, desktop only | `projects:` array in `playwright.config.ts:14` | **1** — `chromium` / `Desktop Chrome` |
| One axe harness exists | `grep -rl "AxeBuilder" tests/` | **1 file** |
| It covers two public routes | `path:` entries in `tests/accessibility/public-axe.spec.ts:4` | **2** — `/`, `/sign-in` |
| The Files upload affordance has no production caller | `grep -rn "onUpload=" src/` restricted to `SourceNewFiles` | **1 caller, and it is `SourceNewFiles.test.tsx:251`** |
| Source New rendering fixtures using a canonical tenant key | cross-check fixture keys against `CANONICAL_TENANT_KEYS` (`src/lib/tenant/aliases.ts:153`) | **0 of 3** |

The `.jsonl` exclusion in the first command is deliberate and is not hiding a match: the two files it
drops are agent-quality golden prompt corpora (`tests/agent-quality/golden/`), which contain the
string in natural-language prompts and navigate nothing.

---

## What this matrix does not claim

- **No percentage or completeness score appears above.** The gate forbids one, and the reason is
  visible in the result: a ratio over these rows would read as "3 of 7 columns filled, 57%" and
  would flatten the difference between a column that is empty because a spec was not written and a
  column that is empty because the runner cannot express it.
- **No signed-in verdict.** Nothing here was observed in a running product. Every cell is read from
  source on the commit this file lands on. The signed-in operator journey stays owed.
- **No claim about `/source/new?mode=intake` (R2) beyond its entry conditions.** `SourceOriginatePage`
  is a separate surface; enumerating its subviews is not this item.
- **Line numbers are as of this commit** and will drift. Each row also names its accessible label or
  selector, which is the durable handle.
