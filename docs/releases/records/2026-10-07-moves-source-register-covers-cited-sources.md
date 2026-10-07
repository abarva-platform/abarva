# 2026-10-07-moves-source-register-covers-cited-sources — the sources a document lists are the ones it cites

## Release ID

`2026-10-07-moves-source-register-covers-cited-sources`

## Status

`candidate`

## Plain-English Summary

A generated Move document ends with a source register: the numbered list a
reader uses to resolve the `[4]` markers in the body. The register was built
from a different thing than the body. Each section carries a list of the
sources it says it used, written by the writer of that section (or, when the
section response leaves it out, taken from the plan that commissioned it). The
register was the evidence on that list and nothing else.

The pipeline then edits the body. One of its deterministic repairs exists
precisely to add a citation the writer omitted: when every number and date in a
sentence appears in one approved evidence item, it appends that item's marker to
the sentence. It runs once per section and again over the assembled document.
Neither pass updates the list the register is built from.

So the register could disagree with the body in two ways at once. A document
could cite `[4]` in its text with no row 4 to resolve it — a reader meets a
reference to a source the document does not list. And when no section reported
anything, the register came back **empty** on a document whose body does cite
approved evidence, which the quality check blocks outright as "no source
register": the document is quarantined as an internal draft, cannot be signed
off, and the phase gate criterion that asks for a signed-off document cannot
pass. That refusal names nothing a person can act on, because the register is
derived rather than authored — there is no control anywhere in the product that
adds one. The only way out was to regenerate and hope the writer happened to
report its citations next time.

Both outcomes get more likely, not less, as a Move accumulates approved
evidence: the register is required precisely when there is governed evidence to
register, and the repair has more figures it can match.

The fix reads the citations off the text a reader sees, and unions them with
what each section reported. The register then covers exactly what the document
claims. It is deliberately a union and not a replacement: a reported source
that the body does not spell out keeps its row, because dropping it would be a
new refusal rather than a loosened one.

No quality threshold moved. "No source register" still blocks a document whose
body cites nothing at all, which is the case that check exists for. The register
can only ever gain a row for evidence already inside the bundle it was handed,
so an item excluded upstream for the document's audience still cannot appear.

## Layer Impact

- **Layer 4 — Products (Moves).** Document assembly only. The source register
  of a generated phase document, and therefore whether the quality gate's
  missing-register blocker fires on a document that does cite its sources.
- **Layer 3 — Canonical model.** Unchanged. No schema, no read model, no
  migration, no stored value. The register is computed during assembly and
  rendered; nothing about how evidence is stored or approved changes.
- **Layer 2 — Source adapters.** Untouched.
- **Layer 1 — Client intake.** Untouched.

Lane: `global-control-lane` — shared app/control-plane document-assembly
behaviour for all clients, with no feature gate.

## Client Applicability

- All clients: yes — this is shared control-plane document-assembly behaviour,
  so every client receives it.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is inert for any document whose sections
  already reported every citation their body makes.
- No client-scoped schema, seed, retrieval, or private data-plane change, and
  no client is named in this record, in the code, or in the tests — the
  end-to-end cases run against the repository's existing cover-name fixture.
- Visible effect for any client: a generated document's source list now
  resolves every marker in its own body, and a document whose citations came
  from the repair is no longer quarantined for an empty list.

Lane: `global-control-lane`.

## Changes Included

Lane: `global-control-lane`.

- `src/lib/deliverables/orchestrator/rendered-section-citations.ts` — new leaf
  module. Reads `[n]` markers out of a section's rendered and raw bodies, and
  returns the union of those with the section's reported citations. The marker
  pattern is narrow on purpose: digits only, so the bracketed placeholder tags
  the other repairs append are not citations, and a marker followed by `(` or
  `:` is markdown link syntax rather than a citation.
- `src/lib/deliverables/orchestrator/section-generation.ts` — `buildSourceRegister`
  resolves its citation set through that module instead of reading
  `citationsUsed` alone. One line of behaviour, at the single place the register
  is built, which is downstream of both repair passes and of the
  missing-evidence signal append.
- `src/lib/deliverables/orchestrator/__tests__/rendered-section-citations.test.ts`
  — new suite, 12 cases.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

