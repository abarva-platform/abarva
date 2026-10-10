# 2026-10-10 — Moves P3 Step 4 "Estimate the work bottom-up" step page

## Release ID

`2026-10-10-moves-p3-step4-rom`

## Status

`candidate`

## Plain-English Summary

P3 Design Step 4 becomes its own step page, built to the final step page
template (v1.9). It is where a consultant counts what gets built, prices it
with a delivery pod, groups it into releases and approves the estimate that
P4 plans from. It opens at `?step=rom-estimate` only for a workspace that has
both the step pages and the ROM engine turned on.

What the page does:

- **Counts.** A grid of use cases (plus one shared foundation, counted once)
  by the six component kinds. Counts drafted from session notes show
  `Session notes · review` and their citation; each row is confirmed on its
  own.
- **Unit hours, never defaults.** Each component's hours are a reference to a
  register assumption (`[A:DL3]`) or an approved benchmark. An open register
  row reads "Not set. Needs A:DL3, still open with …" and links to where the
  register answers it; its working figure feeds only a provisional preview,
  and the page says so. A component with no reference reads "Not set" and
  nothing is computed from it.
- **Delivery pod, factors and releases.** The pod table shows rates from the
  cost foundation, with flags only on affected members (a proposed role
  mapping to approve, a clamped level). Friction, productive share and weekly
  capacity each carry a source. The release grouping is accepted as a whole.
- **The estimate.** Hours, weeks and low / plan / high per release, the
  shared foundation once, and the combined total, all computed by the ROM
  service through the existing read-only preview route. The page does no
  estimate arithmetic. While inputs are open it reads "Provisional until …
  are confirmed". "Download the workbook" calls the same route with
  `?format=xlsx`. "Approve the estimate" is enabled only when every input is
  confirmed and the service priced exactly those inputs; it stores the
  approver, the time, a fingerprint of the inputs and the computed snapshot.
- **Assumptions this estimate relies on.** A collapsed, read-only list of the
  register rows the estimate cites, read from the register's list route.
- **Next action.** Clauses follow row order and the count reads
  "{n} of 4 inputs confirmed". The step is Ready only after approval, and the
  step bar ticks Step 4 only while the approval still matches the inputs.
- **Blocked.** The step waits on Step 2 being done. Step 3 has no step record
  yet, so it cannot block Step 4; the page and this record say so.
- **Fill from notes.** aVa drafts counts from pasted notes, word for word,
  with the line they came from, into use cases nobody has confirmed. It never
  overwrites a typed count and never fills unit hours or rates.

### P3 switches to step pages (sunset)

With this page, every P3 step has a page. For a tenant with `moves_step_pages_v3`, `moves_capture_v2` and `moves_rom_engine_v1` (today only the synthetic demo tenant), the P3 address therefore opens the first open step page instead of the capture flow. This uses the sunset routing from `2026-10-10-moves-step-pages-scaffold-p0145`. `?legacy=1` keeps the old flow for comparison. Without the ROM flag, Step 4 is not counted as a page, so P3 does not switch. The P3 rows in `docs/build/moves-legacy-sunset.md` are now `hatch-only`. Deleting the old code is a separate PR after a signed-in walk.

## Layer Impact

- Release lane: `global-control-lane`, behind two tenant flags.
- Layer 3 (canonical model): a new step record, `rom_estimate`, declared in
  the phase workflow registry and stored beside the phase's answers through
  the existing capture route. Text readers get a ranked plain-text summary;
  the gate's phrase checks get only the team's own names.
- Layer 3 calculation library: the ROM service's total now also carries the
  combined whole pod-weeks (release weeks plus foundation weeks, once), so the
  page can show combined weeks without computing them. The driver constants
  moved into a small module the service re-exports, so a client surface can
  name them without loading the service's data-plane rate resolver.
- Layer 4 (products): one new Moves step page and its host wiring. No route,
  schema, migration or reference data changes.

## Client Applicability

- All clients: no change. The page mounts only with both flags.
- Specific clients: the synthetic demo tenant, where both flags are enrolled.
- Internal only: no.
- Public/demo only: no.
- Feature flags: `moves_step_pages_v3` AND `moves_rom_engine_v1`. The register
  read uses `moves_assumption_register_v1`.

## Changes Included

- `src/lib/programs/rom-estimate.ts` (new): the record, parsing, the
  unit-hour resolution against the register, the four input categories, the
  row states and next action, the structure for the preview route, approval
  and the text readers.
- `src/lib/programs/rom-estimate-notes.ts` (new): the deterministic notes
  fill for counts.
- `src/components/strategic-moves/step-page/RomEstimateStep.tsx` (new): the
  page.
- `src/components/strategic-moves/step-page/MovesStepPage.tsx`: exports the
  row view for the output block. `MovesStepPage.module.css`: the v1.9 rules
  (count grid, results table, flags, withheld, form grid), from tokens only.
