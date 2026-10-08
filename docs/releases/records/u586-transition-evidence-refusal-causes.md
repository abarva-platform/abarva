# U-586 — A phase-gate refusal that prescribes a retry is one a retry can answer

## Release ID

`2026-10-07-transition-evidence-refusal-causes`

## Status

`candidate`

## Plain-English Summary

The phase gate on the consulting-move workflow holds phases 1 through 4 open until the move's
required transition evidence is closed. It establishes that in one place, and that place runs five
steps in sequence: it reads the move's discovery evidence readiness, expands it into evidence need
packets, reads the next phase's stage-readiness workbook review as it stands, overlays that review
onto the packets, and reduces the result to the slots the phase still has open.

All five steps sat inside a single `try` whose `catch` discarded the error and returned one flag.
The route answered that flag with one refusal — HTTP 503, "The current transition evidence and
workbook review could not be verified. The phase gate was not submitted." — and logged nothing.

Three things were wrong with that, and only the third is cosmetic.

- **503 is an instruction to try again.** Three of the five steps are pure functions over records
  that are already on the move. If one of those throws, submitting the gate again recomputes the
  same inputs and fails the same way. The refusal prescribed the one action it had already ruled
  out. This is the same defect the approved-evidence refusal classifier exists to prevent on the
  write paths, appearing here on the gate itself.
- **The two reads fail for different reasons and are closed at different places** — the move's own
  discovery evidence, and the next phase's readiness workbook — and the text named neither. Worse,
  it asserted that the workbook review "could not be verified" even when the first read was what
  failed and the workbook read had never been issued at all.
- **The cause reached neither the operator nor the server log**, so a move stuck at this refusal
  left no trace of which step to look at.

This release catches the three causes separately and gives each one its own refusal. A read fault
stays a 503 and says plainly that submitting again is the right next step, and which read failed.
A failed assessment becomes a 422 that says submitting again will not change the answer, because
the same records are reduced the same way. Every cause now states that the gate was not submitted
and that no evidence requirement was waived, and names itself in the server log along with the
underlying error.

Nothing is relaxed. Every cause still refuses, no phase advances, no evidence requirement is
waived, and no slot is assumed closed. What changes is which refusal is sent, what it claims, and
whether it tells the reader to try again.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4 — Products (Moves).** The phase-gate approval route's refusal taxonomy and the
  read-side readiness report it publishes.
- **Layer 3 — Canonical model:** unchanged. No schema, no migration, no write. The change is
  entirely in how an existing read's failure is classified and reported.
- Layers 1 and 2 are untouched.

## Client Applicability

- All clients: yes. The refusal is global control-lane behaviour on the phase gate for phases 1–4.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The route is not flag-gated, so the corrected refusal applies wherever the
  gate is submitted.

## Changes Included

- `src/lib/programs/transition-evidence-basis.ts` (new): the three-cause taxonomy, the refusal each
  cause yields (code, HTTP status, whether a re-submission can satisfy it, operator text), and the
  one-line server-log description. Pure; no I/O.
- `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts`: the single bare `try` is
  split into three — the discovery readiness read, the workbook review read, and the packet
  expansion plus overlay plus reduction — each returning its own cause. The `POST` refusal now
  carries the classified code, cause, `resubmitCanSatisfy` and text at the classified status, and
  keeps the previous error string as `precondition` so a reader that matched the old refusal still
  recognises this one. The `GET` readiness report publishes the same cause alongside the
  `available` flag it already published. The cause and the underlying error are logged.
- `src/lib/programs/__tests__/transition-evidence-basis.test.ts` (new): 17 cases.
- `src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts`: 8 host cases
  that drive the three causes apart through the route.
- `docs/architecture/test-ci-coverage-census.json`: regenerated.

## QA / Validation

