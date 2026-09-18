# 2026-09-18-moves-packet-rationale-minimum — Moves evidence packets enforce their own rationale minimum

## Release ID

`2026-09-18-moves-packet-rationale-minimum`

## Status

`candidate`

## Plain-English Summary

A Moves decision evidence packet is the record a reviewer reads months later to
understand why a phase advanced or a gate criterion was accepted. Everything else
in that packet is assembled by the system — the evidence ids, the assumptions, the
alternatives, the watermark. The human rationale is the only part a person writes,
and it is the only part that says *why*.

Every screen and route that produces one already refuses a rationale too short to
audit: the advance route, the phase-gate route, the criterion approval route, the
phase-advance button and the agent tool all check it and return an error. The
packet builder itself did not. It trimmed the text and stored whatever it was
given, and the packet validator never looked at the field at all — so a packet
built around the word `ok`, or around no rationale whatsoever, came back reporting
that it had passed validation.

Nothing on a live path was writing one, because each live path checks the value
before it builds. The defect is that the check lived only in the callers: a new
caller — a script, a job, a future route, an agent tool written next month — that
did not know to call the validator would have recorded a one-word rationale as
evidence, and the packet would have declared itself valid.

Both Moves packet builders now enforce the minimum themselves and refuse to build
a packet without an auditable rationale. A test drives the real builders and
holds that refusal.

## Layer Impact

- **Products lane (`global-control-lane`)** — Moves decision evidence, the layer-4
  projection a reviewer reads. The two packet builders in
  `src/lib/programs/moves-ai-liability.ts` gain a precondition; no schema, no
  canonical model object and no intake artifact changes.
- No source adapter, no canonical model and no client intake shape is touched, so
  layers 1 through 3 are unaffected.

## Client Applicability

- All clients: yes — the control applies to every tenant that advances a Move or
  approves a gate criterion.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The rule is unconditional, which is the point; a gate that
  can be turned off per surface is the failure this backlog exists to remove.

## Changes Included

- `src/lib/programs/moves-ai-liability.ts` — new `requireAuditableHumanRationale`
  helper; `buildMovesPhaseDecisionEvidencePacket` and
  `buildMovesGateApprovalEvidencePacket` both use it instead of normalising the
  value and storing it unchecked.
- `src/lib/programs/__tests__/moves-ai-liability.decision-packet.test.ts` — the
  case that pinned the gap (`does NOT enforce the rationale minimum — that lives
  in the callers`) is replaced by five cases asserting the behaviour that should
  hold: a short rationale is refused, a whitespace-padded short rationale is
  refused, a missing one is refused, a sufficient one builds normally, and the
  criterion-level builder holds the same minimum as the phase builder.
- No route, component, migration or script changed.

## QA / Validation

Re-verified on clean `origin/main` (`b4c0ca54c`) before any edit: both builders
called `normalizeMovesHumanRationale` and neither called
`validateMovesHumanRationale`; `validateAiDecisionEvidencePacket` has no branch
that reads `humanRationale`, so a packet holding `null` returned `passed: true`.

**Failing test before the fix.** The five new cases were written and run against
unmodified source: **4 failed / 9 passed of 13**. After the fix: **0 failed / 13
passed**. The case that passes in both states is the one asserting a sufficient
rationale still builds — without it, a builder that refused everything would look
correct.

**Mutation checks — five run, four caught, one survived and is reported.**

| Mutation | Result |
|---|---|
| Phase builder reverted to the bare normaliser | 3 failed — caught |
| Criterion-approval builder reverted to the bare normaliser | 1 failed — caught |
| `MOVES_HUMAN_RATIONALE_MIN_CHARS` lowered from 20 to 1 | 3 failed — caught |
| Helper made to throw unconditionally | 9 failed — caught, so the cases pin a *specific* refusal rather than any refusal |
| Helper checks the raw value instead of the normalised one | **13 passed — survived** |

The survivor is honest and worth recording rather than papering over: it is a
semantically equivalent edit, not a weakening. `validateMovesHumanRationale`
normalises its own argument before measuring, so normalising twice and normalising
once give the same answer. The whitespace case still holds real behaviour — a
rationale of `"ok"` padded to 44 characters is refused — but it is the validator's
normalisation it pins, not the helper's.

