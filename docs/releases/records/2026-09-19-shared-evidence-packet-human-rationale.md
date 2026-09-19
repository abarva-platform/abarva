# 2026-09-19-shared-evidence-packet-human-rationale — Shared evidence packet reads the human rationale

## Release ID

`2026-09-19-shared-evidence-packet-human-rationale`

## Status

`candidate`

## Plain-English Summary

When a person approves something an AI advisor recommended, the product records an
evidence packet: who decided, what evidence they were shown, what was missing, what
they assumed, what alternatives existed, and the reason they wrote. A shared validator
checks that packet before it is stored.

That validator checked every field the product writes and did not check the one field
the person writes. A packet built around a one-word reason, or none at all, reported
`passed`. The rationale minimum was real but lived in two places on one product
surface, so it applied to that surface only: any new screen that records a human
decision had to remember to enforce its own minimum, and nothing would have told it
otherwise.

The shared validator now reads the rationale. A packet that records a human decision
must carry a reason of at least twenty characters, measured after trimming and
collapsing whitespace so padding cannot pass. A packet that records no human decision —
a composed brief, which nobody signed — is unaffected, because a shared requirement
applied to everything would have refused those. Which of the two a packet is, is now
part of the packet: callers may state it, and when they do not, anything naming a
decision owner, an override disposition or a reason is treated as a human decision. The
default leans toward enforcement, so a new decision surface cannot opt out by
forgetting to declare anything. An explicit brief declaration also cannot
override a named decision owner, override disposition or recorded rationale.

The existing surface-level checks are kept. They fail earlier, name the surface in the
error, and now sit in front of a shared check rather than being the only one.

## Layer Impact

Release lane: `global-control-lane`. The shared validator is used by every surface that
records an AI-assisted human decision, and the change is not feature-gated.

- **Layer 4 — Products (control/app):** the shared human-decision control module and the
  two product paths that build packets against it. One product surface (Moves) now
  reads its character minimum from the shared module instead of declaring its own, so
  the screen's counter and the validator cannot drift apart. One product surface
  (the Tower pressure brief) now declares on the record that it composes a brief rather
  than recording a human decision.
- No data plane change. No schema, migration, loader, adapter, projection or read model
  is touched, and no stored packet changes shape for any existing caller.
- No canonical model change.

## Client Applicability

- All clients: yes — the validator is shared by every surface that records an
  AI-assisted human decision. No behaviour changes for any packet that already carried
  an auditable reason, which is every packet the two live builders produce.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The check is unconditional for packets that record a human
  decision, in the same way the evidence-id and assumptions checks already are.

## Changes Included

- `src/lib/ai-liability/human-decision-controls.ts` — adds
  `HUMAN_DECISION_RATIONALE_MIN_CHARS`, `normalizeHumanDecisionRationale`,
  `packetRecordsHumanDecision` and the `recordsHumanDecision` field on the packet input
  and the packet; `validateAiDecisionEvidencePacket` now emits
  `missing_human_rationale` and `insufficient_human_rationale`.
- `src/lib/programs/moves-ai-liability.ts` — `MOVES_HUMAN_RATIONALE_MIN_CHARS` now
  derives from the shared constant; the comment explaining why the surface enforces its
  own minimum is updated to say what the shared layer now does.
- `src/lib/tower/program-pressure-view.ts` — the pressure brief declares
  `recordsHumanDecision: false`.
- `src/lib/ai-liability/__tests__/human-decision-controls.human-rationale.test.ts` — new
  eight-case suite driving the shared validator, including a mislabeled-brief bypass case.
- `.github/workflows/ai-surface-control-catalog.yml` — one appended step running that
  suite on every pull request.

## QA / Validation

- **The new suite drives the shared validator directly, including the brief guardrail and
  an explicit mislabeled-brief bypass case.** The brief guardrail is load-bearing,
  and it is load-bearing: it is what fails when the check is made unconditional.
- **Six deliberate mutations, each caught** (failing cases in brackets): drop the
  too-short branch [2]; default an undeclared packet to "not a human decision" [5];
  remove the rationale check entirely [4]; stop normalising whitespace [1]; apply the
  check unconditionally, refusing briefs [1]; lower the minimum to one character [2].
- **Baseline over the same scope, same command either side**
  (`npx jest src/lib/ai-liability src/lib/programs src/lib/tower src/components/programs src/__tests__/behaviors`):
  **10 suites / 12 tests failing before → 10 / 12 after**, with a byte-identical failing
  suite list; all pre-existing and unrelated. Passing 4491 → 4498, the seven new cases.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0, no
  output, with `tsconfig.tsbuildinfo` removed first so no stale diagnostics are reused.
- `npx eslint` over the changed files — exit 0, no output.
- `npm run audit:ai-surface-controls` — exit 0 with the appended step present.
- Not yet verified at the time of writing: that the appended CI step is observed
  executing in the real job. That is checked on the pull request before merge.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow builds the image
from the merge SHA and shifts traffic. No migration, no flag, no manual step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to
  `main`.
- Shared runtime mutators: none in this change. No `az containerapp` command is run by
  hand.
- Approved image digest: assigned by the deploy workflow from the merge SHA; recorded
  on the claim log and the backlog once the run completes.
- ACA runtime invariant: to be proven after deploy — Container App template image equals
  the 100%-traffic revision image, digest-pinned.
- Worker image invariant: to be proven after deploy — both non-manual worker jobs carry
  the same digest.
- Feature/env flag update path: not applicable; no flag or environment variable changes.
- Live signed-in proof required: **no.** No route, component, copy or rendered output
  changes. The change is a validator branch and a declared field; both live builders
  already supply rationales that satisfy it, so no screen behaves differently.

## Rollback Plan

Revert the merge commit. The change is additive and self-contained: one optional input
field, one derived packet field, one validator branch and one test. No stored data, no
schema and no migration is involved, so a revert restores prior behaviour with no
cleanup.

## Audit Evidence

- The pull request, its diff and its checks.
- The `AI surface control catalog` CI job, where the appended step must be observed
  running the new suite rather than merely declared in the file.
- The before/after and mutation numbers recorded under QA / Validation, all measured by
  running the real validator rather than read from the source.
- The deploy run keyed to the merge SHA and the runtime-invariant readback.

## Known Gaps

- **The inference is conservative, deliberately.** A packet that declares nothing and
  names no decision owner, no override disposition and no reason is read as a brief. A
  `false` declaration is accepted only for that same marker-free shape; decision markers
  take precedence so a mislabeled packet cannot bypass the rationale check.
- **The two surface-level checks are still there.** They are now redundant with the
  shared check for the packets they guard. They are kept because they fail at assembly
  with the surface named in the error, which is a better message than a validation
  failure list, and removing them is a separate decision.
- **One packet builder still validates nothing.** The Tower pressure brief builds a
  packet and never calls the validator. It is declared as a brief now, so calling the
  validator would be meaningful — but whether briefs should be validated at all is the
  question item 63's second branch raises, and it is not answered here.
