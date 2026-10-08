# 2026-10-08-p0-submit-refusals-read-as-sentences — P0 submit refusals read as sentences

## Release ID

`2026-10-08-p0-submit-refusals-read-as-sentences`

## Status

`candidate`

## Plain-English Summary

When someone fills in the origination brief that starts a Move and the submit
fails, the screen now explains what happened in a sentence they can act on.
Before this change, five of that path's refusals showed them either raw internal
database text or a bare machine word.

The submit screen reads the response's `message` field first and only falls back
to the machine `error` code if `message` is missing. That makes `message` the
sentence a person actually reads, and it outranks the code rather than adding to
it. Five refusals filled it with the wrong thing:

- three put the database driver's own error text there, including the one for the
  write that actually creates the Move — the most likely failure of the five;
- two of those three had a perfectly good sentence already written, but preferred
  the raw text over it, so the sentence only appeared when there was no error
  text to crowd it out;
- the unexpected-failure arm of the route put the raw text there too;
- and the access refusal passed the machine code in as the message, so someone
  whose session lapsed while filling in a long brief was shown the single word
  `unauthenticated`.

Raw driver text is not just unfriendly — it can name a table, a column, a
constraint, or an internal host and port, and these are server-error-class
failures reached from a form any signed-in user can open.

Each of the five now answers with a sentence that says what failed, says that
nothing was saved so nobody goes hunting for a half-created Move, and names the
one action that can actually help. The access refusals get their own wording,
because for those the fix is to sign in again and "submit again" would be wrong
advice. The raw text is still written to the server log at every site, so
operators keep exactly what they had. The machine `error` code is unchanged, so
anything keying on the code is unaffected.

## Layer Impact

- Lane: `global-control-lane`

**Products** — the P0 origination surface. Two product clients post to this
route, and both render `message` ahead of `error`; the change is to what that
field carries. No capture, gate, deliverable, or advance behaviour changes, and
no success-path response field changes.

**Canonical model** — untouched. No schema, no read model, no projection.

## Client Applicability

- All clients: yes — the refusal wording is shared app behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This replaces text on paths that already refuse; it adds
  no new control and opens no new state.

## Changes Included

- `src/lib/programs/origination-submit-failure-text.ts` — **new.** Pure module,
  no database access and no `server-only`, so a suite imports it directly. Two
  code families with one function each: write failures and access failures. Each
  has a defensive final arm so a code added later cannot inherit a named cause's
  wording. Both lookups use `Object.prototype.hasOwnProperty.call`, not `in`, so
  a prototype-chain key cannot be answered as a declared code.
- `src/lib/programs/origination-submit.ts` — four throw sites now pass a
  sentence: `person_lookup_failed`, `person_placeholder_failed`,
  `engagement_insert_failed`, and the `TenancyError` arm. Each logs the raw text
  first under the file's existing `[origination-submit] ...` convention.
- `src/app/api/programs/origination-submit/route.ts` — the unexpected-failure
  arm answers with the sentence and keeps logging the raw text.
- `src/lib/programs/__tests__/origination-submit-failure-text.test.ts` — new, 25
  cases, in a directory already wired as a required CI step.
- `docs/architecture/test-ci-coverage-census.json` — regenerated: +1 test file,
  +1 covered, +1 PR-covered, `uncoveredTestFiles` unchanged at 164.

Six of the eleven throw sites on this path were deliberately left alone: they
already carry authored sentences (`person_not_found`, `forbidden`,
`tenant_resolution_failed`, `unknown_discovery_archetype`, `missing_field`, and
the pattern-authority arm, whose `message` is written text, not driver text).
Routing those through the new module would have changed wording nobody reported
a problem with.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/origination-submit-failure-text.test.ts`:
  25/25.
- **PASS** — whole `src/lib/programs/__tests__` directory: 180 suites, 2,394
  tests. The two pre-existing suites that call this submit path
  (`origination-submit-contract`, `origination-submit.promotion-gate`) pass
  unchanged, which is the regression proof for the throw-site edits.
- **PASS** — `StrategicMoveOriginateClient.test.tsx`: 35/35. This is the client
  whose `message ?? error` precedence makes the field matter.
- **PASS** — `npm run test:behaviors`: 208 suites, 2,163 tests.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` on all four changed files: no findings.
- **PASS** — mutation testing, **14 mutations / 14 killed**. The decisive ones
  revert each of the five sites to what it carried before: route arm to the raw
  message, the three library sites to their driver text (including both
  raw-preferred `?? sentence` forms), and the access arm to the bare code. Also
  killed: a genuine duplicate sentence across two codes; either defensive arm
  borrowing a named cause's wording; either lookup weakened from
  `hasOwnProperty` to `in`; dropping "nothing was saved" from a sentence;
  removing an operator log; telling a signed-out user to just submit again; and
  describing an infrastructure failure as a permissions change.
- **PASS** — census regenerated honestly. Base measured by moving only the new
  test file aside in place, then regenerating: **no change at all**, so this
  base carries no inherited census drift and the committed file was already
  exact. With the test present the regen is exactly +1/+1/+1.
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** — live signed-in walk. No runtime proof is claimed.

An earlier formulation of the duplicate-sentence mutation substituted a
_different_ string rather than a duplicate, so it did not create the condition
it was meant to test and passed. It was reformulated to copy one code's exact
sentence onto another, and then failed as it should. The 14 counted mutations
are the corrected set.

## Rollout Plan

Merge to `main`. No migration, no flag, no worker, no environment variable, and
no Azure action. It reaches users with the next ordinary web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change mutates no runtime.
- Approved image digest: not applicable — no deploy performed here.
- ACA runtime invariant: not asserted; nothing in this release deploys.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable; no flag.
- Live signed-in proof required: yes, before anyone calls this `live-proven`.
  Not performed here.

## Rollback Plan

Revert the PR. The new module has one importer and the four edited sites return
to their previous expressions, which are in the diff verbatim. Nothing persists
state, so there is nothing to unwind and no migration constraint.

## Audit Evidence

- The PR and its CI run.
- The mutation table above, reproducible by reverting any one of the five sites.
- The census diff, which shows the new suite counted as covered — the proof that
  it is wired and not dark.

## Known Gaps

- **No live signed-in walk.** Nothing here is `live-proven`.
- **The status code for one access refusal is arguably wrong and was left
  alone.** The access arm maps `err.code === "unauthenticated" ? 401 : 403`, so
  `tenant_lookup_unavailable` — an infrastructure failure, not a permissions
  decision — answers 403. Its sentence now says plainly that it is not a change
  to the reader's permissions, which removes the misleading part a user can see.
  Moving it to 503 is a status-contract change that other suites may pin, so it
  is recorded here rather than bundled into a wording fix.
- **The agent-tool path has the same shape and is untouched.**
  `commitProgram.ts` builds `engagement_insert_failed: <raw message>` for the
  chat surface. That is a different reader (a model, which may relay it) and a
  different control; it is not covered by this change.
- **The other routes on the walk still have raw-message 500 arms.** Thirteen
  further routes under `src/app/api/v1/programs/` return
  `message: (err as Error).message`, including advance, phase-capture, and
  phase-gate-approval. Whether each is read by a client the way this one is has
  not been measured per route, so no claim is made about them here.
- The sentences name no client and derive no text from tenant data.
