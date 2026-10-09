# u643 — The P0 close does not sign a second brief it could not rule out

## Release ID

`2026-10-09-u643-origination-close-read-readback`

## Status

`candidate`

## Plain-English Summary

Closing the first phase of a Move is one act. When an authorized user approves
the origination brief, a single server helper creates the signable brief,
records that user as its signer, evaluates the governed gate and advances the
Move to the next phase. It deliberately never raises, because the approval it
rides on has to stand regardless — so everything it declines to do has to come
back inside its result.

That helper performs two reads, and both read only the rows the query returned
and ignored the error returned alongside them. The data client this path uses
does not raise on a failed query; it catches everything and resolves to _no
rows, plus an error_. So a connection failure, a permission denial and a
genuinely empty result all arrived in exactly the same shape.

The first read is the one that matters, because its consequence is a write
rather than a wrong sentence. Before creating the brief, the helper looks for a
brief already recorded against this Move and signs that one if it finds it. The
create and publish below it are reached only when the look-up comes back empty
— so a failed look-up did not stop anything. It read as "this Move has no brief
yet", a **second** brief was created, and the approval signed that one. The Move
then holds two origination briefs, the signature on the newer one, the older
one's own sign-off still standing beside it, and the whole call reported
success. No control on any product surface removes either copy, and the reader
is told nothing happened that needs attention.

The second read fetches the Move itself. Its failure and a Move that genuinely
does not exist both produced the same named stop, and that stop's sentence
describes only the second case — it tells the reader the Move may have been
archived or may sit outside their workspace. For a read that failed, that is
the one wording that makes retrying look pointless, which is exactly the action
that would have worked.

This release makes both reads say whether they read. The brief look-up now
**refuses rather than duplicates**: when it cannot rule out an existing brief,
nothing is created, nothing is signed, the Move stays where it was, and the
reader is told to open the Move's documents first and approve again if a brief
is already there. The Move read gains its own stop for a failed read, separate
from the absent Move, with the retry-now remedy that an unreadable state
actually has; the absent-Move sentence keeps the look-elsewhere remedy and is
now the only thing that claims it.

One further gap closes with them. The second of the helper's two callers logged
its stops only when the result named a blocked gate check — and only the gate
verdict ever names one. Every other stop, including both unreadable-state
refusals, left a decided approval, a Move that had not moved, and no record
anywhere that the close had not happened. The comment above that call promises
that a failure "logs loudly"; the gate on the one noisy stop silenced precisely
the silent ones. It now records every stop and names which one it was, while
still not calling the benign already-advanced case a failure.

Behaviour where both reads succeed is unchanged. A brief already recorded is
still the one that gets signed, a Move without one still gets a first brief
created and signed, a Move already past the first phase is still the no-op it
was, and a real gate block still reports the checks it named.

## Layer Impact

- **Layer 4 — Products (Moves), write path.** The phase-close helper gains one
  refusal placed before the two writes it guards, and one classification before
  the work it guards. No query, filter, tenancy scope, column list or row shape
  changed, and neither write itself is touched.
- **Layer 4 — Products (Moves), presentation.** Two new stops and their
  sentences in the module that already owns this close's product-facing wording,
  plus a corrected sentence for the stop that previously served two causes. The
  approval route derives its error code and its sentence entirely from that
  module, so it renders both without any change to the route.
- **Layer 4 — Products (Moves), operability.** The second caller's log fires on
  every stop instead of one, and names the stop.
- **Layer 3 — Canonical model.** Unchanged. No schema, migration, or record
  shape.

Release lane: `global-control-lane`. Behaviour is identical for every tenant,
nothing here is flag-gated, and no client-scoped schema, seed, ingestion or
private data-plane path is touched.

## Client Applicability

- All clients: yes — this helper runs on every approval of an origination
  brief, which is how every Move leaves its first phase.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is flag-less and backward compatible. The
  machine codes already in use are untouched and anything keying on an existing
  code keeps working; the two new codes are additive.

## Changes Included

- `src/lib/programs/origination-close.ts` — both reads destructure and read
  their query error. The brief look-up's helper now returns a discriminated
  outcome instead of an id-or-nothing, so "could not read the existing
  documents" and "read them, found none, and the create failed" can no longer
  arrive on the same value; the first refuses before the create. A guard was
  also added between the create and the publish, so a create that returns no id
  is not published.
- `src/lib/programs/origination-close-outcome.ts` — adds the two stops, their
  error codes and their sentences, and corrects the sentence of the stop that
  previously served two causes. The module's two exported rosters are now
  **derived** from one compiler-checked classification of every stop rather than
  hand-listed, and the header records why.
- `src/lib/programs/approval.ts` — logs every stop rather than only the one that
  names a blocked check, and excludes the benign already-advanced case from
  being recorded as a failure.
- `src/lib/programs/__tests__/origination-close-read-classification.test.ts` —
  new. Drives the real close helper through both reads. Its decisive cases are
  the write assertions: when the brief look-up cannot be read, nothing is
  drafted, published, signed or advanced.
- `src/lib/programs/__tests__/origination-close-outcome.test.ts` — the
  hand-typed stop list is replaced by the module's derived roster, which is what
  makes the suite's own claim about exhaustiveness true; adds the
  unreadable-versus-absent separation, the classification cross-check, and a
  widened state assertion that can express the absent case.
- `src/lib/programs/__tests__/approval.test.ts` — adds the caller-side logging
  cases: a stop that names no check is recorded, the gate verdict is still
  recorded with its checks, and the benign no-op is not recorded at all.
