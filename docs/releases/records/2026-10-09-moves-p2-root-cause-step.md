# 2026-10-09 — P2 Step 3: rank what's causing the gap

## Release ID

`2026-10-09-moves-p2-root-cause-step`

## Status

`candidate`

## Plain-English Summary

The second step page on the finalized template: P2 Discover, Step 3, "Rank
what's causing the gap", behind `moves_step_pages_v3` (synthetic demo tenant
only). The consultant builds a ranked list of root causes, each tied to the
baseline number it drives and to approved evidence. A cause with no approved
evidence is resolved only by a named owner, carried as a known gap or ruled
out of scope. Symptoms are set aside rather than ranked. The consultant
confirms the order, and any move clears that confirmation. An earlier
free-text answer becomes draft causes, one per line, so nothing written
before is lost.

The consultant can fill the step from pasted notes. The fill is deterministic
and verbatim, the same rules as the capture's fill-from-notes. A candidate
cause joins at the bottom of the ranking, because aVa does not rank, and has
no evidence until the consultant adds it. A proposed owner is pre-filled in
the cause's resolve form and marked as a draft. Nothing is accepted for the
consultant, and an owner they typed is never overwritten.

The page lives inside the product's existing aVa dock: its notes area, its
suggested actions and its opening turn. Every Steps view now mounts aVa
through one host helper. The page writes the root-cause register (#9324)
through the existing capture autosave, so the gate, the build and the next
phase read it as ranked text.

## Layer Impact

- Release lane: `global-control-lane`, feature-flagged.
- Product projection: the Moves phase workspace. A flagged branch renders P2
  Step 3 at `?step=root-causes`, and the P2 capture's root-causes question
  links to it.
- Canonical model: no schema change. The register is stored in the existing
  `gaps_root_causes` answer.
- Document generation and the gate: unchanged. Both read the register through
  #9324.

## Client Applicability

- All clients: no change while the flag is off.
- Specific clients: the synthetic demo tenant, which has the flag on.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_step_pages_v3`. It requires `moves_capture_v2`.

## Changes Included

- `src/lib/programs/root-cause-step.ts` (new): register operations (move,
  accept, resolve with an owner, reopen, set aside, promote, add, edit,
  confirm order, earlier answer to drafts) and the step's next action.
- `src/lib/programs/root-cause-notes.ts` (new): deterministic, verbatim
  fill-from-notes proposals.
- `src/components/strategic-moves/step-page/RootCausesStep.tsx` (new).
- `MovesPhaseStandaloneClient.tsx` and the phase page: the flagged mount, the
  capture entry link, and one `renderAvaDock` mount for every Steps view.

## QA / Validation

- Step model suite: pass, 16 tests. Notes proposer suite: pass, 5 tests. Page
  render suite: pass, 9 tests. Host mount suite: pass, 4 tests.
- Mutation checks: pass. Each of these fails a test: fill overwriting a typed
  owner, resolving without an owner, accepting without evidence, a move
  keeping the confirmation, the page rendering on another phase, and the
  entry link showing without the flag.
- `npm run typecheck` (includes tests): pass. ESLint: pass.
- Visual: pass. The real component, rendered with sample data, was compared
  with the final design at 1440px.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. The flag is on for the
synthetic demo tenant only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify that the web template and the serving
  revision match the approved digest.
- Worker image invariant: verify that the required worker images match the
  approved digest.
- Feature/env flag update path: the code registry (`includeTenants`).
- Live signed-in proof required: open the demo Move's P2 at
  `?step=root-causes`. Rank, resolve and confirm the order, then check that
  the P3 build's decision context lists the causes in that order.

## Rollback Plan

Remove the demo tenant from the flag, or revert through a pull request. A
register written by then stays valid and is read by every reader (#9324).

## Audit Evidence

- Pull request and CI results.
- The suites and mutation results above.

## Known Gaps

- Uploading evidence from inside the step, with its extraction-review row, is
  the next increment. Evidence is uploaded in Files today.
- aVa drafting causes from approved evidence, rather than from pasted notes,
  is later.
- Whether the P2 gate should require ranked, evidenced causes is a governance
  decision for the product owner.