| Check | Result |
|---|---|
| New suite (`rendered-section-citations.test.ts`) | **PASS** — 12 of 12 |
| `npx jest src/lib/deliverables` | **PASS** — 129 suites / 1,652 tests |
| `npx jest src/lib/programs src/app/api/v1/deliverables` | **PASS** — 318 suites / 4,411 tests |
| `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit 0 |
| `npx eslint` on the three changed/added source files | **PASS** — exit 0 |
| `npm run release:check -- --base origin/main --head HEAD` | **PASS** |
| Census regeneration | **PASS** — committed census matches the run |
| Live signed-in walk | **NOT RUN** — needs a Move far enough along to build a phase document with approved evidence. See Known Gaps. |

The defect was reproduced before it was fixed, by driving the real orchestrator
rather than hand-building a document: one section whose sentence carries a
figure that appears in an approved evidence item, with no reported citations.
The repair appended that item's marker to the body; the register came back
empty; the quality gate returned `no source register` and the run was not `ok`.
That is the first end-to-end case, and mutation 6 restores exactly that reading.

Census delta, regenerated rather than asserted: test files 2,786 → 2,787,
covered 2,622 → 2,623, pull-request-covered 2,621 → 2,622, uncovered flat at
164. The new suite's directory was already fully covered, so the suite is
reached by CI rather than dark.

**The suite can fail.** Eight mutations, each applied by a helper that refuses
unless its pattern occurs exactly once in the target file, because a mutation
that silently edits nothing reads as a survivor and reports a coverage gap that
is not there. Every mutation was restored from the index and the tree
re-verified afterwards.

| # | Mutation | Result |
|---|---|---|
| 1 | Rendered-body citations no longer read | 2 of 12 failed |
| 2 | Raw-body citations no longer read | 1 of 12 failed |
| 3 | Reported citations no longer read | 3 of 12 failed |
| 4 | Markdown-link guard dropped from the marker | 1 of 12 failed |
| 5 | Marker widened to any bracket content | 1 of 12 failed |
| 6 | Register reverted to the reported citations only (the defect) | 3 of 12 failed |
| 7 | Register lists every evidence item regardless of citation | 5 of 12 failed |
| 8 | Marker reads two or more digits only | 6 of 12 failed |

Mutation 5 survived the first draft. The diagnosis was a redundant defence, not
a missing case: a `Number.isFinite` guard sat behind a digits-only marker, so
the parse could never be non-finite and widening the marker changed nothing the
guard did not absorb. The unreachable guard was removed — an unreachable guard
hides a later widening instead of catching it — and the mutation is now killed
by the placeholder-tag case.

## Rollout Plan

Squash merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys from the merge commit as usual. No migration to apply, no flag to
enrol, no env var to set, no worker job to run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only
  path that may shift shared web traffic.
- Shared runtime mutators: none in this change. No ad-hoc Azure command, no
  revision weight change, no Container App template edit.
- Approved image digest: whatever digest the main deploy workflow produces for
  the merge commit; this record does not pin one.
- ACA runtime invariant: unchanged by this release — it carries no env, flag,
  scale, or secret update, so no `az containerapp update` is required.
- Worker image invariant: unchanged. No worker job image moves.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof required: not for this change to be correct (it is
  computed during assembly and covered by the suites above), but see Known
  Gaps — it is not `live-proven` until a phase document is built on a real Move
  with approved evidence.

## Rollback Plan

Revert the squash commit. The new module has exactly one caller, added in this
change, and the reverted behaviour is the previous reading — the reported
citations alone. Nothing is persisted by this code: the register is computed
during assembly, so a revert changes what the next generation renders and
leaves no written state to unwind. There is no migration and no flag. A revert
restores the original disagreement between the register and the body; it does
not leave anything in an intermediate state.

Documents generated while this change is live are unaffected by a revert — their
registers are already written into their stored output.

## Audit Evidence

- The PR and its CI run (linked from the PR body).
- The new suite is the readable statement of the contract: the end-to-end cases
  name the condition, and the unit cases name each reading the union depends on.
- The mutation log is summarised under QA above; the defect's own reading is
  mutation 6.
- Census delta, quoted above, is the proof the new suite is reached by CI rather
  than dark.

## Known Gaps

- **Not live-proven.** No phase document has been generated on a real Move with
  this change in place. The Move on the critical path has not reached a phase
  that builds one with approved evidence behind it; it is held by a pending
  evidence load and an in-app human approval, both outside this lane. This
  record says `candidate`, not `released`, for that reason.
- **The reverse disagreement is left alone, deliberately.** A section can still
  report a citation its body never spells out, and that source still gets a row.
  Narrowing the register to the body alone would be a new refusal — a document
  that was previously served would start failing — and this release only
  loosens. It is recorded rather than smoothed over.
- **A citation inside a table or an exhibit is not read.** The register is built
  from the sections, which is where it was built from before; a marker that
  appears only inside a rendered table would still be unresolvable. No shipped
  structure is known to put one there, and widening the read to tables is a
  separate change with its own blast radius.
- **Nothing yet checks the invariant at the gate.** The quality gate still has
  no "every marker in the body resolves to a row" blocker, so a future path that
  introduces a marker after assembly would reintroduce a dangling citation
  silently. The new suite asserts the property for the generation path it covers;
  promoting it to a gate check would start refusing documents and is out of
  scope here.