- `docs/architecture/test-ci-coverage-census.json` — regenerated for the one new
  test file (`2903 → 2904` test files, `2739 → 2740` covered and
  pull-request-covered; uncovered unchanged).

## QA / Validation

- `npx jest src/lib/programs/__tests__/origination-close-read-classification.test.ts` — **PASS** (13 cases, all new).
- `npx jest src/lib/programs/__tests__/origination-close-outcome.test.ts` — **PASS** (22 of 22; 14 pre-existing, 8 new).
- `npx jest src/lib/programs/__tests__/approval.test.ts` — **PASS** (37 of 37; 32 pre-existing, 5 new).
- `npx jest src/lib/programs/__tests__ <phase-gate-approval route suite> src/__tests__/integration/programs` — **PASS** (267 suites, 4329 cases, 1 suite / 20 cases skipped as at base).
- Mutation testing — **14 of 14 mutants killed.** The table is in the PR body.
  The decisive mutant is the exact pre-change shape of the brief look-up, whose
  revert fails three cases including the one asserting that nothing is drafted,
  published or signed. **Two mutants survived on the first pass and are recorded
  as such**: one assertion was satisfied by a neighbouring clause of the same
  sentence, and the grouped roster could lose a member without any sweep
  noticing — the first was re-anchored on the claim that can actually go
  missing, the second replaced by a cross-check derived from the sentences. Both
  then killed, and the test comments say why they exist.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — **PASS** (exit 0).
- `npx eslint` on the six changed files — **PASS** (0 errors, 0 warnings).
- Prettier, measured per file in place against the base commit — two changed
  files were already unformatted at base and are left exactly so, with their
  proposed reformats verified to sit away from this release's hunks; the one
  reformat this change introduced in a file that was clean at base has been
  corrected. The other four are clean.
- `npm run audit:tenancy-fence-coverage` — **PASS** (exit 0, no drift).
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**.
- Live signed-in walk — **NOT RUN.** Owed to the workspace owner; see Known
  Gaps.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds
the image from the merge commit and shifts shared Product/Lab web traffic. No
migration, no feature flag, no environment variable, no worker job, and no
manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. This
  release introduces no other deploy path.
- Shared runtime mutators: none. This release runs no Azure command and mutates
  no shared web traffic, revision weight, or Container App template.
- Approved image digest: assigned by the main deploy workflow on merge; not
  pinned by this release.
- ACA runtime invariant: to be proven after deploy by the main deploy workflow's
  own checks — template image, 100%-traffic revision image and required worker
  job images matching the approved digest. This record does not claim it.
- Worker image invariant: unaffected. No worker job image changes.
- Feature/env flag update path: not applicable. No flag or env var changes.
- Live signed-in proof required: **yes**, for the first-phase gate approval
  surface of any enrolled tenant. Not performed by this release, which may
  therefore be called `merged` and `deployed` but **not** `live-proven`.

## Rollback Plan

Revert the squash commit and let the main deploy workflow build and deploy the
prior commit. There is no data migration, no persisted state and no flag, so a
revert is complete on deploy. A reverted build returns the close helper to
creating a second brief when the existing-brief look-up cannot be read, and to
reporting a failed Move read as a Move that does not exist. It does not strand
or corrupt any record written while this release was live: every record this
release writes is one the prior code also wrote, in the same shape.

## Audit Evidence

- PR URL and the required CI contexts on its head commit.
- The mutation table in the PR body, including the pre-change revert and the two
  recorded survivors with the assertions that now kill them.
- The four suite runs listed under QA / Validation.
- The new suite is the readable statement of both reads' contracts: which state
  refuses, which states do not, and — the part that matters — that no document
  is created, published or signed in the refusing one.

## Known Gaps

- **No live signed-in proof.** Nothing here has been exercised against a
  signed-in session on the deployed product. The **regression direction is the
  one that matters**: approving an origination brief on a Move that has one must
  still sign that brief and advance the Move, and a Move without one must still
  get a first brief created and signed. Both refusal directions need a
  data-plane read to fail and are not worth staging against a shared
  environment.
- **Refusing costs an approval that would previously have completed.** When the
  brief look-up cannot be read, the approver loses that attempt and is told to
  look at the Move's documents before trying again. This is the intended trade,
  not a side effect: a duplicated, signed document cannot be undone from the
  product, and a refusal can be retried. If the workspace owner would rather
  accept the duplicate than the refusal here, that is a product call and this is
  the line to revisit.
- **The gate-block stop still does not say that the brief was signed.** When the
  gate reports an unmet required check, the brief has already been created and
  signed by the time the stop is reached, and its sentence names the checks
  without naming that. Re-approving in that state signs again. The wording
  predates this release and is deliberately not changed here, because the stop
  is a real gate verdict whose remedy — clear the named checks — is already the
  correct instruction.
- **The outer catch cannot say which side of the writes it failed on.** Its
  sentence says the approval was recorded and that re-submitting is safe, which
  is true of the approval but cannot be guaranteed of the brief. Making it exact
  means tracking write progress through the helper, which is a larger change
  than this one and is not attempted here.
- **This is one site in a wider class.** The same read-the-rows-ignore-the-error
  shape was measured at roughly two dozen further sites across this product's
  server modules. They are not equivalent: these two were selected because the
  first one's consequence is an unrecoverable write on the act that closes a
  Move's first phase, and the second sits in the same helper and would otherwise
  re-ship the conflation one layer up. The rest want ranking by consequence —
  specifically by whether the unread state reaches a write — rather than a
  sweep.