- `src/lib/programs/phase-workflow-registry.ts`: P3.4 owns `rom_estimate` on
  every route, so P3.4 leaves the known capture gaps.
- `src/lib/programs/structured-capture-text.ts`: the `rom_estimate` entries.
- `src/lib/programs/step-page-views.ts`: `rom-estimate` → P3.4.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` and the
  phase page: the flag, the mount, the step-bar completion and the capture's
  link to Step 4.
- `src/lib/pricing/moves-workflow/rom-service.ts`,
  `rom-drivers.ts` (new): combined weeks; driver constants split out.
- Tests: two new suites, plus cases in the registry, step-view, ROM service
  and phase host suites.

## QA / Validation

- Model suite (`rom-estimate.test.ts`, 41 cases): parsing, unit-hour
  resolution in every register state (confirmed, corrected, open, proposed,
  superseded, rejected, missing, unread, benchmark, unset), the four
  categories, the next action (the design's opening sentence, "0 of 4 inputs
  confirmed", six open, approval last, Ready only after approval, blocked),
  the structure handed to the service (working figure only for an open row;
  no figure means nothing computed), approval and its fingerprint, register
  drift, edits, the notes fill and both text readers.
- Page suite (`RomEstimateStep.test.tsx`, 24 cases): every row's states, the
  no-default line, the provisional line, the results table read from the
  preview route, the workbook download call (`?format=xlsx`, same body), a
  workbook refusal, the approval flow and Reopen, the approved snapshot
  shown without a live read, a refused estimate, a failed register read and
  retry, the compact register group, the withheld viewer, the blocked state
  and the notes fill.
- Host suite: mount with both flags, off with either flag off, the step bar
  ticking Step 4 only for a current approval, and the capture's link.
- Registry, step-view and ROM service suites updated (combined weeks pinned
  at 6 in the golden case).
- Mutation checks: 32 mutants across the model, notes fill, page, host,
  registry, dispatcher, step views and service, applied one at a time and
  restored from a private copy; all killed.
- Affected suites: 238 suites, 3,874 tests, pass.
- `npm run typecheck`: clean. ESLint on the changed files: clean (one
  pre-existing warning in the host).
- `npm run audit:lib-orphans`: no change against the baseline.
- Route reachability: no new unreachable components or exports. Export
  reachability: exactly the recorded baseline.
- Test CI coverage census: two new test files, both swept
  (`coveredTestFiles` 2,783 → 2,785).
- Tenancy fence census: unchanged (no route changes).
- `npm run docs:nexus-manual:check`: current.
- Visual: the real component rendered to HTML with the module CSS, in light
  and dark, read at 1440 and 390 against the design mock; no horizontal
  overflow at 390.

## Rollout Plan

Merge through the protected main branch after the ROM service increment it
is stacked on. The repo-owned ACA main deploy workflow builds and deploys the
digest-pinned image. The page stays off for every workspace except the
enrolled synthetic demo tenant.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the required worker images match the
  approved digest.
- Feature/env flag update path: the registry entries in
  `src/lib/features/registry.ts`, or the flags' tenant allowlist environment
  variables, through the same deploy workflow.
- Live signed-in proof required: open `?step=rom-estimate` on a demo-tenant
  Move, confirm a count, see the preview, download the workbook and approve,
  before this is called live-proven.

## Rollback Plan

Remove the tenant from `moves_rom_engine_v1` (or `moves_step_pages_v3`), or
revert through a pull request. A saved `rom_estimate` record stays in the
capture module and is read as plain text by the text readers if the page is
off; nothing else depends on it.

## Audit Evidence

- Pull request and CI results.
- The test, mutation and render results above.
- Renders of the real component (light and dark, read at 1440 and 390) kept
  beside the design review files.

## Known Gaps

- The assumptions register screen is not built yet. "Answer A:DLn…" links to
  the phase page anchored at the row (`#assumption-DL3`) until the Record
  tab's register exists.
- The results table shows the shared foundation as its own row beside the
  releases, because the service prices it as its own block; the design folded
  it into the release that carries it.
- "Template n of 107" is not shown: the preview response does not carry the
  pod library's size or the template's index.
- Approved benchmarks can be displayed and priced when the record holds one,
  but no benchmark library exists yet to add one from the page.
- Pod, factor and release editors are minimal inline forms; "Edit members…"
  is not built.
- A viewer without financial visibility sees the register's rows with figures
  withheld, so the unit hours cannot be checked and the step reads as waiting
  for someone who can see them. The preview route itself does not redact
  rates; the page hides them unless the register says the viewer may see
  figures.
- The approved snapshot lives in the capture record, which every reader of
  the Move's capture values can read.
- The step bar checks the approval against the record's own inputs; only the
  page also checks that the register's answers have not moved since.
