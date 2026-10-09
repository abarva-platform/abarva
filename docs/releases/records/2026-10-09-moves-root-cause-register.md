# 2026-10-09 — P2 root causes can be a ranked, evidenced register

## Release ID

`2026-10-09-moves-root-cause-register`

## Status

`candidate`

## Plain-English Summary

The finalized Moves design asks P2 to rank what causes the gap: each cause
tied to the baseline number it drives and to approved evidence, symptoms set
aside, a cause without evidence resolved by a named owner, and the order set
by the consultant. Accepted causes, in that order, become the rows P3 designs
for. Until now root causes were one free-text answer.

This change adds the data contract for that register, stored in the existing
`gaps_root_causes` answer, and makes every place that reads the answer read a
register correctly: the gate's capture checks, the build's decision context,
the next phase's carried capture, the generation digest, and the evidence the
generator cites. A register reaches documents as a ranked, cited list, never
as JSON; only accepted causes and owned known gaps reach the digest as
findings. An existing free-text answer is read exactly as before. No screen
writes a register yet: the P2 step page that edits it is the next change.

## Layer Impact

- Release lane: `global-control-lane`.
- Canonical model: no schema change. The register is a JSON value inside the
  existing capture answer, marked with an explicit kind so it is never
  mistaken for other text.
- Gate: the capture-text phrase checks read only the team's own words from a
  register (causes, metric names, evidence, owners), never the register's
  labels, so a label such as "drives baseline" cannot satisfy a check the
  team's words do not. Free-text answers are read as before.
- Document generation: the capture key contract is unchanged; register values
  are rendered as ranked text for the decision context, the carried capture
  and cited evidence, and as one line per settled cause for the digest.
- Capture completeness: a register is complete when every ranked cause is
  accepted or resolved with an owner and the order is confirmed; free text is
  judged as before.

## Client Applicability

- All clients: yes, with no change for existing (free-text) answers.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none (nothing writes a register until the flagged P2 step
  page ships).

## Changes Included

- `src/lib/programs/root-cause-register.ts` (new): parse, serialize, rank,
  settled and complete rules, ranked text, team-words-only gate text, digest
  lines.
- `governance.ts`, `generate-phase/route.ts`, `moves-generate-deps.ts`,
  `orchestrator/evidence-assembler.ts`, `phase-capture-contract.ts`: read a
  register through the module; any other value is unchanged.
- Tests for the module and for each reader.

## QA / Validation

- Register suite: pass, 20 tests (round trip, rejection of free text, foreign and
  malformed JSON, ranking, completeness, ranked text, legacy identity, digest
  rank numbers).
- Reader tests: pass — the gate (with a positive control), the build's decision
  context, the carried capture and digest, and cited evidence.
- Mutation checks: pass — reverting each of the six reader wirings fails its test
  (including the gate reading labels instead of the team's words).
- `npm run typecheck` (includes tests): pass. ESLint: pass.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. No flag, migration or
data job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify web template and serving revision match the
  approved digest.
- Worker image invariant: verify required worker images match the approved
  digest.
- Feature/env flag update path: none.
- Live signed-in proof required: none until a screen writes a register.

## Rollback Plan

Revert through a pull request. Free-text answers are untouched; any register
written by then would be read back as free text (its JSON), which the next
change's flag can avoid by not writing registers.

## Audit Evidence

- Pull request and CI results.
- The suites and mutation results above.

## Known Gaps

The P2 Gate does not yet require ranked, evidenced causes; whether it should
is a governance decision for the product owner. Ava drafting causes from
evidence and routing findings to causes come with the P2 step page.
