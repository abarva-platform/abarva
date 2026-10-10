# 2026-10-10 — Moves assumptions register: the first screen and the charter bridge

## Release ID

`2026-10-10-moves-assumption-register-ui`

## Status

`candidate`

This is the third of five changes that build the Move-level assumptions
register. It is stacked on `2026-10-10-moves-assumption-register-routes`
(storage, domain rules, routes and the aVa propose tool) and ships behind the
same flag.

## Plain-English Summary

With `moves_assumption_register_v1` on, a Move now has an **assumptions
register**, and the charter's own assumptions join it. The screen follows
Claude Design's final register design (step page template v1.9, review 5) and
is built from the step pages' own stylesheet and tokens, in light and dark.

**On a phase page: one collapsed group.** The capture flow's opening band,
beside the P2 charter carry-forward band, carries a single collapsed group,
`Assumptions register · n in use · k to answer`. Its summary line counts rows
by status (open, confirmed, corrected, superseded). Opened, it lists only the
questions still to answer, each with `Answer…` (or `Set role…`) in place, and
links to the full register. The design's clutter rules hold: no full register
and no aVa proposals on a phase page.

**The full register: the Record entry.** The template puts the full view on a
Record tab, and there is no Record route yet. The phase page's Intelligence
view is the Record tab's predecessor in the tabs design, so the full register
renders there, below the phase intelligence panel; the compact group's link
opens it. No new tab system was built. It shows:

- each row as: `ID · statement`, why it matters, the working figure tagged
  ESTIMATE with its source (a corrected row shows its answer figure, cited to
  the answer's source), `owner role · confidence (Low, Medium or High) · where
  it came from`, and the answer with its source once answered. The status sits
  on the right; `Answer…`, `Set role…` and `Supersede…` are quiet links;
- two views: **by area** (Value, Data, Delivery, Adoption, each `n · k open`)
  and **by owner**, which lists only the rows to answer, grouped by owner role
  with `Owner not set as a role` last, plus `Copy the open questions for the
  client`. Copying uses the clipboard; where the clipboard is missing or
  refused, the text appears selected in a read-only box;
- aVa's proposals apart, under `aVa proposals · not yet in the register`, badged
  `Ava draft · review`, with Accept and Reject. A proposal without a figure
  reads `Working figure to be set: the source states none`;
- superseded and rejected rows in their own collapsed group; a superseded row
  names its replacement;
- a stale charter row reads `Re-check.` with the reason, and its answer control
  becomes an outlined `Re-answer…`;
- a charter row whose owner was a named person reads `Owner named in the P1
  charter, set a role`;
- for a viewer without financial visibility: `Figure withheld · no financial
  visibility`, `Answer withheld`, and no actions;
- inline forms. Answering needs a choice of Confirmed or Corrected (nothing is
  preselected unless only one is allowed) and a source; Corrected also needs
  the new figure. Superseding needs what replaces the row: a row already in the
  register, or a new assumption. Adding needs the area, owner role, assumption,
  working figure and source; a person's name is refused as an owner role.

Every change goes through the register routes. When a route refuses, the
panel shows the route's own sentence word for word, because that sentence
says whether anything was saved. Everything is plain text.

**The charter bridge.** P1 lets a charter answer stand on an assumption, with
an owner and a plan for validating it in Discover. Each such answer now gets
one register row: origin "charter carry-forward", confidence 1, raised in
phase 1, an owner, and a pin to the exact wording of the charter answer.

- **The owner role is never a person.** The P1 basis asks for an owner, not a
  role, and the owner role reaches generation prompts. The owner value goes
  through the same owner-role check the aVa propose tool uses. A role (for
  example "Finance Director") becomes the owner role. A person's name, an email
  address or an honorific is kept in the row's owner name, which no generation
  view or governed context object carries, and the owner role is set to
  "Owner named in the P1 charter". The panel shows that row with a prompt to
  set a role (and a "Set role" control while the row can still be edited) and
  never shows the name.
- **The register routes hold the same rule.** Adding a row, editing a row's
  owner role, and superseding with a new replacement row are refused with
  `owner_role_is_a_person` (400) when the owner role reads like a person. The
  sentence says nothing was saved, that the owner field takes a role such as
  CFO office because documents and aVa read the owner role, and that the
  person's name can go in the owner name field. The owner name field still
  accepts a name; no generation view reads it.

- The P1 basis stays the declaration. Nothing edits the charter.
- The register owns the resolution. Once the register row is answered (or the
  row that superseded it is answered), the P2 carry-forward band stops listing
  that assumption as open.
- If someone edits the charter answer afterwards, the register row is flagged
  on screen as raised from an earlier wording, until someone answers it
  against the current one. An answer about the old wording does not resolve
  the new one. The row itself is never rewritten.

**Where the bridge runs, and why.** On the phase page load, on the server, and
only once the Move is past the charter (current phase 2 or later), and only
when the person opening the page can change the register. It is idempotent on
the charter section: a section that already has a row is never written again.

- Fewest writes: one insert (plus its history event) per declared charter
  assumption, ever. Every later page load is a single register read with no
  writes.
- Safer than the P1 capture save: while the charter is being drafted, a basis
  is declared, edited and re-declared freely. Bridging on save would mint a
  row for each draft and immediately flag it stale on the next edit, and it
  would add a second write, and a second way to fail, to the hottest save path
  in Moves. Bridging on save would also never pick up assumptions declared
  before the flag was turned on; the page-load bridge does.
- A read-only viewer opening the page never causes a write. A row is
  attributed to the person who declared the assumption in P1, not to whoever
  opened the page.
- If the register or the charter cannot be read, nothing is written, no row is
  flagged either way, the carry-forward band reads exactly as before, and the
  panel says the charter could not be checked.

## Layer Impact

- Release lane: `client-data-lane`, feature-flagged.
- Layer 3, canonical model: no schema change. The store gains
  `upsertCharterAssumption`, an insert-if-absent keyed on the charter section,
  backed by the existing `uq_move_assumptions_program_charter_section` index.
  It never overwrites a row. Charter rows are derived from the declared P1
  basis (identity declared, never inferred).
- Layer 4, products: Moves gains its first register screen. The P2 charter
  carry-forward reads the register's resolution. No other product changes.
- Layers 1 and 2: no intake or adapter changes.
- Governance: no new dataset. Charter rows are ordinary register rows under the
  existing `moves-assumption-register-v1` manifest; nothing new reaches a
  model.

## Client Applicability

- All clients: no behaviour change with the flag off. The panel is not
  mounted, the register is not read, and the bridge never runs.
- Specific clients: the synthetic demo tenant has the flag on.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_assumption_register_v1` (tenant policy, synthetic demo
  tenant only). The carry-forward band itself still needs its own flag,
  `moves_charter_assumptions_discover_v1`, which stays off everywhere.

## Changes Included

- `src/components/strategic-moves/assumptions/AssumptionRegisterPanel.tsx`
  (new): the register in two variants, `compact` and `full`, described above.
  It uses the step pages' CSS module and their `SourceLine` / `SourceTag`
  exports; it has no styles of its own and no hard-coded colours. What a row
  offers is read from the model's transition table, so the controls cannot
  drift from the rules.
- `src/components/strategic-moves/step-page/MovesStepPage.module.css`: the
  template v1.9 register rules from Claude Design's `core.css` (`reg-meta`,
  `withheld`, `form-grid`) plus a few product-port rules that replace the
  mock's inline paddings. All values are existing tokens.
