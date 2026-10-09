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

With `moves_assumption_register_v1` on, a Moves phase page now shows the Move's
**assumptions register**, and the charter's own assumptions join it.

The register panel sits in the capture flow's opening band, beside the P2
charter carry-forward band. It shows:

- a table of the register: ID (for example V3), area, the assumption, the
  working figure tagged "est", the owner role, confidence as a word (Low,
  Medium, High for 1, 3, 5), the status, and the answer with its source once
  answered. A superseded row names the row that replaced it;
- aVa's proposals in their own group, labelled "aVa proposals — not yet in the
  register", with Accept and Reject. A rejected proposal is not shown as a
  register row;
- for people who can change the register: add a row, answer a row (Confirmed
  or Corrected, always with the answer's source; a correction must state the
  corrected answer), and supersede a row with a new one;
- "withheld" in place of every figure for a read-only viewer without financial
  visibility.

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
  (new): the register panel described above. What a row offers (accept,
  reject, confirm, correct, supersede) is read from the model's transition
  table, so the controls cannot drift from the rules. A disabled control's
  look is driven by the `disabled` attribute itself.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: mounts the
  panel in the capture flow's opening band, beside the carry-forward band,
  from one server-resolved prop (`assumptionRegister`); `null` mounts nothing.
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

- Panel suite (new, 33 tests): nothing renders and nothing is fetched with the
  flag off; each status in its own words, including "Superseded by" the
  replacement's ID; confidence 1, 3 and 5 as Low, Medium and High; the "est"
  tag on a working figure; "withheld" when either the register or the row
  withholds figures, including answer figures; proposals in their own labelled
  group and never in the table, and rejected proposals not shown; Accept,
  Reject, Answer (confirmed and corrected), Supersede and Add each call the
  right route with the row's revision and the exact body; a refusal's `detail`
  is shown word for word, a refusal without one never claims nothing was saved,
  a refusal that changed nothing does not re-read the register, and one that
  stored a replacement does; a change saved without its history entry says so;
  a read-only viewer gets no controls; a failed read is shown, never an empty
  register; only the stale charter row is flagged.
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
- Store suite: 6 new upsert cases (created once; second call returns the
  existing row and writes nothing, keeping the original pin; read inside the
  tenant fence under either tenant key; a lost race returns the winner's row;
  non-charter input and a foreign Move refused with nothing written).
- Host suite: 2 new cases. Flag off mounts no panel and makes no register read;
  flag on mounts the panel inside the capture flow and reads this Move's
  register.
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

- Claude Design has not yet reviewed the panel.
- The owner check is a heuristic shared with the aVa tool: it flags an email
  address, an honorific, or two or three capitalised words with no role word.
  A single bare first name is not flagged. The register's add and edit routes
  do not run the check yet; the panel's "Set role" form does.
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
