# 2026-09-19-programs-pattern-key-authority — One authority for a pattern key that becomes audit evidence

## Release ID

`2026-09-19-programs-pattern-key-authority`

## Status

`candidate`

## Plain-English Summary

When a program is created from a matched pattern, the product records which pattern matched. That
record is written into a governed audit row marked "acted upon" and attributed to the classifier, so
anyone reading it later takes it as evidence that a real classification happened.

Three places accepted that pattern key from whoever was calling — a model over chat, a request body,
and the origination form — and wrote it down without checking it against the pattern catalogue. A key
that named nothing, or named a pattern still being authored, or named a retired one, was recorded the
same way a genuine match was.

This change adds one shared resolver. A supplied key is looked up in the pattern catalogue and
accepted only if the catalogue says that pattern is promoted for use. Anything else is refused and
the key is dropped: the audit row is not written, the approval brief carries no pattern, and the
state log records only the reason for the refusal, never the unusable key. A catalogue lookup that
cannot answer refuses too, rather than guessing.

It also repairs a related defect found while implementing that. The classifier's own catalogue query
filtered on three promotion states — `published`, `validated`, `active` — that the database column
cannot hold: the column is constrained to `draft`, `pilot`, `mature`, `deprecated`. That query
therefore returned nothing for every input, so the pattern classifier could not match anything at
all. It now selects on the same promoted states the rest of the product uses.

## Layer Impact

Release lane: `global-control-lane` — shared control-plane behavior for all clients, not gated.

- **Layer 3 · Canonical model** — the pattern catalogue (`engagement_topics`) becomes the single
  declared authority for whether a pattern key may be cited as a match. No schema change; this is a
  read-side gate in front of existing writes.
- **Layer 4 · Products (Moves)** — program origination, the agent's program commit, and the
  origination brief an approver reads. The user-visible difference is that an unusable pattern key
  no longer appears in an approval brief as though it were a match, and the pattern classifier can
  return matches again.

## Client Applicability

- All clients: yes — the gate runs on every origination path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. A new gate behind a flag that defaults off is not a gate.

## Changes Included

- `src/lib/programs/pattern-key-authority.ts` (new) — `resolvePromotedPatternKey`, the promoted
  state list, and the refusal reasons. Fails closed on every path.
- `src/lib/agent/tools/program/commitProgram.ts` — resolves the model-supplied
  `matched_pattern_id` before the approval brief is built and before either audit write.
- `src/lib/programs/mutations.ts` (`originateProgram`) — resolves `acceptedPatternKey` before the
  match row, the state log and the audit-log evidence reference.
- `src/lib/programs/origination-submit.ts` (`submitOriginationBrief`) — resolves `matchedPatternId`
  after the caller is proven allowed to create programs and before any program read or write.
- `src/lib/programs/classifier.ts` — the corpus query now selects on the shared promoted-state list
  instead of three states the column cannot hold.
- `src/lib/programs/__tests__/pattern-key-authority.test.ts`,
  `src/lib/programs/__tests__/pattern-key-authority.writers.test.ts` (new) — the behavioral suites.
- `.github/workflows/ai-surface-control-catalog.yml` — one appended step running both suites.
- `src/lib/agent/tools/__tests__/commitProgram.test.ts` — harness update: the catalogue is staged so
  the key that suite commits with resolves. Its assertion is unchanged and now means more than it
  did.
- `src/lib/programs/__tests__/origination-submit-contract.test.ts` — one stale source literal
  updated, with the reason recorded beside it.

## QA / Validation

**Failing first, identical files either side.** The two new suites were written before the fix and
measured with the new module present but no writer changed: **2 suites failed; 18 tests, 6 failed /
12 passed → 2 suites passed, 20 tests, 0 failing** after (two cases were added later, see the
mutation note). Each of the six named a distinct live defect:

1. the classifier corpus selects promotion states the column cannot hold;
2. `commit_program` writes an unresolved key to `pattern_match_logs`;
3. `commit_program` writes it to `module_state_log.context_jsonb`;
4. `commit_program` carries it into the brief an approver reads;
5. `originateProgram` writes it to `pattern_match_logs`;
6. `submitOriginationBrief` never consults the catalogue at all.