- `src/components/strategic-moves/step-page/MovesStepPage.tsx`: exports its
  theme hook, so the register follows the same light/dark toggle.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: mounts the
  compact group in the capture flow's opening band, beside the carry-forward
  band, and the full register in the Intelligence (Record) view, from one
  server-resolved prop (`assumptionRegister`); `null` mounts nothing.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`:
  resolves the flag, runs the bridge, passes the register's resolution to the
  carry-forward fold, and passes the panel its mount. A failed charter read is
  now remembered, so the bridge never mistakes it for "no assumptions".
- `src/lib/programs/assumption-register/charter-bridge.ts` (new, server-only):
  the declared charter assumptions, the row each becomes, the stale and
  resolved readings, the bridge itself, when it may write, and the panel's
  mount.
- `src/lib/programs/assumption-register/owner-role.ts` (new, pure): the
  owner-role heuristic, moved here unchanged from the aVa propose tool so the
  tool, the bridge and the panel share one copy, plus the charter placeholder
  role and `ownerNeedsRole`.
- `src/lib/agent/tools/program/proposeAssumption.ts`: imports the heuristic
  from its new home; behaviour unchanged.
- The register routes (`assumptions/route.ts`, `[assumptionId]/route.ts`,
  `[assumptionId]/decision/route.ts`), `register-route-access.ts`
  (`personAsOwnerRoleResponse`) and `assumption-register-refusal.ts` (the new
  `owner_role_is_a_person` code and its sentence): the owner-role rule on
  create, edit and supersede-with-a-new-row, checked before the store.
- `src/lib/programs/assumption-register/store.ts`: `upsertCharterAssumption`.
- `src/lib/programs/charter-assumptions-carry-forward.ts`: an optional
  `registerResolvedSectionKeys`; absent or `null` reads exactly as before.
- Tests: the new panel suite
  `src/components/strategic-moves/__tests__/AssumptionRegisterPanel.test.tsx`,
  the new bridge suite
  `src/lib/programs/__tests__/assumption-register-charter-bridge.test.ts`, new
  upsert cases in the store suite, and two host cases in
  `MovesPhaseStandaloneClient.test.tsx`.
- `.github/workflows/ai-surface-control-catalog.yml`: the panel suite is named
  in the required job's Moves component step. `src/components/strategic-moves/__tests__`
  is not swept by directory anywhere, so a suite placed there runs only if it
  is named. The bridge suite is swept by the same job's
  `src/lib/programs/__tests__` directory step.
- The regenerated test CI coverage census.

## QA / Validation

- Panel suite (rewritten for the final design, 72 tests): nothing renders and
  nothing is fetched with the flag off, in either variant. Compact: counts by
  status and to answer, never a proposal, never the full register; only the
  open questions, in register order, with `Answer…` in place and no
  Supersede; answering in place; the link to the full view, and no link when
  the host gives none; nothing rendered for a register holding only proposals;
  a failed read reported; withheld figures with no actions. Full: the row
  anatomy line by line; confidence words; origin words; a row with no figure;
  statuses and answers (a corrected row on its answer figure); the superseded
  and rejected group; by area (order, counts, open by default); by owner (only
  rows to answer, grouped by role, role-less group last, an answered row that
  still needs a role included); the copy to the clipboard with the exact text,
  singular and plural, and the select-text fallback when the clipboard is
  missing or refused; a withheld figure never written into the copy; withheld
  figures and answers with no actions (register-wide and per row); a read-only
  viewer with no controls; proposals (badge, to be set, evidence badge,
  Accept/Reject bodies, refusals word for word); each form's validation
  (answer: choice and source, Corrected also the figure, a stale confirmed
  row only as a correction; supersede: a choice, a row or a new assumption,
  the role-less owner not carried; add: each required field alone holds it, a
  name refused); stale rows (`Re-check.` wording for answered and open rows,
  outlined `Re-answer…`); needs-a-role rows; failures.
- Bridge suite (new, 46 tests): the row a charter assumption becomes (origin,
  confidence 1, phase 1, owner, revision pin, area per section); only an
  assumption basis against the current wording is bridged; idempotence (a
  second load writes nothing, only the missing section is written, a row
  stored by a racing load is not counted as created); a read-only viewer or an
  open charter never writes; refused and failed writes are reported; a row
  whose history entry failed counts as landed; a failed register read is
  `unavailable` and writes nothing; staleness (edited wording, answered before
  or after the re-declaration, superseded rows never flagged); and the P2
  carry-forward band through the real fold: confirmed and corrected rows
  resolve, an open row or a row superseded by an open row does not, a looping
  supersede chain resolves nothing, and an answer about the previous wording
  does not resolve the current one.
- Owner handling: a name, an email address and an honorific go to the owner
  name with the generic owner role and `ownerNeedsRole`; roles pass through
  with no owner name; a blank owner never becomes a blank role; on an actual
  bridged row (open and answered), `toApprovedAssumption`, the governed object
  and the agent-context feed never contain the name. The panel prompts for a
  role without showing the name, and "Set role" patches the row with its
  revision and refuses a name. The aVa tool suite passes unchanged against the
  moved heuristic. 17 further mutations over this handling, applied one at a
  time and restored from an in-memory copy: all 17 killed.
- Route suite: 16 new cases. A name, an email address and an honorific are
  refused on create and on edit with the exact sentence and nothing reaches
  the store; a supersede's replacement row is held to the same rule; four
  roles (including the one-word Treasury) are accepted on create and edit; a
  name in the owner name field is accepted on create and edit; an edit that
  does not touch the owner role is not checked against it, even when other
  fields read like a name. 10 mutations over this, one at a time: all killed
  (one survived first, an edit that checked the wrong field; the case above
  now pins it).
- Store suite: 6 new upsert cases (created once; second call returns the
  existing row and writes nothing, keeping the original pin; read inside the
  tenant fence under either tenant key; a lost race returns the winner's row;
  non-charter input and a foreign Move refused with nothing written).
- Host suite: 2 cases. Flag off mounts nothing and makes no register read;
  flag on mounts the compact group inside the capture flow (and not the full
  register), reads this Move's register once, and its link opens the
  Intelligence (Record) view, where the full register renders and the compact
  group does not.
- Restyle mutations (final design): 29 mutations over the panel and 4 over the
  host mount, applied one at a time and each restored from a private copy.
  All 33 killed. Three survived the first run: two led to stronger cases (an
  answered row needing a role is still to answer; rows given out of register
  order), and the third was a guard that could not change behaviour, which was
  removed.
- Visual check: the real component rendered by a temporary jest test to HTML
  with the step-page CSS, compared against the mock at 1440 and 390 in light
  and dark, with no horizontal overflow in any state. The temporary test was
  deleted.
- Mutation checks: 73 mutations over the panel, the host mount, the bridge, the
  carry-forward fold and the store upsert, applied one at a time and each
  restored from an in-memory copy. All 73 were killed. One survived the first
  run (re-reading the register after every refusal); a case now pins that a
  refusal that changed nothing does not re-read it, and the mutant is killed.
- Affected suites: pass. `src/lib/programs/__tests__` (whole directory), the
  register route suite, the aVa propose tool suite and the features suites:
  225 suites, 3,493 tests. The panel, host, carry-forward, standing-after-
  Discover and capture-flow component suites: 5 suites, 395 tests. After the
  owner handling: `src/lib/programs/__tests__`, the register route suite, all
  of `src/lib/agent/tools/__tests__` and the features suites, 238 suites and
  3,601 tests; the panel, host and carry-forward suites, 352 tests.
- `npm run typecheck`: pass. ESLint on the changed files: no errors; the one
  warning (`MovesCaptureFlow` unused in the host) predates this change. New
  files follow Prettier; the two host files were already unformatted at base
  and only my hunks were checked.
- `npm run audit:lib-orphans`: no change against the baseline.
- `node scripts/audit/route-reachability-check.mjs`: no new unreachable
  components or exports. `npm run check:export-reachability`: pass.
- Test CI coverage census: test files 2,938 to 2,940 and covered test files
  2,774 to 2,776, exactly the two new suites. The panel suite is covered by
  being named in the required job; the bridge suite by the
  `src/lib/programs/__tests__` directory step.
- `npm run audit:tenancy-fence-coverage:check`: pass, no regeneration needed
  (no route changed).
- `npm run docs:nexus-manual:check`: pass after regenerating for the updated
  flag summary.
- No browser walk was run: the register tables are not applied to any
  database yet.

## Rollout Plan

Merge through the protected main branch, after the routes release it is
stacked on. The repo-owned ACA main deploy workflow builds and deploys the
digest-pinned image. No migration. The register tables come from the routes
release's migration, applied only through `.github/workflows/db-migration-lab.yml`.
Until that migration is applied, the panel shows the route's
`register_read_failed` sentence, the bridge reports the charter as not
checked, and the carry-forward band reads as before.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the required worker images match the
  approved digest.
- Feature/env flag update path: code registry (`includeTenants`).
- Live signed-in proof required: after the migration is applied, a signed-in
  demo-tenant walk on a Move past P1 with a charter assumption: the charter
  row appears once (and not again on reload), a team row is added and answered,
  an aVa proposal is accepted, and a read-only viewer sees figures withheld and
  no controls. Until then this release is `deployed`, not `live-proven`.

## Rollback Plan

Revert through a pull request, or turn the flag off for the demo tenant in the
code registry: the panel unmounts, the bridge stops, and the carry-forward band
reads as before. Charter rows already written stay in the register as ordinary
rows; they are not deleted.

## Audit Evidence

- Pull request and CI results, including the required job's Moves component
  step that now names the panel suite.
- The suites and mutation results above.
- After apply: the signed-in walk.

## Known Gaps

- Claude Design has the renders of the restyled screen for review; it has not
  yet signed them off.
- Deviations from the mock, on purpose: (1) Supersede asks for what replaces
  the row (an existing row or a new assumption) rather than a free-text
  reason, because the register stores a superseded row's replacement and has
  no reason field; a reason needs a column. (2) The answer form does not say
  "the value and cost numbers re-run", because nothing in the product re-runs
  yet. (3) The owner role is typed, with the name check, because the product
  has no canonical role list. (4) The compact group shows the whole register's
  open questions, because phase pages do not yet record which rows a step's
  numbers cite; it sits in the opening band, because the capture flow has no
  Settled group to follow. (5) Every row's meta line names its origin,
  including team rows. (6) A viewer who can edit but cannot see figures gets
  no actions, as the design says, even though the routes would accept them.
- The owner check is a heuristic: it flags an email address, an honorific,
  or two or three capitalised words with no role word. A single bare first
  name is NOT flagged, on purpose. The cheap rule (one capitalised word that
  is not on the role-word list) would refuse common one-word functions that
  are not on that list, such as Treasury, Marketing, Sales, Audit, Payroll or
  Claims; the aVa tool's suite already accepts Treasury as a role. So a bare
  first name can still reach the owner role through the routes or the tool.
- A stale charter row is flagged on screen only. The row keeps its original
  wording and pin; the team answers or supersedes it.
- The bridge writes on a page load (a GET). It is an idempotent projection of a
  declaration that already exists, limited to people who can change the
  register, and costs one read when nothing is missing.
- The unshipped `planCharterAssumptionResolutionWrite` slice in
  `charter-assumption-resolution.ts` is left in place; removing it is a
  separate change.
- No document generation or validator reads the register yet. Those are the
  next two changes.