**Scope baseline, same command before and after.** `npx jest src/lib/programs`:
**6 suites / 7 tests failing before → 6 suites / 7 tests failing after**, the same
six suites by name (`clientname-tenant-resolution`, `archetypes/generality`,
`archetypes/resolver`, `board-artifacts/board-grade-route-guard`,
`board-artifacts/load-move-business-case-input`,
`learning-writeback/moves-learning-writeback`), all pre-existing and none touched
by this change. Passing tests 3510 → 3514.

**Every caller exercised.** `npx jest src/app/api/programs/phase-gate
src/app/api/reasoning/gate-approval src/lib/agent/tools/program
src/components/programs` — 3 failing before and after, the same two origination
component suites, confirmed pre-existing by re-running them with the change
stashed. The phase-advance approval-gate suite passes 3/3 (run with
`--runTestsByPath`, since a bare pattern reads the bracketed route segment as a
regex character class).

**Static checks, judged by exit code.** `NODE_OPTIONS=--max-old-space-size=6144
npx tsc --noEmit --pretty false` exit 0 with `tsconfig.tsbuildinfo` deleted
beforehand; `npx eslint` on both changed files exit 0; `node
scripts/release-check.mjs --base origin/main --head HEAD` exit 0 with a clean tree
afterwards.

**CI reach.** The suite is already invoked by name in
`.github/workflows/ai-surface-control-catalog.yml` (`Exercise Moves decision
evidence packet`), so it runs on every PR without a workflow change. That step was
confirmed present on `main` rather than assumed.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow builds and deploys the image;
no manual Azure command, no migration, no flag flip and no data build. The change
is a precondition inside a pure function, so it becomes active with the image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No Azure command is run by hand for this change.
- Approved image digest: assigned by the deploy workflow on merge; recorded in the
  claim log and pulse once the run completes.
- ACA runtime invariant: to be proven after the deploy run — Container App template
  image must equal the 100%-traffic revision image, digest-pinned.
- Worker image invariant: unchanged; no worker job image is touched.
- Feature/env flag update path: not applicable, no flag.
- Live signed-in proof required: **no**, and the reason is specific rather than a
  wave-through. Every live caller already refuses a short rationale before it
  reaches the builder, so a signed-in session cannot reach the new refusal without
  a caller that does not exist yet. The observable behaviour of every current
  surface is byte-identical. The proof that matters here is the builder-level test,
  which is what this change adds.

## Rollback Plan

Revert the PR. Both changed files are self-contained; the helper has no callers
outside its own module and the test file is invoked by one named workflow step, so
reverting restores the previous behaviour exactly. No migration to unwind, no data
written, nothing to replay.

## Audit Evidence

- The PR for this branch and its CI run, including the `Exercise Moves decision
  evidence packet` step in the AI Surface Control Catalog workflow.
- Before/after counts for the identical suite (4 failed / 9 passed → 0 failed / 13
  passed) and the five mutation results in the table above.
- `docs/security/ai-surface-control-catalog.json`, which declares the
  `moves-decision-evidence-packet` control this suite exercises.

## Known Gaps

- **The action-verb half of the same backlog item is deliberately not taken.** The
  autonomous-decision scrub rewrites user-visible prose, and widening it from
  decision verbs to action verbs risks garbling legitimate sentences. The test case
  pinning that gap is left exactly as it was, including its comment explaining why
  the change must be deliberate. Whoever widens the table should do a
  false-positive pass per verb.
- **The shared packet validator still does not read `humanRationale`.** This change
  enforces the minimum at the two Moves builders, not at
  `validateAiDecisionEvidencePacket`, and that is intentional rather than
  incomplete: the Tower pressure brief builds a packet with no human rationale at
  all, legitimately, because it is a brief and not a record of a human decision.
  A shared-layer requirement would refuse it. The consequence is that the rule is
  per-surface, so a third surface that records a human decision must enforce its
  own minimum — logged in the execution backlog rather than left implicit.
- **`humanRationale` stays `string | null` on the shared packet type.** Moves
  packets can no longer carry null, but the type cannot say so without splitting it
  per surface, which is a wider change than this one.
