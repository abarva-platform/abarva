# 2026-09-23-t744-route-response-contract — A route contract test reads the response, not the route source

## Release ID

`2026-09-23-t744-route-response-contract`

## Status

`candidate`

## Plain-English Summary

One test case claimed to prove that two AI synthesis endpoints tag every answer with the
answer-contract version and the "the model writes the words, the renderer only places them" policy.
It proved nothing of the kind. It opened the two route files as text and checked that five words
appeared somewhere inside them. Any change that kept the words and dropped the behaviour passed.

That case is replaced by four executed cases. Both endpoints are now actually called. The contract
version and the renderer policy are read off the HTTP response the endpoint returns, and the
contract block that goes to the model is read off the argument the endpoint hands to the audited
egress boundary. Nothing is read out of a source file.

The change is test-only. No endpoint, no product surface and no client-visible behaviour is
modified by it.

## Layer Impact

**Release lane: `global-control-lane`.** The verification applies to shared app behaviour for all
clients and is not feature-gated, but it carries no runtime delta of its own.

- **Layer 4 (Products)** — Source and Moves synthesis endpoints. **Verification only.** Their code
  is unchanged; what changed is that the guard over them now runs them.
- Layers 1–3 (client intake, source adapters, canonical model): untouched.

## Client Applicability

- All clients: no behaviour change.
- Specific clients: none.
- Internal only: yes — engineering verification.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/agent/__tests__/module-v6-answer-contract.test.ts` — the byte-matching case is deleted
  and replaced by two parameterised cases over both surfaces (four executed cases). Four boundaries
  are stubbed and no more: the active-client lookup, the audited AI egress preflight, the
  Clerk-backed user-context block and the feature-flag read. The header spread, the packet contract
  and the prompt block are the endpoints' own code, running.
- `docs/architecture/t742-stale-suite-triage.json` — the triage row for that suite gains an
  **appended** `partialSourceTextCasesResolved` note, plus a top-level `followUps` entry. The
  snapshot counts are not restamped (see QA below for why).
- `src/__tests__/behaviors/t742-stale-suite-triage-record.test.ts` — a new control that verifies
  such a resolution note against the live suite file instead of trusting it.

No route file is edited. Mutations used to prove the tests can fail were each reverted from a byte
copy taken before them, and `git status` shows both routes clean.

## QA / Validation

**Clean baseline over the same scope, same command, before and after:**

```
npx jest src/__tests__/behaviors src/lib/agent/__tests__
```

| | Suites | Tests | Failing |
|---|---|---|---|
| Before (clean `origin/main`) | 145 passed / 145 | 1601 passed / 1601 | 0 |
| After | 145 passed / 145 | 1605 passed / 1605 | 0 |

Net +4 cases: the target suite goes 4 → 7, the triage guard 18 → 19. No suite went from green to
red in either direction.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
**exit 0**, 0 `error TS`. The exit code is what is judged here; a bare `npx tsc --noEmit` exits 134
on the authoring machine with no diagnostics, which piped to a grep reports a false clean.

**Lint:** `npx eslint` clean on both changed test files.

### The new cases were broken deliberately, and two of the breaks are the point

The replacement is only worth having if it catches something the deleted case did not. Three
mutations were applied to `src/app/api/source/synthesis/route.ts`, one at a time, each reverted
afterwards:

| Mutation | Deleted byte-matching case | New cases |
|---|---|---|
| A — remove `X-AbarVa-Renderer-Policy` from the header constant | fails | **1 of 7 fails** |
| B — keep the header constant intact, stop spreading it into the error response; all five asserted tokens remain in the file | **passes 1/1** | **1 of 7 fails** |
| C — still compute the contract block, just leave it out of the message sent to the egress boundary; `moduleV6PacketPromptBlock` still appears in the file twice | **passes 1/1** | **1 of 7 fails** |

B and C are the whole reason the item existed: under each, the endpoint has genuinely stopped
honouring the contract and the old case is still green. B and C were re-run against the final
shipped test code after it was refactored off `require()`, not only against the first draft.

### Why the triage row was appended to rather than cleared

The acceptance asked to clear `partialSourceTextCases` for that row. It is the only row in the
record with a non-zero count, so zeroing it turns the record's own
`expect(record.suites.some((s) => (s.partialSourceTextCases ?? 0) > 0)).toBe(true)` red — a
precondition that inverts the gate exactly when the thing it measures improves. Four instances of
that shape were closed earlier the same day; this one was introduced in the same session as the
record.

Two further reasons not to restamp: the row is a snapshot at its base commit and was accurate
there, and another control in the same guard recomputes `jestEvidence.totals` from the rows, so an
edited row silently moves a published total.

So the resolution is **appended beside** the snapshot and a new control checks it against reality:
the cleared case must be one this draw actually named, it must no longer exist in the live suite
file, and the cases named as its replacements must. Broken two ways to confirm it can fail — a note
claiming a rewrite that had not happened, and a note clearing a case the draw never named — each
failing that case and only that case, 1 of 19.

## Rollout Plan

Merge to `main`. No runtime rollout: the change is confined to two test files and one architecture
record, so nothing is built, deployed or flagged.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on merge as it does for
  every commit to `main`. This change contributes no runtime delta.
- Shared runtime mutators: none. No `az` command was run by this work.
- Approved image digest: not applicable — no image change is required by this release.
- ACA runtime invariant: unchanged by this release; the merge deploy's own invariant check applies.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing here renders on a product surface. This release is
  not claimed as live-proven.

## Rollback Plan

Revert the single squash commit. No migration, no data, no flag, no runtime state is involved, so
revert is complete on its own.

## Audit Evidence

- The PR, its diff and its CI run.
- The before/after jest totals above, reproducible with the one command given.
- The mutation table above, reproducible by applying each mutation and re-running the suite.

## Known Gaps

- The two executed cases take each endpoint's cheapest response path — no active client for the
  header assertion, a refused egress preflight for the prompt assertion. The streaming 200 path
  spreads the same header constant and sends the same prompt string, but it is not itself exercised
  here; doing that means standing up a fake Anthropic stream, which is a larger piece of work than
  this item and is not smuggled into it.
- Only the Source endpoint was mutated to prove falsifiability. The Moves endpoint is asserted by
  the same parameterised cases over the same shapes, and was not separately mutated.