| Check | Command | Result |
| --- | --- | --- |
| New module suite | `npx jest --runTestsByPath src/lib/programs/__tests__/transition-evidence-basis.test.ts` | **PASS** — 17/17 |
| Host route suite | `npx jest --runTestsByPath '.../phase-gate-approval/__tests__/route.test.ts'` | **PASS** — 39/39 (31 pre-existing, 8 new) |
| Gate-route integration suite | `npx jest src/__tests__/integration/programs/phase-capture-gate-routes.test.ts` | **PASS** — 7/7 |
| Typecheck | `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit 0 |
| Lint | `npx eslint` over the four changed/added files | **PASS** — exit 0 |
| Census wiring proof | `npm run audit:test-ci-coverage:write` | **PASS** — see note below |
| Tenancy fence census | `npm run audit:tenancy-fence-coverage:write` | **PASS** — no change; the new module performs no tenant-scoped read |
| Live signed-in walk | — | **NOT RUN** — owed, and not claimed here |

**Census note, stated rather than implied.** The census committed on the base was already one file
behind its own tree: committed `2830 / 2665 / 2664`, and regenerating the base with this branch's
new suite moved aside gives `2831 / 2666 / 2665`. With the new suite the regeneration gives
`2832 / 2667 / 2666`. So the +2 in this diff is +1 inherited from the base and +1 mine.
`uncoveredTestFiles` holds at 165 across all three, which is the proof that the new suite is
CI-covered rather than dark.

**Mutation sweep — 9 applied, 9 killed.** Each mutation removes exactly one behaviour, and the
mutator asserts its pattern matches exactly once before applying, so a pattern that no longer
matches is reported rather than counted as a survivor.

| # | Mutation | Killed by |
| --- | --- | --- |
| 1 | Failed assessment sent as 503 | 3 cases — the status/retry agreement and the host case |
| 2 | Failed assessment marked re-submittable | 3 cases |
| 3 | The readiness-read catch reports the workbook cause | 3 cases |
| 4 | The fault log line dropped | the log host case |
| 5 | `GET` stops publishing the cause | the read-side host case |
| 6 | The assessment catch reports a read cause | the assessment host case |
| 7 | The phase bound widened past P4 | the outside-P1–P4 host case |
| 8 | `POST` ignores the classified status | the retryable-503 host case |
| 9 | `POST` ignores the classified text and restores the old literal | 3 cases |

Mutation 6 is the one that matters: it is the shape the original single `catch` had, and it proves
the three causes are actually distinguished by the route rather than merely declared in a module.

## Rollout Plan

Merge to `main` by squash. The change is served by the next repo-owned ACA main deploy. It needs no
migration, no flag, and no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Nothing here deploys.
- Shared runtime mutators: none. No `az` command, no revision weight, no Container App template
  change.
- Approved image digest: not applicable — this release introduces no runtime image change of its own.
- ACA runtime invariant: unchanged; to be proven by the main deploy that carries this commit.
- Worker image invariant: unchanged. The deliverable queue worker is not touched.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof required: yes, for the rendered refusal text. Owed and not claimed here.

## Rollback Plan

Revert the squash commit. The new module has no other caller; the route edit replaces one `try`
with three and one response literal with a classified one, and the `GET` addition is one optional
field. No data was written and no schema changed, so a revert is complete and immediate. The census
would need one regeneration after the revert.

## Audit Evidence

- The PR and its CI run.
- The mutation table above, with the pattern-match assertion that makes a non-applied mutation
  visible instead of silently green.
- The census delta with `uncoveredTestFiles` held flat, as the wiring proof for the new suite.
- The host cases that assert `advancePhase` was not called under each of the three causes, as the
  proof that no refusal was relaxed.

## Known Gaps

1. **A read fault is still not split into transient and structural.** `loadDiscoveryEvidenceReadiness`
   and the workbook review read are each treated as answerable on a second attempt, because a bare
   throw does not say whether the fault was a connection error or a permanent one. The refusal is
   honest about that — it says a read that keeps failing is an operational fault rather than an open
   evidence item — but it cannot yet tell the two apart on the first attempt.
2. **The structured cause renders nowhere as a field.** The refusal text reaches the screen through
   the message ladder the phase workspace already mounts, so the operator does see which step
   failed and whether to retry. The `basisUnevaluableCause` and `resubmitCanSatisfy` fields,
   however, join the several diagnostic signals that now flow and render nowhere; a dedicated
   surface for them is still owed and tracked separately.
3. **The read-side report has no product reader.** The `GET` on this route publishes the cause
   alongside the `available` flag, and nothing in the product fetches that `GET` today. The field is
   added for symmetry with the refusal and for API readers, not because a surface consumes it.
4. **No live signed-in walk is claimed.** Reproducing a read fault against a live tenant is not
   something this lane may do, and the three causes are exercised through the route under mocks
   only.