**Scope baseline, same command either side** (`npx jest src/lib/programs src/lib/agent/tools
--runInBand`), measured by restoring the changed files to `origin/main` to take the "before":
**267 suites / 6 failed and 3,655 tests / 7 failed → 269 suites / 6 failed and 3,673 tests / 7
failed.** The six failing suites are byte-identical to the baseline set and none is touched by this
change.

**Thirteen mutations, thirteen caught**, each file byte-restored afterwards and the restore confirmed
with `diff -q`: restore the impossible promotion states; drop the promotion restriction entirely;
write the raw key to `pattern_match_logs` from each of the two writers that do so; write the raw key
to the state log; carry the raw key into the approval brief; skip the resolver in `originateProgram`;
remove the resolver call from `submitOriginationBrief`; make a failed lookup resolve; make a missing
catalogue row resolve; stop checking the promotion state; promote the authoring state; gate on a
state the column cannot hold.

**Two mutations survived their first attempt and the gap was closed rather than recorded.** Writing
the caller's raw key into `pattern_match_logs` survived, because the insert is already guarded on the
resolved key, so the raw expression is unreachable when the key is refused — and identical to it
otherwise, *except* that the resolver matches on the trimmed key. A caller supplying a padded key
would have had a match row written under a string that does not join back to the catalogue row it
cites. Two cases were added asserting the persisted key is the catalogue's, not the caller's; both
mutations fail after them.

**The harness was wrong before the mutations were believed.** The first mutation run reported all
four mutations caught with `Tests: 0 total` — zsh does not word-split an unquoted variable, so jest
received one concatenated path and ran nothing. The harness now asserts it finds tests before any
mutation is trusted. A check that produces no output is not a check that found nothing.

- `npm run typecheck` — exit 0, `typecheck: clean.`
- `npx eslint` over all nine changed files — exit 0, no output.
- The appended workflow step parses under a real YAML loader, resolves to the intended command, and
  that exact command was executed: 2 suites / 20 tests passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — recorded on the pull request.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys. No migration, no data
build, no flag, no manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only authority for
  shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded on the pull request after the deploy run completes.
- ACA runtime invariant: to be read back live — Container App template image == the 100%-traffic
  revision image == both worker job images, digest-pinned.
- Worker image invariant: unchanged by this release; asserted at readback.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes, and owed.** Unlike the recent model-instruction changes, this
  one alters what an approver sees in an origination brief and re-enables classifier matching on the
  origination surface. A signed-in origination run should be captured before this is called
  `live-proven`.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned workflow. Nothing is written that a
rollback would have to undo: the change only ever *withholds* a value from a row. Rows written while
this is live are a strict subset of the rows that would have been written without it.

## Audit Evidence

- Pull request and squash-merge SHA.
- The `AI surface control catalog` CI job's step output for `Exercise the Programs pattern-key
  authority`, showing the suites executing rather than merely present.
- The deploy run, the ACA revision, and the digest readback.
- Backlog item 126 and its verdict entry.

## Known Gaps

- **The promotion-state vocabulary is still split two ways, and this change did not unify it.**
  `/api/v1/programs/patterns` calls `pilot` and `mature` "client visible"; the classifier called
  `published`, `validated` and `active` "promoted"; the migration permits a fourth set. This release
  settles the question only for *what may be cited as a match*. Whether `pilot` should be citable at
  all, or only `mature`, is a product call and is left open.
- **Classification derivation still reads the raw key.** Both `commit_program` and
  `submitOriginationBrief` fold the supplied key into the free text they derive a function/objective
  code from. That is a text signal, not an assertion that a pattern matched, so it was left alone
  deliberately — but it means an unusable key can still nudge a derived code.
- **The classifier repair is proven by unit test, not against a live catalogue.** That the query no
  longer filters on impossible states is proven; that it now returns useful matches for a real tenant
  needs the signed-in check named above.
- **The catalogue is read once per write, uncached.** One indexed single-row lookup on a path that
  already performs several writes; not optimised, and noted so nobody has to rediscover it.
