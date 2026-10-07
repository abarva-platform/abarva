# 2026-10-07-p2-upload-evidence-family-declaration — the P2 readiness upload can declare the evidence family it covers

## Release ID

`2026-10-07-p2-upload-evidence-family-declaration`

## Status

`candidate`

## Plain-English Summary

The P2 readiness panel — the upload control that sits beside the current-state
readiness map and is the surface a Move's discovery evidence is actually
uploaded through — asked the user to supply named evidence families while
giving them no way to say which family a file covered. The FILE NAME decided,
through a three-tier heuristic, and a name the heuristic could not place was
refused outright with "No open current-state family matched this file." There
was no control on the screen that could make the instruction beside it true.

The other evidence upload control (`EvidenceUploadControl`) already offers a
family picker and honours what the uploader declares. The readiness panel had
no counterpart, so the fix had been applied to one caller and not to the one
the readiness map renders.

This change gives that panel the same declaration, with the same precedence
the coverage reader uses:

- **A "These files cover" picker** listing every family the readiness map shows
  as still open, in the map's own order, defaulting to "Decide from the file
  name" so a correctly named file keeps working exactly as it did.
- **A declared family wins**; the file-name heuristic is the fallback for an
  undeclared file only, and runs unchanged.
- **A declaration naming a family that is no longer open is refused, not
  quietly re-inferred** — a picker honoured sometimes and overridden silently
  other times is worse than one that says it could not be honoured.
- **An undeclared file the heuristic places nowhere now says what to do**:
  "Declare the family this file covers and upload it again."
- **Each result row states how the family was decided** — declared, or guessed
  from the file name with the number of families it matched. Until this line,
  the only visible difference between a declared placement and a guessed one
  was how many review rows appeared.

Declaring routes review and nothing else. Coverage still counts only evidence
a human has approved, so a declaration cannot clear a gate, advance a phase, or
stand in for review.

**Why the declaration is the primary path and not a convenience.** Measured
against one archetype's twelve real evidence families, using twenty file names
a practitioner would plausibly give those artifacts: four of the twenty reach
no family at all and were refused with no way through, and one name routes a
single file into eight families at once. The heuristic's third tier matches
only family keys belonging to two specific archetypes, so for every other
archetype the second tier — a word overlap with the family's own key and
label — is the last tier that can match. A file name that does not restate the
family's own words is not a reliable way to supply evidence.

## Layer Impact

Lane: `global-control-lane`.

- **Products (Moves):** the P2 phase surface only. No product owns data here
  and none is introduced. The declaration selects which existing evidence
  family an upload is filed under; it does not change the canonical model, the
  ingest routes, the coverage reader, tenancy, or any gate rule. Evidence still
  lands as review-required and is counted only once approved.
- **Canonical model:** unchanged. No migration, no schema change.

## Client Applicability

- All clients: yes — the picker renders for every tenant that reaches the P2
  readiness panel. It is additive and defaults to the previous behaviour, so no
  existing flow changes unless a user chooses a family.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is backward-compatible by construction: with
  nothing declared, `resolveCurrentStateUploadFamilies` returns exactly what
  the previous inline heuristic returned, and the heuristic itself moved
  unchanged.

## Changes Included

- `src/lib/programs/evidence-readiness/current-state-upload-routing.ts` — new
  module. Owns the whole placement decision: `resolveCurrentStateUploadFamilies`
  (declared wins, file name is the fallback, both failure modes carry a
  reason), `declarableCurrentStateFamilies`, `currentStateUploadDeclarationState`
  (the dead-end detector, parameterised on what a surface actually offers so it
  can answer in both directions), and `inferCurrentStateFamilies` — the
  three-tier file-name heuristic, moved here from the host component with its
  tiers kept byte-for-byte so an undeclared file lands where it always did.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the ~165
  lines of heuristic and its alias table move out to the module above; the
  readiness panel gains the declaration state, the picker, and the routing
  call, and each result row states the basis. The picker is hidden for the
  session-notes upload mode, which covers no family.
