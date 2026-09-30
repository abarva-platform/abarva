# 2026-09-30-t778-intelligence-advisory-rendered-finalize — Replace a source-text case with rendered stream cases and wire the intelligence-advisory test directory

## Release ID

`2026-09-30-t778-intelligence-advisory-rendered-finalize`

## Status

`candidate`

## Plain-English Summary

The Intelligence advisor's test directory
(`src/components/intelligence-advisory/__tests__`, four files) was run by no
continuous-integration job. T-776 held it back because of one case in
`finalize-assistant-message.test.ts`. That case read the source text of
`AdvisoryIntelligencePage.tsx` and checked that the substring
`? finalizeAssistantMessage(m)` appeared in it. A comment containing that text
satisfies it. With the call removed from the stream path and the old text left
behind in a comment, the old file still passes 4 of 4.

This change deletes that case and the file read. It does not sharpen them. Two
rendered cases replace it. Each mounts the page, clicks a starter question, and
releases a controlled `/api/intelligence/ask` stream one chunk at a time, with
no answer packet:

- **The follow-up fence never shows.** The answer text is checked twice: once
  while the stream is still open, and again after it closes.
- **A fence-only answer does not leave the last progress line standing.** Once
  the stream completes, that line must not remain as the finished answer.

The three existing unit cases for `finalizeAssistantMessage` and
`resolveAssistantAnswerText` are unchanged. The whole directory is wired into
the unit-suites job: 4 suites, 20 cases, all green. No product code changes.

**Two guards were found where one was expected.** The stream's delta handler
re-strips the whole accumulated answer on every chunk. The finalizer strips it
again on completion. So on the mounted page, removing only the finalizer's strip
makes no difference to what the reader sees. This held over every chunking tried.
That mutation is caught by the unit case alone, and this record says so rather
than claiming a rendered kill. The mid-stream read is what separates the two
guards: without it, removing the delta strip would also go unseen, because
completion cleans up afterwards.

**One defect was found and not fixed here** (filed as `U-549`). If a chunk
boundary falls inside the follow-up JSON, the delta handler strips the unclosed
opener. The tail of the payload then stays in the visible answer. The finalizer
cannot catch it, because the opener is already gone. This change touches no
product file, so the fix is a separate item.

## Layer Impact

**Release lane: `global-control-lane`.** Shared CI tooling that applies to every
client's build in the same way, with no feature gate.

- **Layer 4 (Products)**: no behaviour change. No route, component, adapter,
  projection or canonical object is touched. The page under test is unchanged.
- **Platform tooling / CI**: one test file rewritten and one job step added. One
  triage record and one control suite are added. The coverage census and the
  dark-directory baseline are updated to match.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. This is CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/components/intelligence-advisory/__tests__/finalize-assistant-message.test.ts`:
  the byte case and the `readFileSync` of the component are deleted, and two
  rendered stream cases are added. 5 cases, replacing 4.
- `.github/workflows/unit-suites.yml`: one new step, `Run the T-778
  intelligence-advisory suites`. It names the directory without a trailing
  slash.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  directory's line is removed.
- `docs/architecture/t778-intelligence-advisory-triage.json`: the record, with
  4 rows. The rewritten suite's row is `sourceTextScanner: false` and is dated
  later than the T-776 row it supersedes. That is how the T-770 refusal control
  resolves classification.
- `src/__tests__/behaviors/t778-intelligence-advisory-wiring.test.ts`: the
  control, 5 cases, which reads every partition out of the record.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with
  `npm run audit:test-ci-coverage:write`. Covered files 2268 → 2273 (the 4 wired
  files plus the new control), uncovered 297 → 293, untriaged unrun 245 → 241.

## QA / Validation

Overall status: **pass**. Every check below was run locally and passed; CI runner proof is recorded after the pull request's run.

**Same-scope baseline, base `c35a38a565` compared with this branch:**

- `npx jest src/components/intelligence-advisory/__tests__`: 0 failing of 19
  before; 0 failing of 20 after.
- `npx jest src/__tests__/behaviors`: 158 suites / 1694 tests / 0 failing
  before, measured in a clean worktree on the base. 159 / 1699 / 0 after. The
  difference is exactly the new control.
- `audit:test-ci-coverage:check`, `audit:triage-record-reconciliation`,
  `test:integration:ci-visibility` and `audit:named-suite-requiredness` all exit
  0.
- `tsc --noEmit` (6 GB heap, buildinfo removed first): exit 0. Scoped `eslint`:
  exit 0.

**The old case could not fail.** The finalizer call in the stream path was
replaced with `m`, and the old substring was left behind in a comment. The base
file passes 4 of 4. The rewritten file fails 1 of 5.

**Subject mutations** to `AdvisoryIntelligencePage.tsx`. Each edit was confirmed
to be a real change before the run, and each was reverted afterwards.

| Mutation | Result | Case that fired |
|---|---|---|
| M1: finalizer call removed from the stream path | 1 of 5 fail | rendered, fence-only completion |
| M2: delta-handler strip removed | 2 of 5 fail | rendered, at the mid-stream assertion |
| M3: strip removed from `finalizeAssistantMessage` only | 1 of 5 fail | unit case only; equivalent on the mounted page |
| M4: both strips removed | 3 of 5 fail | unit case and both rendered cases |
| M5: finalizer keeps `streamStatus` | 1 of 5 fail | rendered, fence-only completion |

**Control, red first.** With the base workflow and base baseline: 2 of 5 fail
(the reach case and the dark-baseline case). After the change: 0 of 5.

**Wiring mutations**, run over the new control, the T-770 scanner refusal and
the product-directory ratchet (16 cases in total):

| Mutation | Result |
|---|---|
| The step's command replaced with `echo skipped` | 2 of 16 fail |
| The rewritten row re-declared a source-text scanner | 4 of 16 fail, T-770 refusing the reach among them |
| The T-778 record dated before T-776 | 3 of 16 fail, as the older scanner row wins again |

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change. The step
becomes active on the next pull request and on push to `main`.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic or DNS.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a, no runtime image change
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no**, because no product surface changes

## Rollback Plan

Revert the pull request. That restores the step's absence, the baseline line,
the old test file and the previous census together. These files are consistent
only as a set. There is nothing to unwind in a running environment.

## Audit Evidence

- The triage record, with run counts for each file and the mutation table.
- The control suite, plus the two mutation tables above.
- Runner proof from the pull request's unit-suites job log: the new step's
  `PASS` lines for each suite and its case total. This is recorded in the
  backlog after the run, not inferred from the YAML.

## Known Gaps

- The finalizer's own strip is redundant on the live path while the delta
  handler re-strips every chunk. It is kept, and guarded by the unit case. It
  becomes the only guard if the delta handler ever stops re-stripping the
  accumulation.
- `U-549`: a follow-up payload split across chunks inside its JSON leaves its
  tail in the visible answer. Not fixed here.