- `src/lib/programs/evidence-readiness/__tests__/current-state-upload-routing.test.ts`
  — new, 22 cases: precedence, both refusals, the blank-declaration case, the
  dead-end detector in both directions, and the measurement above run against
  a real archetype's families.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — five cases pinning the host wiring: the picker offers exactly the open
  families (a committed family in the fixture is deliberately absent), a
  declared family reaches the ingest request for a file name that places
  nowhere, the same file is refused when nothing is declared, a guessed family
  says so, and the picker is hidden for session notes.
- `docs/architecture/test-ci-coverage-census.json` — regenerated for the new
  suite.

## QA / Validation

- `npx jest src/components/strategic-moves src/lib/programs/evidence-readiness`
  — 55 suites, 838 tests **PASS**.
- `npx jest .../current-state-upload-routing.test.ts` — 22 **PASS**.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  exit 0, **PASS**.
- `npx eslint` on all changed files — **PASS**, 0 errors.
- `npm run release:check -- --base origin/main --head HEAD` — 11 of 11 gates
  **PASS**.
- `npm run audit:test-ci-coverage:write` — covered test files 2636 -> 2637 for
  the one new suite, uncovered **FLAT at 164** (the new suite's directory is
  already CI-wired), fully-covered directories unchanged at 439.
- `npm run audit:tenancy-fence-coverage:write` — no change to the committed
  report; this change adds no route and no tenant-scoped read.
- **Mutation testing: 9 deliberate mutations, 9 killed.** Removing the
  declared-wins branch, letting a closed-family declaration re-infer, reversing
  the option order, making the dead-end detector always answer clean, treating
  a blank declaration as a declaration, never rendering the picker, dropping
  the picker value on the way to the router, dropping the basis from the result
  row, and offering a committed family in the picker. The last one survived the
  first pass because every family in the fixture was open; the fixture now
  carries a committed family and it fails.
- Live signed-in proof: **NOT RUN** — requires a signed-in walk of the demo
  tenant, which is Anand's step.

## Rollout Plan

Merge to `main` via squash auto-merge; the change ships on the next repo-owned
ACA main deploy. No flag flip and no data build is involved. Behaviour is
unchanged until a user picks a family, so there is no staged enrolment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
  (unchanged by this PR).
- Shared runtime mutators: none — this PR mutates no shared runtime, no
  revision weight, and no Container App template.
- Approved image digest: n/a; this PR pins no image and performs no deploy.
- ACA runtime invariant: unaffected by this PR; it must be proven on the deploy
  that carries this commit, not here.
- Worker image invariant: unaffected — no worker job changes.
- Feature/env flag update path: n/a, no flag.
- Live signed-in proof required: yes, before this is called live-proven for the
  demo tenant. Not claimed here.

## Rollback Plan

Revert the PR. The new module is consumed by exactly one component, so the
revert restores the previous inline heuristic and removes the picker in one
step; there is no persisted state, no migration, and no data build to undo. A
declaration recorded while the change was live has already become an ordinary
review-required evidence row under a real family, so reverting does not orphan
anything.

## Audit Evidence

- PR URL: see the pull request opened for branch
  `moves/p2-upload-declaration`.
- CI: the PR's required checks, including the Moves visible AI liability
  controls job that runs the host suite.
- Test output: the jest / tsc / eslint / release:check / census results listed
  under QA / Validation, and the mutation table above.

## Known Gaps

- **The declaration is per batch, not per file.** One picker value applies to
  every file selected in that upload. Mixed batches still need one upload per
  family, or must fall back to the file name. A per-file declaration needs a
  staged file list this control does not have.
- **The file-name heuristic is unchanged, including its quirks.** Its second
  tier folds the family's boolean `documentFamily` into the token blob, so a
  document family carries the literal token `true` there and a file name
  containing "true" matches every document family. Narrowing it would change
  where an undeclared file lands, so it is recorded rather than fixed.
- **The fan-out is reported, not prevented.** An undeclared file that matches
  several families still becomes a review row under each of them; the rows now
  say the family was guessed and how many matched, but nothing stops it.
- **`currentStateUploadDeclarationState` is not yet rendered anywhere.** It is
  exercised by its suite and states the invariant this change establishes (the
  panel offers every open family), but no operator view reports a dead end if a
  future surface reintroduces one.
- **No signed-in proof.** Whether a declared upload lands and is reviewable for
  the demo Move end to end still needs a signed-in walk; the E2E blocker ahead
  of it is the evidence load and its human approval, which are not code.
